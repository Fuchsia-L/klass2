import type { SyncableRecord, SyncRepository } from './types';

export interface LocalChangeNotifier {
  notifyLocalChange(): void;
}

/**
 * Wraps a local repository so every write nudges the scheduler's 5s debounce.
 * Reads pass straight through.
 */
export class SyncingRepository<T extends SyncableRecord> implements SyncRepository<T> {
  constructor(
    private readonly local: SyncRepository<T>,
    private readonly scheduler: LocalChangeNotifier,
  ) {}

  list(): Promise<T[]> {
    return this.local.list();
  }

  listAll(): Promise<T[]> {
    return this.local.listAll();
  }

  get(id: string): Promise<T | null> {
    return this.local.get(id);
  }

  async save(record: T): Promise<void> {
    await this.local.save(record);
    this.scheduler.notifyLocalChange();
  }

  async remove(id: string): Promise<void> {
    await this.local.remove(id);
    this.scheduler.notifyLocalChange();
  }

  listPendingSync(): Promise<T[]> {
    return this.local.listPendingSync();
  }

  markSynced(id: string, syncedAt: string): Promise<void> {
    return this.local.markSynced(id, syncedAt);
  }

  subscribe(listener: () => void): () => void {
    if (this.local.subscribe) {
      return this.local.subscribe(listener);
    }
    return () => {};
  }
}
