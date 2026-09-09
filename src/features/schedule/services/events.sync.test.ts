import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../../platform/storage/async-storage';
import { CloudSyncScheduler } from '../../../shared/sync';
import { clearEventsCache, saveEventsToStorage } from '../storage/events.storage';
import { localScheduleEventRepository } from '../storage/events.repository';
import { getScheduleSyncScheduler, resetScheduleSyncForTests } from '../sync';
import type { ScheduleEvent } from '../types';
import {
  addEvent,
  deleteEvent,
  loadEvents,
  subscribeToEvents,
  toggleComplete,
} from './events.service';

const ISO_MS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function makeStoredEvent(overrides: Partial<ScheduleEvent> = {}): ScheduleEvent {
  return {
    id: 'evt-1',
    title: '线性代数',
    category: '学习',
    start_time: '2026-03-16T08:00:00.000Z',
    end_time: '2026-03-16T09:00:00.000Z',
    repeat: 'none',
    is_completed: false,
    created_at: '2026-03-01T00:00:00.000Z',
    updated_at: '2026-03-01T00:00:00.000Z',
    synced_at: '2026-03-01T00:00:01.000Z',
    deleted_at: null,
    ...overrides,
  };
}

describe('events service cloud-sync integration', () => {
  let notifySpy: jest.SpyInstance;

  beforeEach(async () => {
    await AsyncStorage.clear();
    clearEventsCache();
    resetScheduleSyncForTests();
    notifySpy = jest
      .spyOn(getScheduleSyncScheduler(), 'notifyLocalChange')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    notifySpy.mockRestore();
    resetScheduleSyncForTests();
  });

  it('stamps millisecond sync timestamps on a newly added event', async () => {
    const result = await addEvent({
      title: '高等数学',
      category: '学习',
      start_time: '2026-03-17T08:00:00.000Z',
      end_time: '2026-03-17T09:00:00.000Z',
      repeat: 'none',
    });

    expect(result.success).toBe(true);
    const [stored] = await localScheduleEventRepository.listAll();
    expect(stored.created_at).toMatch(ISO_MS);
    expect(stored.updated_at).toMatch(ISO_MS);
    expect(stored.synced_at).toBeNull();
  });

  it('notifies the scheduler after add, toggle, and delete', async () => {
    await addEvent({
      title: '高等数学',
      category: '学习',
      start_time: '2026-03-17T08:00:00.000Z',
      end_time: '2026-03-17T09:00:00.000Z',
      repeat: 'none',
    });
    expect(notifySpy).toHaveBeenCalledTimes(1);

    const [stored] = await localScheduleEventRepository.listAll();
    await toggleComplete(stored.id);
    expect(notifySpy).toHaveBeenCalledTimes(2);

    await deleteEvent(stored.id);
    expect(notifySpy).toHaveBeenCalledTimes(3);
  });

  it('deleteEvent tombstones rather than dropping, and hides it from loadEvents', async () => {
    await saveEventsToStorage([makeStoredEvent()]);

    await deleteEvent('evt-1');

    expect(await loadEvents()).toEqual([]);
    const all = await localScheduleEventRepository.listAll();
    expect(all).toHaveLength(1);
    expect(all[0].deleted_at).toMatch(ISO_MS);
    // The tombstone is queued for the next push.
    expect(await localScheduleEventRepository.listPendingSync()).toHaveLength(1);
  });

  it('toggleComplete clears synced_at so the change is re-pushed', async () => {
    await saveEventsToStorage([makeStoredEvent()]);

    await toggleComplete('evt-1');

    const [stored] = await localScheduleEventRepository.listAll();
    expect(stored.is_completed).toBe(true);
    expect(stored.synced_at).toBeNull();
    expect(stored.updated_at).toMatch(ISO_MS);
  });
});

/**
 * The exact row shape `POST /v1/schedule` writes and `GET /v1/schedule/sync`
 * returns: every unset optional column comes back as an explicit `null`, the
 * source is 'claude', and start/end are bare Shanghai-local strings with no
 * timezone suffix. Before the null-normalization these rows survived the merge
 * write but were discarded wholesale by the cold-start validator.
 */
const SERVER_SHAPED_ROW = {
  id: 'srv-evt-1',
  title: 'Claude 建的会议',
  category: '学习',
  start_time: '2026-09-12T13:00:00',
  end_time: '2026-09-12T14:00:00',
  repeat: 'none',
  repeat_until: null,
  location: null,
  reminder_minutes: null,
  notes: null,
  source: 'claude',
  is_completed: false,
  created_at: '2026-09-12T10:00:00.000Z',
  updated_at: '2026-09-12T10:00:00.000Z',
  synced_at: null,
  deleted_at: null,
} as unknown as ScheduleEvent;

describe('events sync merge of server-shaped rows', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    clearEventsCache();
    resetScheduleSyncForTests();
  });

  afterEach(() => {
    resetScheduleSyncForTests();
  });

  /** Drives one full sync cycle with a stub API returning the given records. */
  async function mergeViaScheduler(records: ScheduleEvent[]): Promise<void> {
    const response = {
      server_time: '2026-09-12T11:00:00.000Z',
      records,
    };
    const scheduler = new CloudSyncScheduler<ScheduleEvent>({
      repository: localScheduleEventRepository,
      apiClient: {
        sync: jest.fn().mockResolvedValue(response),
        list: jest.fn().mockResolvedValue(response),
      },
      label: 'schedule-test',
    });
    scheduler.start();
    await scheduler.pullNow();
    scheduler.stop();
  }

  it('keeps a server row whose nullable fields are explicit null through merge, cold load and listAll', async () => {
    await mergeViaScheduler([SERVER_SHAPED_ROW]);

    // Survives the merge write itself.
    expect(await localScheduleEventRepository.listAll()).toHaveLength(1);

    // …and the cold start, which is where the validator used to drop it.
    clearEventsCache();
    const all = await localScheduleEventRepository.listAll();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('srv-evt-1');
    expect(all[0].source).toBe('claude');
    expect(all[0].start_time).toBe('2026-09-12T13:00:00');
    expect(all[0].synced_at).toBe('2026-09-12T11:00:00.000Z');

    // It also reaches the UI-facing active list.
    expect((await loadEvents()).map((event) => event.id)).toEqual(['srv-evt-1']);
  });

  it('normalizes the explicit nulls to undefined so storage holds one shape', async () => {
    await mergeViaScheduler([SERVER_SHAPED_ROW]);
    clearEventsCache();

    const [stored] = await localScheduleEventRepository.listAll();
    for (const field of ['repeat_until', 'location', 'reminder_minutes', 'notes'] as const) {
      expect(stored[field]).toBeUndefined();
    }
    // `null` for these two is meaningful state, not an absent field.
    expect(stored.deleted_at).toBeNull();

    // The persisted JSON must not carry the nulls back either.
    const raw = JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.events)) ?? '[]');
    expect(Object.prototype.hasOwnProperty.call(raw[0], 'location')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(raw[0], 'notes')).toBe(false);
  });

  it('notifies event subscribers when a remote row is merged in', async () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToEvents(listener);

    try {
      await mergeViaScheduler([SERVER_SHAPED_ROW]);
    } finally {
      unsubscribe();
    }

    expect(listener).toHaveBeenCalled();
  });
});
