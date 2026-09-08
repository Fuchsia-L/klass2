import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_CLOUD_SYNC_BASE_URL } from '../../../shared/sync';
import { SYNC_TOKEN_STORAGE_KEY } from '../../rating/sync/wiring';
import { pushSemesterConfig, resetSemesterSyncForTests } from './semester-sync';

describe('pushSemesterConfig', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(async () => {
    await AsyncStorage.clear();
    resetSemesterSyncForTests();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('PUTs the config with a Bearer header and a millisecond updated_at', async () => {
    await AsyncStorage.setItem(SYNC_TOKEN_STORAGE_KEY, 'semester-token');
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await pushSemesterConfig({ start_date: '2026-02-23', total_weeks: 18 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${DEFAULT_CLOUD_SYNC_BASE_URL}/v1/config/semester`);
    expect(init.method).toBe('PUT');
    expect(init.headers.Authorization).toBe('Bearer semester-token');

    const body = JSON.parse(init.body);
    expect(body.start_date).toBe('2026-02-23');
    expect(body.total_weeks).toBe(18);
    expect(body.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('rejects without hitting the network when no token is stored', async () => {
    const fetchMock = jest.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(
      pushSemesterConfig({ start_date: '2026-02-23', total_weeks: 18 }),
    ).rejects.toMatchObject({ isMissingToken: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
