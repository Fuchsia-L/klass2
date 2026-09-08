export type CloudSyncStatus =
  | { kind: 'idle'; lastSyncAt: string | null }
  | { kind: 'syncing'; lastSyncAt: string | null }
  | { kind: 'error'; message: string; lastSyncAt: string | null }
  | { kind: 'unconfigured' };

export type CloudSyncStatusListener = (status: CloudSyncStatus) => void;

const KIND_SEVERITY: Record<CloudSyncStatus['kind'], number> = {
  unconfigured: 3,
  error: 2,
  syncing: 1,
  idle: 0,
};

export function lastSyncAtOf(status: CloudSyncStatus): string | null {
  return status.kind === 'unconfigured' ? null : status.lastSyncAt;
}

/**
 * Rolls several schedulers' statuses into the single summary line the settings
 * page shows. The worst kind wins (unconfigured > error > syncing > idle); when
 * every scheduler is idle the *oldest* lastSyncAt is reported, so the summary
 * never looks fresher than the stalest data behind it.
 */
export function summarizeSyncStatuses(statuses: readonly CloudSyncStatus[]): CloudSyncStatus {
  if (statuses.length === 0) return { kind: 'idle', lastSyncAt: null };

  let worst = statuses[0];
  for (const status of statuses) {
    if (KIND_SEVERITY[status.kind] > KIND_SEVERITY[worst.kind]) worst = status;
  }

  if (worst.kind !== 'idle') return worst;

  let oldest: string | null = null;
  for (const status of statuses) {
    const at = lastSyncAtOf(status);
    // A scheduler that has never synced makes the whole summary "never synced".
    if (at == null) return { kind: 'idle', lastSyncAt: null };
    if (oldest == null || at < oldest) oldest = at;
  }
  return { kind: 'idle', lastSyncAt: oldest };
}
