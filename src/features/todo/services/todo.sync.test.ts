import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../../platform/storage/async-storage';
import { CloudSyncScheduler } from '../../../shared/sync';
import { localTodoRepository } from '../storage/todo.repository';
import { clearTodosCache, saveTodosToStorage } from '../storage/todo.storage';
import { getTodoSyncScheduler, resetTodoSyncForTests } from '../sync';
import type { TodoItem } from '../types';
import {
  addTodo,
  deleteTodo,
  loadTodos,
  subscribeToTodos,
  toggleTodoComplete,
  updateTodo,
} from './todo.service';

const ISO_MS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function makeStoredTodo(overrides: Partial<TodoItem> = {}): TodoItem {
  return {
    id: 'todo-1',
    title: '写线代作业',
    type: 'longterm',
    priority: 'high',
    is_completed: false,
    last_reset: '2026-03-01T00:00:00.000Z',
    created_at: '2026-03-01T00:00:00.000Z',
    updated_at: '2026-03-01T00:00:00.000Z',
    synced_at: '2026-03-01T00:00:01.000Z',
    deleted_at: null,
    ...overrides,
  };
}

describe('todo service cloud-sync integration', () => {
  let notifySpy: jest.SpyInstance;

  beforeEach(async () => {
    await AsyncStorage.clear();
    clearTodosCache();
    resetTodoSyncForTests();
    notifySpy = jest
      .spyOn(getTodoSyncScheduler(), 'notifyLocalChange')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    notifySpy.mockRestore();
    resetTodoSyncForTests();
  });

  it('stamps millisecond sync timestamps on a newly added todo', async () => {
    await addTodo({ title: '复习', type: 'longterm', priority: 'medium' });

    const [stored] = await localTodoRepository.listAll();
    expect(stored.created_at).toMatch(ISO_MS);
    expect(stored.updated_at).toMatch(ISO_MS);
    expect(stored.synced_at).toBeNull();
  });

  it('notifies the scheduler after add, update, toggle, and delete', async () => {
    await addTodo({ title: '复习', type: 'longterm', priority: 'medium' });
    expect(notifySpy).toHaveBeenCalledTimes(1);

    const [stored] = await localTodoRepository.listAll();
    await updateTodo(stored.id, { title: '复习线代', type: 'longterm', priority: 'high' });
    expect(notifySpy).toHaveBeenCalledTimes(2);

    await toggleTodoComplete(stored.id);
    expect(notifySpy).toHaveBeenCalledTimes(3);

    await deleteTodo(stored.id);
    expect(notifySpy).toHaveBeenCalledTimes(4);
  });

  it('deleteTodo tombstones rather than dropping, and hides it from loadTodos', async () => {
    await saveTodosToStorage([makeStoredTodo()]);

    await deleteTodo('todo-1');

    expect(await loadTodos()).toEqual([]);
    const all = await localTodoRepository.listAll();
    expect(all).toHaveLength(1);
    expect(all[0].deleted_at).toMatch(ISO_MS);
    expect(await localTodoRepository.listPendingSync()).toHaveLength(1);
  });

  it('updateTodo clears synced_at so the edit is re-pushed', async () => {
    await saveTodosToStorage([makeStoredTodo()]);

    await updateTodo('todo-1', { title: '改名', type: 'weekly', priority: 'low' });

    const [stored] = await localTodoRepository.listAll();
    expect(stored.title).toBe('改名');
    expect(stored.synced_at).toBeNull();
    expect(stored.updated_at).toMatch(ISO_MS);
  });

  it('loadTodos keeps tombstones on disk while filtering them from the result', async () => {
    await saveTodosToStorage([
      makeStoredTodo({ id: 'active' }),
      makeStoredTodo({ id: 'gone', deleted_at: '2026-03-02T00:00:00.000Z' }),
    ]);

    expect((await loadTodos()).map((t) => t.id)).toEqual(['active']);
    expect((await localTodoRepository.listAll()).map((t) => t.id)).toEqual(['active', 'gone']);
  });
});

/**
 * The row shape the server returns for todos: the unset optional column comes
 * back as an explicit `null`. Before the null-normalization such a row survived
 * the merge write but was discarded by the cold-start validator, which only
 * accepted `undefined` for `notes`.
 */
const SERVER_SHAPED_TODO = {
  id: 'srv-todo-1',
  title: 'Claude 建的待办',
  type: 'longterm',
  priority: 'high',
  is_completed: false,
  last_reset: '2026-09-12T10:00:00.000Z',
  created_at: '2026-09-12T10:00:00.000Z',
  notes: null,
  updated_at: '2026-09-12T10:00:00.000Z',
  synced_at: null,
  deleted_at: null,
} as unknown as TodoItem;

describe('todo sync merge of server-shaped rows', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    clearTodosCache();
    resetTodoSyncForTests();
  });

  afterEach(() => {
    resetTodoSyncForTests();
  });

  /** Drives one full sync cycle with a stub API returning the given records. */
  async function mergeViaScheduler(records: TodoItem[]): Promise<void> {
    const response = {
      server_time: '2026-09-12T11:00:00.000Z',
      records,
    };
    const scheduler = new CloudSyncScheduler<TodoItem>({
      repository: localTodoRepository,
      apiClient: {
        sync: jest.fn().mockResolvedValue(response),
        list: jest.fn().mockResolvedValue(response),
      },
      label: 'todos-test',
    });
    scheduler.start();
    await scheduler.pullNow();
    scheduler.stop();
  }

  it('keeps a server row whose notes is explicit null through merge, cold load and listAll', async () => {
    await mergeViaScheduler([SERVER_SHAPED_TODO]);

    expect(await localTodoRepository.listAll()).toHaveLength(1);

    clearTodosCache();
    const all = await localTodoRepository.listAll();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('srv-todo-1');
    expect(all[0].synced_at).toBe('2026-09-12T11:00:00.000Z');

    expect((await loadTodos()).map((t) => t.id)).toEqual(['srv-todo-1']);
  });

  it('normalizes the explicit null notes to undefined so storage holds one shape', async () => {
    await mergeViaScheduler([SERVER_SHAPED_TODO]);
    clearTodosCache();

    const [stored] = await localTodoRepository.listAll();
    expect(stored.notes).toBeUndefined();
    // `null` for deleted_at is meaningful state, not an absent field.
    expect(stored.deleted_at).toBeNull();

    const raw = JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.todos)) ?? '[]');
    expect(Object.prototype.hasOwnProperty.call(raw[0], 'notes')).toBe(false);
  });

  it('notifies todo subscribers when a remote row is merged in', async () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToTodos(listener);

    try {
      await mergeViaScheduler([SERVER_SHAPED_TODO]);
    } finally {
      unsubscribe();
    }

    expect(listener).toHaveBeenCalled();
  });
});
