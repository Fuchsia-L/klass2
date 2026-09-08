import {
  CloudSyncApiClient,
  CloudSyncScheduler,
  SyncingRepository,
  type CloudSyncStatus,
} from '../../../shared/sync';
// Reuses the single existing SYNC_TOKEN (AsyncStorage key `cs-rn:sync-token`).
// Imported from the module directly rather than the rating barrel to avoid
// pulling UI components into the sync graph. Read-only use; rating/sync is
// off-limits for edits.
import { loadSyncToken } from '../../rating/sync/wiring';
import { localTodoRepository } from '../storage/todo.repository';
import type { TodoItem } from '../types';

export const TODO_SYNC_ENDPOINTS = {
  syncPath: '/v1/todos/sync',
  listPath: '/v1/todos',
} as const;

export type TodoSyncScheduler = CloudSyncScheduler<TodoItem>;

let schedulerSingleton: TodoSyncScheduler | null = null;
let repositorySingleton: SyncingRepository<TodoItem> | null = null;

export function getTodoSyncScheduler(options?: {
  initialStatus?: CloudSyncStatus;
}): TodoSyncScheduler {
  if (schedulerSingleton == null) {
    schedulerSingleton = new CloudSyncScheduler<TodoItem>({
      repository: localTodoRepository,
      apiClient: new CloudSyncApiClient<TodoItem>({
        getToken: loadSyncToken,
        endpoints: TODO_SYNC_ENDPOINTS,
      }),
      initialStatus: options?.initialStatus,
      label: 'todos',
    });
  }
  return schedulerSingleton;
}

/** Repository the todo service writes through, so saves trigger the debounce. */
export function getSyncingTodoRepository(): SyncingRepository<TodoItem> {
  if (repositorySingleton == null) {
    repositorySingleton = new SyncingRepository<TodoItem>(
      localTodoRepository,
      getTodoSyncScheduler(),
    );
  }
  return repositorySingleton;
}

export function resetTodoSyncForTests(): void {
  schedulerSingleton?.stop();
  schedulerSingleton = null;
  repositorySingleton = null;
}
