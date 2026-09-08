import { generateId } from '../../../shared/lib/id';
import { nowIso } from '../../../shared/sync';
import { detectConflicts } from '../domain/conflicts';
import { validateEventTimeWindow } from '../domain/validation';
import { localScheduleEventRepository } from '../storage/events.repository';
import {
  clearEventsCache,
  loadEventsFromStorage,
  saveEventsToStorage,
} from '../storage/events.storage';
import { getScheduleSyncScheduler, getSyncingScheduleEventRepository } from '../sync';
import { ScheduleEvent } from '../types';

type EventMutationResult = {
  success: boolean;
  conflicts?: ScheduleEvent[];
  error?: string;
};

type EventInput = Omit<ScheduleEvent, 'id' | 'is_completed'>;

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

async function persist(events: ScheduleEvent[]) {
  await saveEventsToStorage(events);
  notify();
}

/** Active events only — soft-deleted rows are filtered out by the repository. */
export async function loadEvents(): Promise<ScheduleEvent[]> {
  return localScheduleEventRepository.list();
}

export async function replaceImportedEvents(importedEvents: ScheduleEvent[]): Promise<void> {
  importedEvents.forEach((event) => {
    if (!validateEventTimeWindow(event.start_time, event.end_time)) {
      throw new Error(`Invalid imported event time window: ${event.title}`);
    }

    if (event.repeat !== 'none' || event.source !== 'whut-import' || event.is_completed) {
      throw new Error(`Invalid imported event invariant: ${event.title}`);
    }
  });

  const now = nowIso();
  // listAll so existing tombstones survive the rewrite instead of being
  // physically dropped (they still owe the server a push).
  const existingEvents = await localScheduleEventRepository.listAll();
  const preservedEvents = existingEvents.map((event) => {
    if (event.source !== 'whut-import' || event.deleted_at != null) return event;
    // Replaced imports become tombstones so the server drops them too.
    return { ...event, updated_at: now, deleted_at: now, synced_at: null };
  });

  const stampedImports = importedEvents.map((event) => ({
    ...event,
    created_at: event.created_at ?? now,
    updated_at: now,
    synced_at: null,
    deleted_at: null,
  }));

  // Bulk write goes straight to storage, so nudge the scheduler by hand.
  await persist([...preservedEvents, ...stampedImports]);
  getScheduleSyncScheduler().notifyLocalChange();
}

export function subscribeToEvents(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function addEvent(event: EventInput): Promise<EventMutationResult> {
  if (!validateEventTimeWindow(event.start_time, event.end_time)) {
    return {
      success: false,
      error: '事件时间需在 06:00 到 24:00 内，且结束时间必须晚于开始时间',
    };
  }

  const now = nowIso();
  const nextEvent: ScheduleEvent = {
    ...event,
    id: generateId(),
    source: event.source ?? 'manual',
    is_completed: false,
    created_at: now,
    updated_at: now,
    synced_at: null,
    deleted_at: null,
  };

  const events = await loadEvents();
  const conflicts = detectConflicts(nextEvent, events);
  if (conflicts.length > 0) {
    return { success: false, conflicts, error: '与已有事件时间冲突' };
  }

  await getSyncingScheduleEventRepository().save(nextEvent);
  notify();
  return { success: true };
}

export async function updateEvent(event: ScheduleEvent): Promise<EventMutationResult> {
  if (!validateEventTimeWindow(event.start_time, event.end_time)) {
    return {
      success: false,
      error: '事件时间需在 06:00 到 24:00 内，且结束时间必须晚于开始时间',
    };
  }

  const events = await loadEvents();
  const conflicts = detectConflicts(event, events);
  if (conflicts.length > 0) {
    return { success: false, conflicts, error: '与已有事件时间冲突' };
  }

  const existing = events.find((current) => current.id === event.id);
  await getSyncingScheduleEventRepository().save({
    ...event,
    created_at: event.created_at ?? existing?.created_at ?? nowIso(),
    updated_at: nowIso(),
    // A local edit must be re-pushed, so drop the synced marker.
    synced_at: null,
    deleted_at: null,
  });
  notify();
  return { success: true };
}

/** Soft delete: writes a tombstone so the deletion propagates to the server. */
export async function deleteEvent(id: string): Promise<void> {
  await getSyncingScheduleEventRepository().remove(id);
  notify();
}

export async function toggleComplete(id: string): Promise<void> {
  const events = await loadEvents();
  const event = events.find((candidate) => candidate.id === id);
  if (!event) return;

  await getSyncingScheduleEventRepository().save({
    ...event,
    is_completed: !event.is_completed,
    updated_at: nowIso(),
    synced_at: null,
  });
  notify();
}

export function resetEventsState(): void {
  clearEventsCache();
  notify();
}
