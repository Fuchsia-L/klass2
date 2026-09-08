import { getConfiguredSyncScheduler } from '../../rating/sync/wiring';
import { getScheduleSyncScheduler } from '../../schedule/sync';
import { getTodoSyncScheduler } from '../../todo/sync';

/** The three schedulers driven together: ratings, schedule events, todos. */
type Controllable = {
  start(): void;
  stop(): void;
  notifyLocalChange(): void;
  pullNow(): Promise<void>;
};

function allSchedulers(): Controllable[] {
  return [
    getConfiguredSyncScheduler() as unknown as Controllable,
    getScheduleSyncScheduler() as unknown as Controllable,
    getTodoSyncScheduler() as unknown as Controllable,
  ];
}

/** Called at boot when a token is stored, and after the user saves a token. */
export function startAllSyncSchedulers(): void {
  allSchedulers().forEach((scheduler) => scheduler.start());
}

export function stopAllSyncSchedulers(): void {
  allSchedulers().forEach((scheduler) => scheduler.stop());
}

/** AppState → active. Failures are already surfaced through each status line. */
export async function pullAllNow(): Promise<void> {
  await Promise.all(allSchedulers().map((scheduler) => scheduler.pullNow()));
}

/** The settings page's 立即同步 button: push whatever is pending, then pull. */
export async function syncAllNow(): Promise<void> {
  const schedulers = allSchedulers();
  schedulers.forEach((scheduler) => scheduler.notifyLocalChange());
  await Promise.all(schedulers.map((scheduler) => scheduler.pullNow()));
}
