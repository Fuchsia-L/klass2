import React from 'react';
import { getConfiguredSyncScheduler } from '../../rating/sync/wiring';
import { getScheduleSyncScheduler } from '../../schedule/sync';
import { getTodoSyncScheduler } from '../../todo/sync';
import { summarizeSyncStatuses, type CloudSyncStatus } from '../../../shared/sync';

/** Anything exposing the scheduler status contract (rating's, or the generic one). */
type StatusSource = {
  getStatus(): CloudSyncStatus;
  onStatusChange(listener: (status: CloudSyncStatus) => void): () => void;
};

function collectSources(): StatusSource[] {
  return [
    // The rating scheduler predates the generic framework but exposes an
    // identical status shape, so it summarises alongside the other two.
    getConfiguredSyncScheduler() as unknown as StatusSource,
    getScheduleSyncScheduler(),
    getTodoSyncScheduler(),
  ];
}

/**
 * One summary line covering ratings + schedule + todos: the worst status wins,
 * and when all three are idle the oldest lastSyncAt is shown, so the line never
 * looks fresher than the stalest of the three.
 */
export function useAggregateSyncStatus(): CloudSyncStatus {
  const [status, setStatus] = React.useState<CloudSyncStatus>(() =>
    summarizeSyncStatuses(collectSources().map((source) => source.getStatus())),
  );

  React.useEffect(() => {
    const sources = collectSources();
    const recompute = () =>
      setStatus(summarizeSyncStatuses(sources.map((source) => source.getStatus())));

    recompute();
    const unsubscribes = sources.map((source) => source.onStatusChange(recompute));
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  return status;
}
