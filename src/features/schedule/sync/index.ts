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
import { localScheduleEventRepository } from '../storage/events.repository';
import type { ScheduleEvent } from '../types';

export const SCHEDULE_SYNC_ENDPOINTS = {
  syncPath: '/v1/schedule/sync',
  listPath: '/v1/schedule',
} as const;

export type ScheduleSyncScheduler = CloudSyncScheduler<ScheduleEvent>;

let schedulerSingleton: ScheduleSyncScheduler | null = null;
let repositorySingleton: SyncingRepository<ScheduleEvent> | null = null;

export function getScheduleSyncScheduler(options?: {
  initialStatus?: CloudSyncStatus;
}): ScheduleSyncScheduler {
  if (schedulerSingleton == null) {
    schedulerSingleton = new CloudSyncScheduler<ScheduleEvent>({
      repository: localScheduleEventRepository,
      apiClient: new CloudSyncApiClient<ScheduleEvent>({
        getToken: loadSyncToken,
        endpoints: SCHEDULE_SYNC_ENDPOINTS,
      }),
      initialStatus: options?.initialStatus,
      label: 'schedule',
    });
  }
  return schedulerSingleton;
}

/** Repository the events service writes through, so saves trigger the debounce. */
export function getSyncingScheduleEventRepository(): SyncingRepository<ScheduleEvent> {
  if (repositorySingleton == null) {
    repositorySingleton = new SyncingRepository<ScheduleEvent>(
      localScheduleEventRepository,
      getScheduleSyncScheduler(),
    );
  }
  return repositorySingleton;
}

export function resetScheduleSyncForTests(): void {
  schedulerSingleton?.stop();
  schedulerSingleton = null;
  repositorySingleton = null;
}
