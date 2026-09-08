import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearEventsCache, saveEventsToStorage } from '../storage/events.storage';
import { localScheduleEventRepository } from '../storage/events.repository';
import { getScheduleSyncScheduler, resetScheduleSyncForTests } from '../sync';
import type { ScheduleEvent } from '../types';
import { addEvent, deleteEvent, loadEvents, toggleComplete } from './events.service';

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
