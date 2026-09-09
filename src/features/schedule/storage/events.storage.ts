import { loadJSON, saveJSON, STORAGE_KEYS } from '../../../platform/storage/async-storage';
import {
  CategoryKey,
  CATEGORIES,
  RepeatType,
  ScheduleEvent,
  SCHEDULE_EVENT_SOURCES,
} from '../types';

let cachedEvents: ScheduleEvent[] | null = null;

function cloneEvents(events: ScheduleEvent[]): ScheduleEvent[] {
  return events.map((event) => ({ ...normalizeEventRecord(event) }));
}

function isValidRepeatType(value: unknown): value is RepeatType {
  return value === 'none' || value === 'daily' || value === 'weekly';
}

function isValidCategory(value: unknown): value is CategoryKey {
  return typeof value === 'string' && value in CATEGORIES;
}

function isValidDateString(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
}

function isValidIsoDateString(value: unknown): value is string {
  if (typeof value !== 'string') return false;

  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!isoDatePattern.test(value)) return false;

  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === value;
}

/**
 * The optional fields the server materialises as explicit `null` on every row
 * it returns (`POST /v1/schedule` fills the omitted ones with SQL NULL). They
 * are normalised to `undefined` before anything is persisted, so local storage
 * only ever holds one shape; the validators below still accept `null` as a
 * second line of defence for rows written by an older build.
 */
const NULLABLE_EVENT_FIELDS = [
  'repeat_until',
  'location',
  'reminder_minutes',
  'notes',
  'source',
] as const;

/**
 * Strips the server's explicit `null`s off the nullable optional fields.
 * Returns the same reference when there is nothing to strip, so callers can
 * cheaply tell whether a write-back is warranted.
 *
 * `synced_at` / `deleted_at` are deliberately excluded: `null` is their
 * meaningful "not synced" / "not deleted" value, not an absent field.
 */
export function normalizeEventRecord(event: ScheduleEvent): ScheduleEvent {
  let changed = false;
  const next = { ...event } as ScheduleEvent & Record<string, unknown>;
  for (const field of NULLABLE_EVENT_FIELDS) {
    // Cast: the field is typed `T | undefined`, but a row straight off the wire
    // can carry an explicit null that the type does not admit.
    if ((next[field] as unknown) === null) {
      delete next[field];
      changed = true;
    }
  }
  return changed ? next : event;
}

function isValidReminder(value: unknown): value is ScheduleEvent['reminder_minutes'] {
  return value == null || value === 5 || value === 15 || value === 30;
}

function isValidSource(value: unknown): value is ScheduleEvent['source'] {
  return (
    value == null ||
    SCHEDULE_EVENT_SOURCES.includes(value as (typeof SCHEDULE_EVENT_SOURCES)[number])
  );
}

function isValidRepeatUntil(value: unknown): value is ScheduleEvent['repeat_until'] {
  return value == null || isValidIsoDateString(value);
}

function isScheduleEvent(value: unknown): value is ScheduleEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as Record<string, unknown>;
  return (
    typeof event.id === 'string' &&
    typeof event.title === 'string' &&
    isValidCategory(event.category) &&
    isValidDateString(event.start_time) &&
    isValidDateString(event.end_time) &&
    isValidRepeatType(event.repeat) &&
    isValidRepeatUntil(event.repeat_until) &&
    isValidReminder(event.reminder_minutes) &&
    isValidSource(event.source)
  );
}

/**
 * Lazily back-fills the cloud-sync timestamps on records written before the
 * sync layer existed. `deleted_at` stays absent (read as `null` by the
 * repository); `synced_at` is left null so the upgraded row gets pushed once.
 * Returns the same reference when nothing changed, so callers can tell whether
 * a write-back is needed.
 */
function upgradeEventRecord(event: ScheduleEvent, now: string): ScheduleEvent {
  if (typeof event.created_at === 'string' && typeof event.updated_at === 'string') {
    return event;
  }
  return {
    ...event,
    created_at: event.created_at ?? now,
    updated_at: event.updated_at ?? now,
    synced_at: event.synced_at ?? null,
  };
}

export async function loadEventsFromStorage(): Promise<ScheduleEvent[]> {
  if (cachedEvents) return cloneEvents(cachedEvents);

  const data = await loadJSON<unknown>(STORAGE_KEYS.events);
  const rawEvents = Array.isArray(data) ? data : [];
  const validEvents = rawEvents.filter((value, index): value is ScheduleEvent => {
    const valid = isScheduleEvent(value);
    if (!valid) {
      console.warn(`Discarded invalid event at index ${index} from storage`);
    }
    return valid;
  });

  const now = new Date().toISOString();
  let upgraded = false;
  const events = validEvents.map((event) => {
    // Rows written by a build that predates the normalization may still carry
    // the server's explicit nulls; flatten them on the way in too.
    const stripped = normalizeEventRecord(event);
    if (stripped !== event) upgraded = true;
    const next = upgradeEventRecord(stripped, now);
    if (next !== stripped) upgraded = true;
    return next;
  });

  cachedEvents = cloneEvents(events);
  if (upgraded) {
    // Persist the back-filled timestamps so the upgrade happens once.
    await saveJSON(STORAGE_KEYS.events, cachedEvents);
  }
  return cloneEvents(cachedEvents);
}

export async function saveEventsToStorage(events: ScheduleEvent[]): Promise<void> {
  cachedEvents = cloneEvents(events);
  await saveJSON(STORAGE_KEYS.events, cachedEvents);
}

export function clearEventsCache(): void {
  cachedEvents = null;
}
