import { nowIso, type SyncRepository } from '../../../shared/sync';
import type { ScheduleEvent } from '../types';
import { loadEventsFromStorage, saveEventsToStorage } from './events.storage';

function isTombstoned(event: ScheduleEvent): boolean {
  return event.deleted_at != null;
}

/**
 * Repository view over the array-backed events storage, implementing the
 * soft-delete semantics from `docs/spec-cloud-sync.md`.
 *
 * `loadEventsFromStorage()` already lazily back-fills created_at/updated_at,
 * so records reaching this layer always carry them.
 */
export class LocalScheduleEventRepository implements SyncRepository<ScheduleEvent> {
  private readonly listeners = new Set<() => void>();

  async list(): Promise<ScheduleEvent[]> {
    const events = await loadEventsFromStorage();
    return events.filter((event) => !isTombstoned(event));
  }

  async listAll(): Promise<ScheduleEvent[]> {
    return loadEventsFromStorage();
  }

  async get(id: string): Promise<ScheduleEvent | null> {
    const events = await loadEventsFromStorage();
    const event = events.find((candidate) => candidate.id === id);
    if (!event || isTombstoned(event)) return null;
    return event;
  }

  async save(event: ScheduleEvent): Promise<void> {
    const events = await loadEventsFromStorage();
    const index = events.findIndex((candidate) => candidate.id === event.id);
    const next = index >= 0 ? events.map((c, i) => (i === index ? event : c)) : [...events, event];
    await saveEventsToStorage(next);
    this.notify();
  }

  /** Soft delete. Re-removing an already-tombstoned record is a no-op. */
  async remove(id: string): Promise<void> {
    const events = await loadEventsFromStorage();
    const event = events.find((candidate) => candidate.id === id);
    if (!event || isTombstoned(event)) return;

    const now = nowIso();
    await saveEventsToStorage(
      events.map((candidate) =>
        candidate.id === id
          ? { ...candidate, updated_at: now, deleted_at: now, synced_at: null }
          : candidate,
      ),
    );
    this.notify();
  }

  async listPendingSync(): Promise<ScheduleEvent[]> {
    const events = await loadEventsFromStorage();
    return events.filter((event) => event.synced_at == null);
  }

  async markSynced(id: string, syncedAt: string): Promise<void> {
    const events = await loadEventsFromStorage();
    if (!events.some((event) => event.id === id)) return;
    await saveEventsToStorage(
      events.map((event) => (event.id === id ? { ...event, synced_at: syncedAt } : event)),
    );
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export const localScheduleEventRepository = new LocalScheduleEventRepository();
