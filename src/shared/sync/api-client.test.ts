import {
  CloudSyncApiClient,
  CloudSyncError,
  DEFAULT_CLOUD_SYNC_BASE_URL,
  type FetchLike,
} from './api-client';
import type { SyncableRecord } from './types';

type Record = SyncableRecord & { title: string };

const SCHEDULE_ENDPOINTS = { syncPath: '/v1/schedule/sync', listPath: '/v1/schedule' };
const TODO_ENDPOINTS = { syncPath: '/v1/todos/sync', listPath: '/v1/todos' };

function makeRecord(overrides: Partial<Record> = {}): Record {
  return {
    id: 'rec-1',
    title: 'Linear Algebra',
    created_at: '2026-01-01T01:00:00.000Z',
    updated_at: '2026-01-01T01:00:00.000Z',
    synced_at: null,
    ...overrides,
  };
}

type FetchMock = jest.Mock<ReturnType<FetchLike>, Parameters<FetchLike>>;

function makeJsonResponse(
  body: unknown,
  { ok = true, status = 200 }: { ok?: boolean; status?: number } = {},
) {
  return { ok, status, json: () => Promise.resolve(body) };
}

function makeFetchMock(response: ReturnType<typeof makeJsonResponse>): FetchMock {
  return jest.fn(() => Promise.resolve(response)) as unknown as FetchMock;
}

