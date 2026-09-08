import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../../platform/storage/async-storage';
import type { TodoItem } from '../types';
import { LocalTodoRepository } from './todo.repository';
import { clearTodosCache, loadTodosFromStorage, saveTodosToStorage } from './todo.storage';

function makeTodo(overrides: Partial<TodoItem> = {}): TodoItem {
  return {
    id: 'todo-1',
    title: '写线代作业',
    type: 'daily',
    priority: 'high',
    is_completed: false,
    last_reset: '2026-03-01T00:00:00.000Z',
    created_at: '2026-03-01T00:00:00.000Z',
    updated_at: '2026-03-01T00:00:00.000Z',
    synced_at: null,
    deleted_at: null,
    ...overrides,
  };
}

const ISO_MS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

describe('LocalTodoRepository soft delete', () => {
  let repository: LocalTodoRepository;

  beforeEach(async () => {
    await AsyncStorage.clear();
    clearTodosCache();
    repository = new LocalTodoRepository();
  });

  it('remove() writes a tombstone instead of dropping the row', async () => {
    await saveTodosToStorage([makeTodo({ synced_at: '2026-03-02T00:00:00.000Z' })]);

    await repository.remove('todo-1');

    const all = await repository.listAll();
    expect(all).toHaveLength(1);
    expect(all[0].deleted_at).toMatch(ISO_MS);
    expect(all[0].updated_at).toBe(all[0].deleted_at);
    expect(all[0].synced_at).toBeNull();
    expect(all[0].title).toBe('写线代作业');
  });

  it('list() hides tombstones while listAll() keeps them', async () => {
    await saveTodosToStorage([makeTodo({ id: 'a' }), makeTodo({ id: 'b' })]);

    await repository.remove('a');

    expect((await repository.list()).map((t) => t.id)).toEqual(['b']);
    expect((await repository.listAll()).map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('get() returns null for a tombstoned record', async () => {
    await saveTodosToStorage([makeTodo()]);

    expect(await repository.get('todo-1')).not.toBeNull();
    await repository.remove('todo-1');
    expect(await repository.get('todo-1')).toBeNull();
  });

  it('remove() on an already-tombstoned record is a no-op', async () => {
    await saveTodosToStorage([makeTodo()]);

    await repository.remove('todo-1');
    const first = (await repository.listAll())[0].deleted_at;

    await repository.remove('todo-1');

    expect((await repository.listAll())[0].deleted_at).toBe(first);
  });

  it('listPendingSync() returns every unsynced record, tombstones included', async () => {
    await saveTodosToStorage([
      makeTodo({ id: 'synced', synced_at: '2026-03-02T00:00:00.000Z' }),
      makeTodo({ id: 'fresh', synced_at: null }),
      makeTodo({ id: 'doomed', synced_at: '2026-03-02T00:00:00.000Z' }),
    ]);

    await repository.remove('doomed');

    expect((await repository.listPendingSync()).map((t) => t.id).sort()).toEqual([
      'doomed',
      'fresh',
    ]);
  });

  it('markSynced() stamps synced_at without touching updated_at', async () => {
    await saveTodosToStorage([makeTodo()]);

    await repository.markSynced('todo-1', '2026-03-05T00:00:00.000Z');

    const [stored] = await repository.listAll();
    expect(stored.synced_at).toBe('2026-03-05T00:00:00.000Z');
    expect(stored.updated_at).toBe('2026-03-01T00:00:00.000Z');
  });

  it('notifies subscribers on save and remove', async () => {
    const listener = jest.fn();
    const unsubscribe = repository.subscribe(listener);

    await repository.save(makeTodo({ id: 'a' }));
    await repository.remove('a');
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    await repository.save(makeTodo({ id: 'b' }));
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe('todo storage lazy sync-field upgrade', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    clearTodosCache();
  });

  it('seeds updated_at from created_at for pre-sync todos', async () => {
    const legacy = {
      id: 'legacy-1',
      title: '旧待办',
      type: 'weekly',
      priority: 'low',
      is_completed: false,
      last_reset: '2026-02-01T00:00:00.000Z',
      created_at: '2026-01-15T09:30:00.000Z',
    };
    await AsyncStorage.setItem(STORAGE_KEYS.todos, JSON.stringify([legacy]));

    const [todo] = await loadTodosFromStorage();

    // created_at is the truthful "last known write" for a pre-sync record.
    expect(todo.updated_at).toBe('2026-01-15T09:30:00.000Z');
    expect(todo.created_at).toBe('2026-01-15T09:30:00.000Z');
    expect(todo.synced_at).toBeNull();
    expect(todo.deleted_at ?? null).toBeNull();
  });

  it('writes the upgrade back so it happens only once', async () => {
    const legacy = {
      id: 'legacy-2',
      title: '旧待办',
      type: 'daily',
      priority: 'medium',
      is_completed: false,
      last_reset: '2026-02-01T00:00:00.000Z',
      created_at: '2026-01-15T09:30:00.000Z',
    };
    await AsyncStorage.setItem(STORAGE_KEYS.todos, JSON.stringify([legacy]));

    await loadTodosFromStorage();

    const persisted = JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.todos)) ?? '[]');
    expect(persisted[0].updated_at).toBe('2026-01-15T09:30:00.000Z');
    expect(persisted[0].synced_at).toBeNull();
  });

  it('leaves todos that already carry sync fields untouched', async () => {
    const synced = makeTodo({ id: 'kept', synced_at: '2026-03-02T00:00:00.000Z' });
    await AsyncStorage.setItem(STORAGE_KEYS.todos, JSON.stringify([synced]));

    await expect(loadTodosFromStorage()).resolves.toEqual([synced]);
  });
});
