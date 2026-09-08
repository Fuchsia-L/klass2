import {
  CloudSyncError,
  type CloudSyncRequest,
  type CloudSyncResponse,
} from './api-client';
import type { CloudSyncStatus, CloudSyncStatusListener } from './sync-state';
import type { SyncableRecord, SyncRepository } from './types';

export interface CloudSyncClient<T extends SyncableRecord> {
  sync(request: CloudSyncRequest<T>): Promise<CloudSyncResponse<T>>;
  list(since: string | null): Promise<CloudSyncResponse<T>>;
}

export interface CloudSyncSchedulerOptions<T extends SyncableRecord> {
  // Must be the unwrapped local repository. Passing a SyncingRepository would
  // make the scheduler's own merge-phase writes re-enter notifyLocalChange()
  // → debounce → another sync.
  repository: SyncRepository<T>;
  apiClient: CloudSyncClient<T>;
  initialStatus?: CloudSyncStatus;
  /** Label used in per-record error logs (e.g. 'schedule', 'todos'). */
  label?: string;
}

export const DEBOUNCE_MS = 5_000;
export const BACKOFF_SCHEDULE_MS = [5_000, 30_000, 120_000, 300_000];

export const TOKEN_INVALID_MESSAGE = 'token 无效';

/**
 * Debounce-5s push + foreground pull + exponential backoff, per
 * `docs/spec-cloud-sync.md`. Generic over the record type; one instance per
 * synced collection.
 */
export class CloudSyncScheduler<T extends SyncableRecord> {
  private readonly repository: SyncRepository<T>;
  private readonly apiClient: CloudSyncClient<T>;
  private readonly label: string;
  private status: CloudSyncStatus;
  private readonly listeners = new Set<CloudSyncStatusListener>();
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private retryAttempt = 0;
  private started = false;
  private syncing = false;
  private pendingRun = false;

  constructor(options: CloudSyncSchedulerOptions<T>) {
    this.repository = options.repository;
    this.apiClient = options.apiClient;
    this.label = options.label ?? 'cloud';
    this.status = options.initialStatus ?? { kind: 'idle', lastSyncAt: null };
  }

  start(): void {
    this.started = true;
    if (this.status.kind === 'unconfigured') {
      this.setStatus({ kind: 'idle', lastSyncAt: null });
    }
    // A fresh token written after a 401/403 should re-arm the scheduler without
    // the caller also having to call pullNow().
    if (this.status.kind === 'error' && this.status.message === TOKEN_INVALID_MESSAGE) {
      void this.runSync();
    }
  }

  stop(): void {
    this.started = false;
    this.clearDebounce();
    this.clearRetry();
    this.retryAttempt = 0;
    this.pendingRun = false;
  }

