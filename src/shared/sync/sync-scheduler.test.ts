import { CloudSyncError, type CloudSyncResponse } from './api-client';
import { CloudSyncScheduler, type CloudSyncClient } from './sync-scheduler';
import { SyncingRepository } from './syncing-repository';
import type { SyncableRecord, SyncRepository } from './types';

type Record = SyncableRecord & { title: string };

function makeRecord(overrides: Partial<Record> = {}): Record {
  return {
    id: 'rec-1',
    title: 'Linear Algebra',
    created_at: '2026-01-01T01:00:00.000Z',
    updated_at: '2026-01-01T01:00:00.000Z',
    synced_at: null,
    deleted_at: null,
    ...overrides,
  };
}

/** In-memory repository with the soft-delete semantics the scheduler expects. */
class FakeRepository implements SyncRepository<Record> {
  constructor(private records: Record[] = []) {}

  async list(): Promise<Record[]> {
    return this.records.filter((r) => r.deleted_at == null);
  }
  async listAll(): Promise<Record[]> {
    return [...this.records];
  }
  async get(id: string): Promise<Record | null> {
    const found = this.records.find((r) => r.id === id);
    return found && found.deleted_at == null ? found : null;
  }
  async save(record: Record): Promise<void> {
    const i = this.records.findIndex((r) => r.id === record.id);
    if (i >= 0) this.records[i] = record;
    else this.records.push(record);
  }
  async remove(id: string): Promise<void> {
    const found = this.records.find((r) => r.id === id);
    if (!found || found.deleted_at != null) return;
    const now = new Date().toISOString();
    found.deleted_at = now;
    found.updated_at = now;
    found.synced_at = null;
  }
  async listPendingSync(): Promise<Record[]> {
    return this.records.filter((r) => r.synced_at == null);
  }
  async markSynced(id: string, syncedAt: string): Promise<void> {
    const found = this.records.find((r) => r.id === id);
    if (found) found.synced_at = syncedAt;
  }
}

function makeApiClient(
  response: CloudSyncResponse<Record> = { server_time: '2026-02-01T00:00:00.000Z' },
): jest.Mocked<CloudSyncClient<Record>> {
  return {
    sync: jest.fn().mockResolvedValue(response),
    list: jest.fn().mockResolvedValue(response),
  };
}

/** Lets pending promise chains inside the scheduler settle. */
async function flush(): Promise<void> {
  for (let i = 0; i < 5; i += 1) await Promise.resolve();
}

describe('CloudSyncScheduler debounce', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('pushes once, 5s after a burst of local changes', async () => {
    const repository = new FakeRepository([makeRecord()]);
    const apiClient = makeApiClient();
    const scheduler = new CloudSyncScheduler<Record>({ repository, apiClient });
    scheduler.start();

    scheduler.notifyLocalChange();
    scheduler.notifyLocalChange();
    scheduler.notifyLocalChange();

    expect(apiClient.sync).not.toHaveBeenCalled();

    jest.advanceTimersByTime(4_999);
    expect(apiClient.sync).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    await flush();

    expect(apiClient.sync).toHaveBeenCalledTimes(1);
  });

  it('sends the pending records and the max updated_at cursor', async () => {
    const repository = new FakeRepository([
      makeRecord({ id: 'a', updated_at: '2026-01-01T00:00:00.000Z', synced_at: null }),
      makeRecord({
        id: 'b',
        updated_at: '2026-01-05T00:00:00.000Z',
        synced_at: '2026-01-05T00:00:01.000Z',
      }),
    ]);
    const apiClient = makeApiClient();
    const scheduler = new CloudSyncScheduler<Record>({ repository, apiClient });
    scheduler.start();

    await scheduler.pullNow();

    expect(apiClient.sync).toHaveBeenCalledWith({
      records: [expect.objectContaining({ id: 'a' })],
      // The synced record still advances the cursor, so the server does not
      // re-send it every cycle.
      since: '2026-01-05T00:00:00.000Z',
    });
  });

  it('does not arm the debounce before start()', () => {
    const scheduler = new CloudSyncScheduler<Record>({
      repository: new FakeRepository(),
      apiClient: makeApiClient(),
    });

    scheduler.notifyLocalChange();
    jest.advanceTimersByTime(10_000);

    expect(scheduler.getStatus()).toEqual({ kind: 'idle', lastSyncAt: null });
  });
});

