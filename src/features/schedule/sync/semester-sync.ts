import { CloudSyncApiClient, nowIso, type SyncableRecord } from '../../../shared/sync';
// Read-only reuse of the single SYNC_TOKEN; rating/sync is off-limits for edits.
import { loadSyncToken } from '../../rating/sync/wiring';
import type { SemesterConfig } from '../types';

export const SEMESTER_CONFIG_PATH = '/v1/config/semester';

export type SemesterConfigPayload = SemesterConfig & { updated_at: string };

// The generic client is parameterised by a record type it only uses for the
// sync/list helpers; semester goes through the raw `request` helper instead,
// so the parameter is inert here.
type UnusedRecord = SyncableRecord;

let clientSingleton: CloudSyncApiClient<UnusedRecord> | null = null;

function getClient(): CloudSyncApiClient<UnusedRecord> {
  if (clientSingleton == null) {
    clientSingleton = new CloudSyncApiClient<UnusedRecord>({
      getToken: loadSyncToken,
      // Unused for semester, but the client requires an endpoint pair.
      endpoints: { syncPath: SEMESTER_CONFIG_PATH, listPath: SEMESTER_CONFIG_PATH },
    });
  }
  return clientSingleton;
}

/**
 * Pushes the semester config with `PUT /v1/config/semester` (LWW on
 * `updated_at`). Fire-and-forget from the save path: a failure must not block
 * the local write, so the caller swallows the rejection.
 */
export async function pushSemesterConfig(config: SemesterConfig): Promise<void> {
  const payload: SemesterConfigPayload = {
    start_date: config.start_date,
    total_weeks: config.total_weeks,
    updated_at: nowIso(),
  };

  await getClient().request<unknown>({
    method: 'PUT',
    path: SEMESTER_CONFIG_PATH,
    body: JSON.stringify(payload),
  });
}

export function resetSemesterSyncForTests(): void {
  clientSingleton = null;
}
