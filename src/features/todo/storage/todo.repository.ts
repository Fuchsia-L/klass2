import { nowIso, type SyncRepository } from '../../../shared/sync';
import type { TodoItem } from '../types';
import { loadTodosFromStorage, saveTodosToStorage } from './todo.storage';

function isTombstoned(todo: TodoItem): boolean {
  return todo.deleted_at != null;
}

/**
 * Repository view over the array-backed todo storage, implementing the
 * soft-delete semantics from `docs/spec-cloud-sync.md`.
 */
export class LocalTodoRepository implements SyncRepository<TodoItem> {
  private readonly listeners = new Set<() => void>();

  async list(): Promise<TodoItem[]> {
    const todos = await loadTodosFromStorage();
    return todos.filter((todo) => !isTombstoned(todo));
  }

  async listAll(): Promise<TodoItem[]> {
    return loadTodosFromStorage();
  }

  async get(id: string): Promise<TodoItem | null> {
    const todos = await loadTodosFromStorage();
    const todo = todos.find((candidate) => candidate.id === id);
    if (!todo || isTombstoned(todo)) return null;
    return todo;
  }

  async save(todo: TodoItem): Promise<void> {
    const todos = await loadTodosFromStorage();
    const index = todos.findIndex((candidate) => candidate.id === todo.id);
    const next = index >= 0 ? todos.map((c, i) => (i === index ? todo : c)) : [...todos, todo];
    await saveTodosToStorage(next);
    this.notify();
  }

  /** Soft delete. Re-removing an already-tombstoned record is a no-op. */
  async remove(id: string): Promise<void> {
    const todos = await loadTodosFromStorage();
    const todo = todos.find((candidate) => candidate.id === id);
    if (!todo || isTombstoned(todo)) return;

    const now = nowIso();
    await saveTodosToStorage(
      todos.map((candidate) =>
        candidate.id === id
          ? { ...candidate, updated_at: now, deleted_at: now, synced_at: null }
          : candidate,
      ),
    );
    this.notify();
  }

  async listPendingSync(): Promise<TodoItem[]> {
    const todos = await loadTodosFromStorage();
    return todos.filter((todo) => todo.synced_at == null);
  }

  async markSynced(id: string, syncedAt: string): Promise<void> {
    const todos = await loadTodosFromStorage();
    if (!todos.some((todo) => todo.id === id)) return;
    await saveTodosToStorage(
      todos.map((todo) => (todo.id === id ? { ...todo, synced_at: syncedAt } : todo)),
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

export const localTodoRepository = new LocalTodoRepository();
