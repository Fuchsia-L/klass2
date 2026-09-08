import { lastSyncAtOf, summarizeSyncStatuses, type CloudSyncStatus } from './sync-state';

const idle = (lastSyncAt: string | null): CloudSyncStatus => ({ kind: 'idle', lastSyncAt });

describe('summarizeSyncStatuses', () => {
  it('returns idle/never for an empty set', () => {
    expect(summarizeSyncStatuses([])).toEqual({ kind: 'idle', lastSyncAt: null });
  });

  it('reports the oldest lastSyncAt when every scheduler is idle', () => {
    const summary = summarizeSyncStatuses([
      idle('2026-02-03T00:00:00.000Z'),
      idle('2026-02-01T00:00:00.000Z'),
      idle('2026-02-02T00:00:00.000Z'),
    ]);

    expect(summary).toEqual({ kind: 'idle', lastSyncAt: '2026-02-01T00:00:00.000Z' });
  });

  it('reports "never synced" if any idle scheduler has never synced', () => {
    const summary = summarizeSyncStatuses([idle('2026-02-03T00:00:00.000Z'), idle(null)]);

    expect(summary).toEqual({ kind: 'idle', lastSyncAt: null });
  });

  it('prefers an error over idle and syncing', () => {
    const summary = summarizeSyncStatuses([
      idle('2026-02-03T00:00:00.000Z'),
      { kind: 'syncing', lastSyncAt: null },
      { kind: 'error', message: 'token 无效', lastSyncAt: null },
    ]);

    expect(summary).toMatchObject({ kind: 'error', message: 'token 无效' });
  });

  it('prefers unconfigured over everything else', () => {
    const summary = summarizeSyncStatuses([
      { kind: 'error', message: '网络异常 · 5s 后重试', lastSyncAt: null },
      { kind: 'unconfigured' },
    ]);

    expect(summary).toEqual({ kind: 'unconfigured' });
  });

  it('prefers syncing over idle', () => {
    const summary = summarizeSyncStatuses([
      idle('2026-02-03T00:00:00.000Z'),
      { kind: 'syncing', lastSyncAt: '2026-02-03T00:00:00.000Z' },
    ]);

    expect(summary).toMatchObject({ kind: 'syncing' });
  });
});

describe('lastSyncAtOf', () => {
  it('reads lastSyncAt from every status kind that carries one', () => {
    expect(lastSyncAtOf(idle('2026-02-01T00:00:00.000Z'))).toBe('2026-02-01T00:00:00.000Z');
    expect(lastSyncAtOf({ kind: 'syncing', lastSyncAt: 'x' })).toBe('x');
    expect(lastSyncAtOf({ kind: 'error', message: 'm', lastSyncAt: 'y' })).toBe('y');
    expect(lastSyncAtOf({ kind: 'unconfigured' })).toBeNull();
  });
});
