import React, { useEffect, type ReactNode } from 'react';
import { AppState, type AppStateStatus, type NativeEventSubscription } from 'react-native';
import { loadSyncToken } from '../rating/sync/wiring';
import { getScheduleSyncScheduler } from '../schedule/sync';
import { getTodoSyncScheduler } from '../todo/sync';

/**
 * Boots the schedule and todo sync schedulers, mirroring what
 * `RatingServiceProvider` already does for ratings: start them once a token is
 * stored, and pull whenever the app comes to the foreground.
 *
 * Kept separate from `RatingServiceProvider` because `src/features/rating/` is
 * a frozen, production-bound layer.
 */
export function CloudSyncProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    let cancelled = false;
    // Constructed here (not at module scope) so the singletons exist before
    // any settings screen subscribes to their status.
    const schedulers = [getScheduleSyncScheduler(), getTodoSyncScheduler()];

    (async () => {
      const token = await loadSyncToken();
      if (cancelled) return;
      if (token && token.length > 0) {
        schedulers.forEach((scheduler) => scheduler.start());
      }
    })();

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState !== 'active') return;
      schedulers.forEach((scheduler) => {
        void scheduler.pullNow();
      });
    };
    const subscription: NativeEventSubscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  return <>{children}</>;
}