  notifyLocalChange(): void {
    if (!this.started) return;
    // A local change during backoff resets backoff and restarts the 5s debounce.
    this.clearRetry();
    this.retryAttempt = 0;
    if (this.debounceTimer != null) return;
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      void this.runSync();
    }, DEBOUNCE_MS);
  }

  async pullNow(): Promise<void> {
    if (!this.started) return;
    this.clearDebounce();
    this.clearRetry();
    await this.runSync();
  }

  getStatus(): CloudSyncStatus {
    return this.status;
  }

  onStatusChange(listener: CloudSyncStatusListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setStatus(next: CloudSyncStatus): void {
    this.status = next;
    this.listeners.forEach((listener) => listener(next));
  }

  private getLastSyncAt(): string | null {
    if (this.status.kind === 'unconfigured') return null;
    return this.status.lastSyncAt;
  }

  private async runSync(): Promise<void> {
    if (this.syncing) {
      // A local change (or pullNow) arrived mid-sync — re-run once it settles.
      this.pendingRun = true;
      return;
    }
    this.syncing = true;
    const prevLastSyncAt = this.getLastSyncAt();
    this.setStatus({ kind: 'syncing', lastSyncAt: prevLastSyncAt });

    try {
      const response = await this.doSync();
      this.retryAttempt = 0;
      const lastSyncAt = response.server_time ?? prevLastSyncAt;
      this.setStatus({ kind: 'idle', lastSyncAt });
    } catch (error) {
      this.handleSyncError(error, prevLastSyncAt);
    } finally {
      this.syncing = false;
      if (this.pendingRun && this.started) {
        this.pendingRun = false;
        this.clearRetry();
        this.retryAttempt = 0;
        void this.runSync();
      }
    }
  }

  private async doSync(): Promise<CloudSyncResponse<T>> {
    const pending = await this.repository.listPendingSync();
    const since = await this.computeSince();

    const response = await this.apiClient.sync({ records: pending, since });

    const serverTime = response.server_time ?? new Date().toISOString();
    await this.mergeRemoteRecords(response.records ?? [], serverTime);

    const rejected = new Set(
      (response.errors ?? [])
        .map((entry) => entry.id)
        .filter((id): id is string => typeof id === 'string'),
    );
    for (const pushed of pending) {
      if (rejected.has(pushed.id)) continue;
      await this.repository.markSynced(pushed.id, serverTime);
    }

    if ((response.errors ?? []).length > 0) {
      console.warn(`Cloud sync (${this.label}) reported per-record errors`, response.errors);
    }

    return response;
  }

  private async computeSince(): Promise<string | null> {
    // listAll so synced tombstones advance the cursor too; otherwise the server
    // re-sends them every cycle.
    const all = await this.repository.listAll();
    let max: string | null = null;
    for (const record of all) {
      const updatedAt = record.updated_at;
      // A record without updated_at can't advance the cursor; the storage
      // layer's lazy upgrade means this should not happen in practice.
      if (updatedAt == null) continue;
      if (max === null || updatedAt > max) max = updatedAt;
    }
    return max;
  }

  private async mergeRemoteRecords(remotes: readonly T[], serverTime: string): Promise<void> {
    if (remotes.length === 0) return;
    // listAll includes tombstones, so a newer local delete isn't blindly
    // overwritten by an older remote row.
    const all = await this.repository.listAll();
    const localById = new Map(all.map((record) => [record.id, record]));
    for (const remote of remotes) {
      const local = localById.get(remote.id);
      // Missing timestamps lose the comparison: an un-upgraded local row must
      // not shadow a server-canonical one, and a remote without updated_at
      // must not clobber a locally-timestamped row.
      if (local && (local.updated_at ?? '') >= (remote.updated_at ?? '')) continue;
      await this.repository.save({ ...remote, synced_at: serverTime });
    }
  }

  private handleSyncError(error: unknown, prevLastSyncAt: string | null): void {
    if (error instanceof CloudSyncError) {
      if (error.isMissingToken || error.statusCode === 401 || error.statusCode === 403) {
        this.clearRetry();
        this.retryAttempt = 0;
        this.setStatus({
          kind: 'error',
          message: TOKEN_INVALID_MESSAGE,
          lastSyncAt: prevLastSyncAt,
        });
        return;
      }

      const delay = this.delayForAttempt(this.retryAttempt);
      this.retryAttempt += 1;
      this.setStatus({
        kind: 'error',
        message: this.formatRetryMessage(error, delay),
        lastSyncAt: prevLastSyncAt,
      });
      this.scheduleRetry(delay);
      return;
    }

    const delay = this.delayForAttempt(this.retryAttempt);
    this.retryAttempt += 1;
    const seconds = Math.round(delay / 1000);
    this.setStatus({
      kind: 'error',
      message: `网络异常 · ${seconds}s 后重试`,
      lastSyncAt: prevLastSyncAt,
    });
    this.scheduleRetry(delay);
  }

  private formatRetryMessage(error: CloudSyncError, delayMs: number): string {
    const seconds = Math.round(delayMs / 1000);
    if (error.isTimeout) return `超时 · ${seconds}s 后重试`;
    if (error.statusCode && error.statusCode >= 500) {
      return `服务端异常 · ${seconds}s 后重试`;
    }
    return `网络异常 · ${seconds}s 后重试`;
  }

  private delayForAttempt(attempt: number): number {
    const idx = Math.min(attempt, BACKOFF_SCHEDULE_MS.length - 1);
    return BACKOFF_SCHEDULE_MS[idx];
  }

  private scheduleRetry(delayMs: number): void {
    if (!this.started) return;
    this.clearRetry();
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      void this.runSync();
    }, delayMs);
  }

  private clearDebounce(): void {
    if (this.debounceTimer != null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  private clearRetry(): void {
    if (this.retryTimer != null) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }
}
