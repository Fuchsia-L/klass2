import { loadJSON, saveJSON, STORAGE_KEYS } from '../../../platform/storage/async-storage';
import { TodoItem, TodoType, Priority, PRIORITY_ORDER } from '../types';

let cachedTodos: TodoItem[] | null = null;

function cloneTodos(todos: TodoItem[]): TodoItem[] {
  return todos.map((t) => ({ ...t }));
}

function isValidTodoType(v: unknown): v is TodoType {
  return v === 'daily' || v === 'weekly' || v === 'longterm';
}

function isValidPriority(v: unknown): v is Priority {
  return v === 'high' || v === 'medium' || v === 'low';
}

function isTodoItem(v: unknown): v is TodoItem {
  if (!v || typeof v !== 'object') return false;
  const t = v as Record<string, unknown>;
  return (
    typeof t.id === 'string' &&
    typeof t.title === 'string' &&
    isValidTodoType(t.type) &&
    isValidPriority(t.priority) &&
    typeof t.is_completed === 'boolean' &&
    typeof t.last_reset === 'string' &&
    typeof t.created_at === 'string' &&
    (t.notes === undefined || typeof t.notes === 'string')
  );
}

/**
 * Lazily back-fills the cloud-sync timestamps on todos written before the sync
 * layer existed. `created_at` was already required, so only `updated_at` needs
 * seeding (from `created_at`, which is the truthful "last known write" for a
 * pre-sync record). `deleted_at` absent = active.
 */
function upgradeTodoRecord(todo: TodoItem, now: string): TodoItem {
  if (typeof todo.updated_at === 'string') return todo;
  return {
    ...todo,
    created_at: todo.created_at ?? now,
    updated_at: todo.created_at ?? now,
    synced_at: todo.synced_at ?? null,
  };
}

export async function loadTodosFromStorage(): Promise<TodoItem[]> {
  if (cachedTodos) return cloneTodos(cachedTodos);

  const data = await loadJSON<unknown>(STORAGE_KEYS.todos);
  const raw = Array.isArray(data) ? data : [];
  const valid = raw.filter((v, i): v is TodoItem => {
    const ok = isTodoItem(v);
    if (!ok) console.warn(`Discarded invalid todo at index ${i}`);
    return ok;
  });

  const now = new Date().toISOString();
  let upgraded = false;
  const todos = valid.map((todo) => {
    const next = upgradeTodoRecord(todo, now);
    if (next !== todo) upgraded = true;
    return next;
  });

  cachedTodos = cloneTodos(todos);
  if (upgraded) {
    // Persist the back-filled timestamps so the upgrade happens once.
    await saveJSON(STORAGE_KEYS.todos, cachedTodos);
  }
  return cloneTodos(cachedTodos);
}

export async function saveTodosToStorage(todos: TodoItem[]): Promise<void> {
  const snapshot = cloneTodos(todos);
  await saveJSON(STORAGE_KEYS.todos, snapshot);
  cachedTodos = snapshot;
}

export function clearTodosCache(): void {
  cachedTodos = null;
}
