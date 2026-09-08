import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../../platform/storage/async-storage';
import type { ScheduleEvent } from '../types';
import { LocalScheduleEventRepository } from './events.repository';
import { clearEventsCache, saveEventsToStorage } from './events.storage';

function makeEvent(overrides: Partial<ScheduleEvent> = {}): ScheduleEvent {
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
    synced_at: null,
    deleted_at: null,
    ...overrides,
  };
}

const ISO_MS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

describe('LocalScheduleEventRepository soft delete', () => {
  let repository: LocalScheduleEventRepository;

  beforeEach(async () => {
    await AsyncStorage.clear();
    clearEventsCache();
    repository = new LocalScheduleEventRepository();
  });

  it('remove() writes a tombstone instead of dropping the row', async () => {
    await saveEventsToStorage([makeEvent({ synced_at: '2026-03-02T00:00:00.000Z' })]);

    await repository.remove('evt-1');

    const all = await repository.listAll();
    expect(all).toHaveLength(1);
    expect(all[0].deleted_at).toMatch(ISO_MS);
    expect(all[0].updated_at).toBe(all[0].deleted_at);
    // The tombstone owes the server a push.
    expect(all[0].synced_at).toBeNull();
    // Non-sync fields survive for audit / undelete.
    expect(all[0].title).toBe('线性代数');
  });

  it('list() hides tombstones while listAll() keeps them', async () => {
    await saveEventsToStorage([makeEvent({ id: 'a' }), makeEvent({ id: 'b' })]);

    await repository.remove('a');

    expect((await repository.list()).map((e) => e.id)).toEqual(['b']);
    expect((await repository.listAll()).map((e) => e.id)).toEqual(['a', 'b']);
  });

  it('get() returns null for a tombstoned record', async () => {
    await saveEventsToStorage([makeEvent()]);

    expect(await repository.get('evt-1')).not.toBeNull();
    await repository.remove('evt-1');
    expect(await repository.get('evt-1')).toBeNull();
  });

  it('get() returns null for an unknown id', async () => {
    expect(await repository.get('nope')).toBeNull();
  });

  it('remove() on an already-tombstoned record is a no-op', async () => {
    await saveEventsToStorage([makeEvent()]);

    await repository.remove('evt-1');
    const first = (await repository.listAll())[0].deleted_at;

    await repository.remove('evt-1');
    const second = (await repository.listAll())[0].deleted_at;

    expect(second).toBe(first);
  });

  it('remove() on an unknown id is a no-op', async () => {
    await saveEventsToStorage([makeEvent()]);

    await repository.remove('nope');

    expect(await repository.listAll()).toHaveLength(1);
  });

  it('listPendingSync() returns every unsynced record, tombstones included', async () => {
    await saveEventsToStorage([
      makeEvent({ id: 'synced', synced_at: '2026-03-02T00:00:00.000Z' }),
      makeEvent({ id: 'fresh', synced_at: null }),
      makeEvent({ id: 'doomed', synced_at: '2026-03-02T00:00:00.000Z' }),
    ]);

    await repository.remove('doomed');

    const pending = await repository.listPendingSync();
    expect(pending.map((e) => e.id).sort()).toEqual(['doomed', 'fresh']);
  });

  it('markSynced() stamps synced_at without touching updated_at', async () => {
    await saveEventsToStorage([makeEvent()]);

    await repository.markSynced('evt-1', '2026-03-05T00:00:00.000Z');

    const [stored] = await repository.listAll();
    expect(stored.synced_at).toBe('2026-03-05T00:00:00.000Z');
    expect(stored.updated_at).toBe('2026-03-01T00:00:00.000Z');
  });

  it('markSynced() on an unknown id is a no-op', async () => {
    await saveEventsToStorage([makeEvent()]);

    await repository.markSynced('nope', '2026-03-05T00:00:00.000Z');

    expect((await repository.listAll())[0].synced_at).toBeNull();
  });

  it('save() inserts a new record and updates an existing one', async () => {
    await repository.save(makeEvent({ id: 'a' }));
    expect(await repository.listAll()).toHaveLength(1);

    await repository.save(makeEvent({ id: 'a', title: '改名' }));
    const all = await repository.listAll();
    expect(all).toHaveLength(1);
    expect(all[0].title).toBe('改名');
  });

  it('notifies subscribers on save and remove, and stops after unsubscribe', async () => {
    const listener = jest.fn();
    const unsubscribe = repository.subscribe(listener);

    await repository.save(makeEvent({ id: 'a' }));
    expect(listener).toHaveBeenCalledTimes(1);

    await repository.remove('a');
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    await repository.save(makeEvent({ id: 'b' }));
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
