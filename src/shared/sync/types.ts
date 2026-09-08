/**
 * Shared sync primitives for cloud-synced record collections.
 *
 * Extracted from the (frozen) `src/features/rating/sync/` implementation so
 * schedule events and todos can reuse the same debounce / backoff / LWW
 * discipline described in `docs/spec-cloud-sync.md`. The rating module keeps
 * its own copy on purpose — it is a stable, production-bound layer.
 */

/**
 * Fields every cloud-synced record carries.
 *
 * `created_at` / `updated_at` are optional in the type because records written
 * before the sync layer existed lack them on disk. Each storage layer lazily
 * back-fills both on load, so anything reaching the scheduler has them; the
 * scheduler still guards against `undefined` when computing the `since` cursor
 * and doing LWW comparisons.
 */
export interface SyncableRecord {
  id: string;
  created_at?: string;
  updated_at?: string;
  synced_at?: string | null;
  deleted_at?: string | null;
}

/**
 * Local persistence contract the scheduler drives. Mirrors
 * `RatingRepository` but generic over the record type.
 */
export interface SyncRepository<T extends SyncableRecord> {
  /** Active records only (tombstones filtered out). */
  list(): Promise<T[]>;
  /** Every stored record, tombstones included. Used for the `since` cursor. */
  listAll(): Promise<T[]>;
  /** Returns `null` for missing *and* soft-deleted records. */
  get(id: string): Promise<T | null>;
  save(record: T): Promise<void>;
  /** Soft delete: writes a tombstone rather than dropping the row. */
  remove(id: string): Promise<void>;
  /** All records with `synced_at == null`, tombstones included. */
  listPendingSync(): Promise<T[]>;
  markSynced(id: string, syncedAt: string): Promise<void>;
  subscribe?(listener: () => void): () => void;
}

/** Millisecond-precision ISO timestamp — the project-wide rule. */
export function nowIso(): string {
  return new Date().toISOString();
}
