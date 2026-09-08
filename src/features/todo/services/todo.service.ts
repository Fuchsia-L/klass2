import { generateId } from '../../../shared/lib/id';
import { nowIso } from '../../../shared/sync';
import { refreshTodos } from '../domain/refresh';
import { localTodoRepository } from '../storage/todo.repository';
import { clearTodosCache, loadTodosFromStorage, saveTodosToStorage } from '../storage/todo.storage';
import { getSyncingTodoRepository, getTodoSyncScheduler } from '../sync';
import { Priority, TodoItem, TodoType } from '../types';

export type TodoInput = {
  title: string;
  type: TodoType;
  priority: Priority;
  notes?: string;
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

async function persist(todos: TodoItem[]) {
  await saveTodosToStorage(todos);
  notify();
}

/** Active todos only — soft-deleted rows are filtered out. */
export async function loadTodos(): Promise<TodoItem[]> {
  // listAll: the periodic reset must rewrite the full array, tombstones
  // included, or they would be physically dropped on write-back.
  const all = await localTodoRepository.listAll();
  const refreshed = refreshTodos(all);
  if (refreshed !== all) {
    const now = nowIso();
    // Reset rows changed locally, so they owe the server a push.
    const stamped = refreshed.map((todo, index) =>
      todo === all[index] ? todo : { ...todo, updated_at: now, synced_at: null },
    );
    await persist(stamped);
    getTodoSyncScheduler().notifyLocalChange();
    return stamped.filter((todo) => todo.deleted_at == null);
  }
  return all.filter((todo) => todo.deleted_at == null);
}

export function subscribeToTodos(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function addTodo(input: TodoInput): Promise<void> {
  const now = nowIso();
  const todo: TodoItem = {
    id: generateId(),
    title: input.title,
    type: input.type,
    priority: input.priority,
    is_completed: false,
    last_reset: now,
    created_at: now,
    notes: input.notes,
    updated_at: now,
    synced_at: null,
    deleted_at: null,
  };
  await getSyncingTodoRepository().save(todo);
  notify();
}

export async function updateTodo(id: string, input: TodoInput): Promise<void> {
  const todos = await loadTodos();
  const existing = todos.find((t) => t.id === id);
  if (!existing) return;

  await getSyncingTodoRepository().save({
    ...existing,
    title: input.title,
    type: input.type,
    priority: input.priority,
    notes: input.notes,
    updated_at: nowIso(),
    synced_at: null,
  });
  notify();
}

/** Soft delete: writes a tombstone so the deletion propagates to the server. */
export async function deleteTodo(id: string): Promise<void> {
  await getSyncingTodoRepository().remove(id);
  notify();
}

export async function toggleTodoComplete(id: string): Promise<void> {
  const todos = await loadTodos();
  const existing = todos.find((t) => t.id === id);
  if (!existing) return;

  const now = nowIso();
  await getSyncingTodoRepository().save({
    ...existing,
    is_completed: !existing.is_completed,
    last_reset: now,
    updated_at: now,
    synced_at: null,
  });
  notify();
}

export function resetTodosState(): void {
  clearTodosCache();
  notify();
}