describe('CloudSyncScheduler push results', () => {
  it('marks pushed records synced with the server time', async () => {
    const repository = new FakeRepository([makeRecord({ id: 'a' })]);
    const apiClient = makeApiClient({ server_time: '2026-02-01T00:00:00.000Z' });
    const scheduler = new CloudSyncScheduler<Record>({ repository, apiClient });
    scheduler.start();

    await scheduler.pullNow();

    const [stored] = await repository.listAll();
    expect(stored.synced_at).toBe('2026-02-01T00:00:00.000Z');
    expect(scheduler.getStatus()).toEqual({
      kind: 'idle',
      lastSyncAt: '2026-02-01T00:00:00.000Z',
    });
  });

  it('leaves a rejected record pending so the next cycle retries it', async () => {
    const repository = new FakeRepository([makeRecord({ id: 'a' }), makeRecord({ id: 'b' })]);
    const apiClient = makeApiClient({
      server_time: '2026-02-01T00:00:00.000Z',
      errors: [{ id: 'b', error: 'stale' }],
    });
    const scheduler = new CloudSyncScheduler<Record>({ repository, apiClient });
    scheduler.start();

    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await scheduler.pullNow();
    warn.mockRestore();

    const pending = await repository.listPendingSync();
    expect(pending.map((r) => r.id)).toEqual(['b']);
  });

  it('pushes tombstones so a local delete reaches the server', async () => {
    const repository = new FakeRepository([
      makeRecord({ id: 'a', synced_at: '2026-01-01T02:00:00.000Z' }),
    ]);
    const apiClient = makeApiClient();
    const scheduler = new CloudSyncScheduler<Record>({ repository, apiClient });
    scheduler.start();

    await repository.remove('a');
    await scheduler.pullNow();

    const [{ records }] = apiClient.sync.mock.calls[0];
    expect(records).toHaveLength(1);
    expect(records[0].deleted_at).not.toBeNull();
  });

  it('merges a newer remote record and stamps synced_at', async () => {
    const repository = new FakeRepository([
      makeRecord({ id: 'a', updated_at: '2026-01-01T00:00:00.000Z', synced_at: 'x' }),
    ]);
    const apiClient = makeApiClient({
      server_time: '2026-02-01T00:00:00.000Z',
      records: [makeRecord({ id: 'a', title: 'Renamed', updated_at: '2026-01-09T00:00:00.000Z' })],
    });
    const scheduler = new CloudSyncScheduler<Record>({ repository, apiClient });
    scheduler.start();

    await scheduler.pullNow();

    const [stored] = await repository.listAll();
    expect(stored.title).toBe('Renamed');
    expect(stored.synced_at).toBe('2026-02-01T00:00:00.000Z');
  });

  it('keeps a newer local record over an older remote one', async () => {
    const repository = new FakeRepository([
      makeRecord({ id: 'a', title: 'Local', updated_at: '2026-01-20T00:00:00.000Z', synced_at: 'x' }),
    ]);
    const apiClient = makeApiClient({
      server_time: '2026-02-01T00:00:00.000Z',
      records: [makeRecord({ id: 'a', title: 'Remote', updated_at: '2026-01-09T00:00:00.000Z' })],
    });
    const scheduler = new CloudSyncScheduler<Record>({ repository, apiClient });
    scheduler.start();

    await scheduler.pullNow();

    const [stored] = await repository.listAll();
    expect(stored.title).toBe('Local');
  });
});

