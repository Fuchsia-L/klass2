import type { SyncableRecord } from './types';

export const DEFAULT_CLOUD_SYNC_BASE_URL = 'https://api.epoch0.org';
export const DEFAULT_CLOUD_SYNC_TIMEOUT_MS = 10_000;

export type CloudSyncErrorOptions = {
  statusCode?: number;
  isTimeout?: boolean;
  isMissingToken?: boolean;
  body?: unknown;
  cause?: unknown;
};

export class CloudSyncError extends Error {
  readonly statusCode?: number;
  readonly isTimeout: boolean;
  readonly isMissingToken: boolean;
  readonly body?: unknown;
  readonly cause?: unknown;

  constructor(message: string, options: CloudSyncErrorOptions = {}) {
    super(message);
    this.name = 'CloudSyncError';
    this.statusCode = options.statusCode;
    this.isTimeout = options.isTimeout === true;
    this.isMissingToken = options.isMissingToken === true;
    this.body = options.body;
    this.cause = options.cause;
  }
}

export type CloudSyncRequest<T extends SyncableRecord> = {
  records: readonly T[];
  since?: string | null;
};

export type CloudSyncErrorEntry = {
  id?: string;
  error?: string;
  [key: string]: unknown;
};

export type CloudSyncResponse<T extends SyncableRecord> = {
  applied?: number;
  rejected?: number;
  records?: T[];
  errors?: CloudSyncErrorEntry[];
  server_time?: string;
  [key: string]: unknown;
};

export type TokenProvider = () => string | null | undefined | Promise<string | null | undefined>;

export type FetchLike = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
  },
) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text?: () => Promise<string>;
}>;

/**
 * Per-record-type endpoint wiring. `syncPath` is the POST sync endpoint,
 * `listPath` the pull-only GET endpoint.
 */
export type CloudSyncEndpoints = {
  syncPath: string;
  listPath: string;
};

export type CloudSyncApiClientOptions = {
  getToken: TokenProvider;
  endpoints: CloudSyncEndpoints;
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: FetchLike;
};

async function parseJsonSafely(response: { json: () => Promise<unknown> }): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Generic Bearer-authenticated sync client. The app never sends
 * `expected_updated_at` (spec-cloud-sync.md: app takes the default LWW path).
 */
export class CloudSyncApiClient<T extends SyncableRecord> {
  private readonly getToken: TokenProvider;
  private readonly endpoints: CloudSyncEndpoints;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: FetchLike;

  constructor(options: CloudSyncApiClientOptions) {
    if (typeof options?.getToken !== 'function') {
      throw new TypeError('CloudSyncApiClient requires a getToken callback');
    }
    if (!options?.endpoints?.syncPath || !options?.endpoints?.listPath) {
      throw new TypeError('CloudSyncApiClient requires endpoints.syncPath and endpoints.listPath');
    }

    this.getToken = options.getToken;
    this.endpoints = options.endpoints;
    this.baseUrl = (options.baseUrl ?? DEFAULT_CLOUD_SYNC_BASE_URL).replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs ?? DEFAULT_CLOUD_SYNC_TIMEOUT_MS;
    this.fetchImpl = options.fetchImpl ?? ((globalThis as { fetch?: FetchLike }).fetch as FetchLike);

    if (typeof this.fetchImpl !== 'function') {
      throw new TypeError('CloudSyncApiClient requires a fetch implementation');
    }
  }

  async sync(request: CloudSyncRequest<T>): Promise<CloudSyncResponse<T>> {
    const body: { records: readonly T[]; since?: string | null } = {
      records: request.records ?? [],
    };
    if (request.since !== undefined) {
      body.since = request.since;
    }

    return this.request<CloudSyncResponse<T>>({
      method: 'POST',
      path: this.endpoints.syncPath,
      body: JSON.stringify(body),
    });
  }

  async list(since: string | null): Promise<CloudSyncResponse<T>> {
    const query = since == null || since === '' ? '' : `?since=${encodeURIComponent(since)}`;
    return this.request<CloudSyncResponse<T>>({
      method: 'GET',
      path: `${this.endpoints.listPath}${query}`,
    });
  }

  /** Generic authenticated request helper; also used for PUT /v1/config/semester. */
  async request<R>({
    method,
    path,
    body,
  }: {
    method: 'GET' | 'POST' | 'PUT';
    path: string;
    body?: string;
  }): Promise<R> {
    const token = await this.getToken();
    if (token == null || token === '') {
      throw new CloudSyncError('Missing API token', { isMissingToken: true });
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, this.timeoutMs);

    const url = `${this.baseUrl}${path}`;

    let response: Awaited<ReturnType<FetchLike>>;
    try {
      response = await this.fetchImpl(url, {
        method,
        headers,
        body,
        signal: controller.signal,
      });
    } catch (error) {
      if (timedOut) {
        throw new CloudSyncError('Request timed out', { isTimeout: true, cause: error });
      }
      throw new CloudSyncError('Network request failed', { cause: error });
    } finally {
      clearTimeout(timer);
    }

    if (timedOut) {
      throw new CloudSyncError('Request timed out', { isTimeout: true });
    }

    if (!response.ok) {
      const errorBody = await parseJsonSafely(response);
      throw new CloudSyncError(`HTTP ${response.status}`, {
        statusCode: response.status,
        body: errorBody,
      });
    }

    const payload = (await parseJsonSafely(response)) as R;
    return (payload ?? ({} as R)) as R;
  }
}