describe('CloudSyncApiClient.sync', () => {
  it('posts to the schedule sync endpoint with the Bearer header and JSON body', async () => {
    const fetchImpl = makeFetchMock(makeJsonResponse({}));
    const client = new CloudSyncApiClient<Record>({
      getToken: () => 'token-xyz',
      endpoints: SCHEDULE_ENDPOINTS,
      fetchImpl,
    });

    const records = [makeRecord()];
    const since = '2026-01-10T00:00:00.000Z';
    await client.sync({ records, since });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(`${DEFAULT_CLOUD_SYNC_BASE_URL}/v1/schedule/sync`);
    expect(init?.method).toBe('POST');
    expect(init?.headers?.Authorization).toBe('Bearer token-xyz');
    expect(init?.headers?.['Content-Type']).toBe('application/json');
    expect(JSON.parse(init?.body ?? '{}')).toEqual({ records, since });
  });

  it('posts to the todos sync endpoint when wired with the todo endpoints', async () => {
    const fetchImpl = makeFetchMock(makeJsonResponse({}));
    const client = new CloudSyncApiClient<Record>({
      getToken: () => 'token',
      endpoints: TODO_ENDPOINTS,
      fetchImpl,
    });

    await client.sync({ records: [] });

    expect(fetchImpl.mock.calls[0][0]).toBe(`${DEFAULT_CLOUD_SYNC_BASE_URL}/v1/todos/sync`);
  });

  it('omits `since` from the body when it is not supplied', async () => {
    const fetchImpl = makeFetchMock(makeJsonResponse({}));
    const client = new CloudSyncApiClient<Record>({
      getToken: () => 'token',
      endpoints: SCHEDULE_ENDPOINTS,
      fetchImpl,
    });

    await client.sync({ records: [] });

    expect(JSON.parse(fetchImpl.mock.calls[0][1]?.body ?? '{}')).toEqual({ records: [] });
  });

  it('honours an injected baseUrl and strips its trailing slash', async () => {
    const fetchImpl = makeFetchMock(makeJsonResponse({}));
    const client = new CloudSyncApiClient<Record>({
      getToken: () => 'token',
      endpoints: SCHEDULE_ENDPOINTS,
      baseUrl: 'https://staging.example.com/',
      fetchImpl,
    });

    await client.sync({ records: [] });

    expect(fetchImpl.mock.calls[0][0]).toBe('https://staging.example.com/v1/schedule/sync');
  });

  it('reads the token on every request so a re-issued token takes effect', async () => {
    const fetchImpl = makeFetchMock(makeJsonResponse({}));
    const getToken = jest.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second');
    const client = new CloudSyncApiClient<Record>({
      getToken,
      endpoints: SCHEDULE_ENDPOINTS,
      fetchImpl,
    });

    await client.sync({ records: [] });
    await client.sync({ records: [] });

    expect(fetchImpl.mock.calls[0][1]?.headers?.Authorization).toBe('Bearer first');
    expect(fetchImpl.mock.calls[1][1]?.headers?.Authorization).toBe('Bearer second');
  });

  it('throws a missing-token CloudSyncError without hitting the network', async () => {
    const fetchImpl = makeFetchMock(makeJsonResponse({}));
    const client = new CloudSyncApiClient<Record>({
      getToken: () => null,
      endpoints: SCHEDULE_ENDPOINTS,
      fetchImpl,
    });

    await expect(client.sync({ records: [] })).rejects.toMatchObject({
      name: 'CloudSyncError',
      isMissingToken: true,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('maps a 401 response to a CloudSyncError carrying the status code', async () => {
    const fetchImpl = makeFetchMock(
      makeJsonResponse({ error: 'unauthorized' }, { ok: false, status: 401 }),
    );
    const client = new CloudSyncApiClient<Record>({
      getToken: () => 'bad-token',
      endpoints: SCHEDULE_ENDPOINTS,
      fetchImpl,
    });

    await expect(client.sync({ records: [] })).rejects.toMatchObject({ statusCode: 401 });
  });

  it('wraps a network rejection in a CloudSyncError', async () => {
    const fetchImpl = jest.fn(() =>
      Promise.reject(new Error('offline')),
    ) as unknown as FetchMock;
    const client = new CloudSyncApiClient<Record>({
      getToken: () => 'token',
      endpoints: SCHEDULE_ENDPOINTS,
      fetchImpl,
    });

    await expect(client.sync({ records: [] })).rejects.toBeInstanceOf(CloudSyncError);
  });
});

describe('CloudSyncApiClient.list', () => {
  it('encodes `since` into the query string of the list endpoint', async () => {
    const fetchImpl = makeFetchMock(makeJsonResponse({ records: [] }));
    const client = new CloudSyncApiClient<Record>({
      getToken: () => 'token',
      endpoints: TODO_ENDPOINTS,
      fetchImpl,
    });

    await client.list('2026-01-10T00:00:00.000Z');

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(
      `${DEFAULT_CLOUD_SYNC_BASE_URL}/v1/todos?since=${encodeURIComponent('2026-01-10T00:00:00.000Z')}`,
    );
    expect(init?.method).toBe('GET');
    expect(init?.headers?.Authorization).toBe('Bearer token');
  });

  it('omits the query string entirely for a null cursor (full pull)', async () => {
    const fetchImpl = makeFetchMock(makeJsonResponse({ records: [] }));
    const client = new CloudSyncApiClient<Record>({
      getToken: () => 'token',
      endpoints: SCHEDULE_ENDPOINTS,
      fetchImpl,
    });

    await client.list(null);

    expect(fetchImpl.mock.calls[0][0]).toBe(`${DEFAULT_CLOUD_SYNC_BASE_URL}/v1/schedule`);
  });
});

describe('CloudSyncApiClient.request', () => {
  it('sends an authenticated PUT for the semester config endpoint', async () => {
    const fetchImpl = makeFetchMock(makeJsonResponse({}));
    const client = new CloudSyncApiClient<Record>({
      getToken: () => 'token',
      endpoints: SCHEDULE_ENDPOINTS,
      fetchImpl,
    });

    const body = JSON.stringify({
      start_date: '2026-02-23',
      total_weeks: 16,
      updated_at: '2026-02-23T00:00:00.000Z',
    });
    await client.request({ method: 'PUT', path: '/v1/config/semester', body });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(`${DEFAULT_CLOUD_SYNC_BASE_URL}/v1/config/semester`);
    expect(init?.method).toBe('PUT');
    expect(init?.headers?.Authorization).toBe('Bearer token');
    expect(init?.body).toBe(body);
  });
});

describe('CloudSyncApiClient construction', () => {
  it('rejects a missing getToken callback', () => {
    expect(
      () =>
        new CloudSyncApiClient<Record>({
          getToken: undefined as unknown as () => string,
          endpoints: SCHEDULE_ENDPOINTS,
          fetchImpl: makeFetchMock(makeJsonResponse({})),
        }),
    ).toThrow(TypeError);
  });

  it('rejects an incomplete endpoint pair', () => {
    expect(
      () =>
        new CloudSyncApiClient<Record>({
          getToken: () => 'token',
          endpoints: { syncPath: '', listPath: '' },
          fetchImpl: makeFetchMock(makeJsonResponse({})),
        }),
    ).toThrow(TypeError);
  });
});