describe('CloudSyncScheduler error handling', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('backs off 5s → 30s on repeated network failures', async () => {
    const repository = new FakeRepository([makeRecord()]);
    const apiClient = makeApiClient();
    apiClient.sync.mockRejectedValue(new CloudSyncError('Network request failed'));
    const scheduler = new CloudSyncScheduler<Record>({ repository, apiClient });
    scheduler.start();

    await scheduler.pullNow();
    expect(scheduler.getStatus()).toMatchObject({
      kind: 'error',
      message: '网络异常 · 5s 后重试',
    });

    jest.advanceTimersByTime(5_000);
    await flush();

    expect(apiClient.sync).toHaveBeenCalledTimes(2);
    expect(scheduler.getStatus()).toMatchObject({ message: '网络异常 · 30s 后重试' });
  });

  it('reports a server error distinctly for 5xx', async () => {
    const repository = new FakeRepository([makeRecord()]);
    const apiClient = makeApiClient();
    apiClient.sync.mockRejectedValue(new CloudSyncError('HTTP 500', { statusCode: 500 }));
    const scheduler = new CloudSyncScheduler<Record>({ repository, apiClient });
    scheduler.start();

    await scheduler.pullNow();

    expect(scheduler.getStatus()).toMatchObject({ message: '服务端异常 · 5s 后重试' });
  });

  it('does not retry a 401 and reports an invalid token', async () => {
    const repository = new FakeRepository([makeRecord()]);
    const apiClient = makeApiClient();
    apiClient.sync.mockRejectedValue(new CloudSyncError('HTTP 401', { statusCode: 401 }));
    const scheduler = new CloudSyncScheduler<Record>({ repository, apiClient });
    scheduler.start();

    await scheduler.pullNow();
    expect(scheduler.getStatus()).toMatchObject({ kind: 'error', message: 'token 无效' });

    jest.advanceTimersByTime(600_000);
    await flush();

    expect(apiClient.sync).toHaveBeenCalledTimes(1);
  });

  it('does not retry a 403 either', async () => {
    const repository = new FakeRepository([makeRecord()]);
    const apiClient = makeApiClient();
    apiClient.sync.mockRejectedValue(new CloudSyncError('HTTP 403', { statusCode: 403 }));
    const scheduler = new CloudSyncScheduler<Record>({ repository, apiClient });
    scheduler.start();

    await scheduler.pullNow();
    jest.advanceTimersByTime(600_000);
    await flush();

    expect(apiClient.sync).toHaveBeenCalledTimes(1);
  });

  it('resets backoff when a local change arrives during it', async () => {
    const repository = new FakeRepository([makeRecord()]);
    const apiClient = makeApiClient();
    apiClient.sync.mockRejectedValueOnce(new CloudSyncError('Network request failed'));
    const scheduler = new CloudSyncScheduler<Record>({ repository, apiClient });
    scheduler.start();

    await scheduler.pullNow();
    expect(scheduler.getStatus()).toMatchObject({ kind: 'error' });

    // A user edit during backoff wins: debounce 5s, then sync.
    scheduler.notifyLocalChange();
    jest.advanceTimersByTime(5_000);
    await flush();
    await flush();

    expect(apiClient.sync).toHaveBeenCalledTimes(2);
    expect(scheduler.getStatus()).toMatchObject({ kind: 'idle' });
  });

  it('stop() cancels a pending retry', async () => {
    const repository = new FakeRepository([makeRecord()]);
    const apiClient = makeApiClient();
    apiClient.sync.mockRejectedValue(new CloudSyncError('Network request failed'));
    const scheduler = new CloudSyncScheduler<Record>({ repository, apiClient });
    scheduler.start();

    await scheduler.pullNow();
    scheduler.stop();
    jest.advanceTimersByTime(600_000);
    await flush();

    expect(apiClient.sync).toHaveBeenCalledTimes(1);
  });
});

describe('CloudSyncScheduler status', () => {
  it('leaves unconfigured on start() and notifies subscribers', () => {
    const scheduler = new CloudSyncScheduler<Record>({
      repository: new FakeRepository(),
      apiClient: makeApiClient(),
      initialStatus: { kind: 'unconfigured' },
    });

    const seen: string[] = [];
    scheduler.onStatusChange((s) => seen.push(s.kind));

    expect(scheduler.getStatus()).toEqual({ kind: 'unconfigured' });
    scheduler.start();
    expect(scheduler.getStatus()).toEqual({ kind: 'idle', lastSyncAt: null });
    expect(seen).toEqual(['idle']);
  });

  it('unsubscribes a status listener', () => {
    const scheduler = new CloudSyncScheduler<Record>({
      repository: new FakeRepository(),
      apiClient: makeApiClient(),
      initialStatus: { kind: 'unconfigured' },
    });
    const listener = jest.fn();
    scheduler.onStatusChange(listener)();

    scheduler.start();

    expect(listener).not.toHaveBeenCalled();
  });
});

describe('SyncingRepository', () => {
  it('notifies the scheduler after save and remove, but not after reads', async () => {
    const local = new FakeRepository([makeRecord({ id: 'a' })]);
    const scheduler = { notifyLocalChange: jest.fn() };
    const repo = new SyncingRepository<Record>(local, scheduler);

    await repo.list();
    await repo.get('a');
    await repo.listPendingSync();
    expect(scheduler.notifyLocalChange).not.toHaveBeenCalled();

    await repo.save(makeRecord({ id: 'b' }));
    expect(scheduler.notifyLocalChange).toHaveBeenCalledTimes(1);

    await repo.remove('a');
    expect(scheduler.notifyLocalChange).toHaveBeenCalledTimes(2);
  });

  it('forwards writes to the wrapped local repository', async () => {
    const local = new FakeRepository();
    const repo = new SyncingRepository<Record>(local, { notifyLocalChange: jest.fn() });

    await repo.save(makeRecord({ id: 'a' }));

    expect(await local.get('a')).toMatchObject({ id: 'a' });
  });

  it('marks synced through to the local repository without notifying', async () => {
    const local = new FakeRepository([makeRecord({ id: 'a' })]);
    const scheduler = { notifyLocalChange: jest.fn() };
    const repo = new SyncingRepository<Record>(local, scheduler);

    await repo.markSynced('a', '2026-02-01T00:00:00.000Z');

    expect((await local.listAll())[0].synced_at).toBe('2026-02-01T00:00:00.000Z');
    expect(scheduler.notifyLocalChange).not.toHaveBeenCalled();
  });
});
