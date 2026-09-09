import { loadJSON, saveJSON, STORAGE_KEYS } from '../../../platform/storage/async-storage';
import { TodoItem, TodoType, Priority, PRIORITY_ORDER } from '../types';

let cachedTodos: TodoItem[] | null = null;

function cloneTodos(todos: TodoItem[]): TodoItem[] {
  return todos.map((t) => ({ ...normalizeTodoRecord(t) }));
}

/**
 * The optional fields the server materialises as explicit `null` on every row
 * it returns. Normalised to `undefined` before anything is persisted so local
 * storage only ever holds one shape.
 *
 * `synced_at` / `deleted_at` are deliberately excluded: `null` is their
 * meaningful "not synced" / "not deleted" value, not an absent field.
 */
const NULLABLE_TODO_FIELDS = ['notes'] as const;

/**
 * Strips the server's explicit `null`s off the nullable optional fields.
 * Returns the same reference when there is nothing to strip.
 */
export function normalizeTodoRecord(todo: TodoItem): TodoItem {
  let changed = false;
  const next = { ...todo } as TodoItem & Record<string, unknown>;
  for (const field of NULLABLE_TODO_FIELDS) {
    // Cast: the field is typed `string | undefined`, but a row straight off the
    // wire can carry an explicit null that the type does not admit.
    if ((next[field] as unknown) === null) {
      delete next[field];
      changed = true;
    }
  }
  return changed ? next : todo;
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
    // `null` is accepted as a second line of defence: the server returns an
    // explicit null for an unset `notes`, and rows written by a build that
    // predates the normalization may still carry it on disk.
    (t.notes == null || typeof t.notes === 'string')
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
    // Rows written by a build that predates the normalization may still carry
    // the server's explicit nulls; flatten them on the way in too.
    const stripped = normalizeTodoRecord(todo);
    if (stripped !== todo) upgraded = true;
    const next = upgradeTodoRecord(stripped, now);
    if (next !== stripped) upgraded = true;
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
