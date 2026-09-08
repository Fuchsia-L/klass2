import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../../platform/storage/async-storage';
import { loadEventsFromStorage, clearEventsCache } from './events.storage';

describe('events storage compatibility', () => {
  beforeEach(() => {
    clearEventsCache();
  });

  it('accepts legacy events without a source field', async () => {
    const legacyEvent = {
      id: 'legacy-1',
      title: 'Legacy Event',
      category: '学习',
      start_time: '2026-03-16T08:00:00.000Z',
      end_time: '2026-03-16T09:00:00.000Z',
      repeat: 'none',
      is_completed: false,
    };

    await AsyncStorage.setItem(STORAGE_KEYS.events, JSON.stringify([legacyEvent]));

    await expect(loadEventsFromStorage()).resolves.toEqual([
      expect.objectContaining(legacyEvent),
    ]);
  });

  it('accepts legacy events without a repeat_until field', async () => {
    const legacyEvent = {
      id: 'legacy-repeat-until-1',
      title: 'Legacy Event Without Repeat Until',
      category: '学习',
      start_time: '2026-03-17T08:00:00.000Z',
      end_time: '2026-03-17T09:00:00.000Z',
      repeat: 'daily',
      is_completed: false,
    };

    await AsyncStorage.setItem(STORAGE_KEYS.events, JSON.stringify([legacyEvent]));

    await expect(loadEventsFromStorage()).resolves.toEqual([
      expect.objectContaining(legacyEvent),
    ]);
  });

  it('accepts events with a valid repeat_until field', async () => {
    const repeatingEvent = {
      id: 'repeat-until-valid-1',
      title: 'Repeating Event',
      category: '学习',
      start_time: '2026-03-18T08:00:00.000Z',
      end_time: '2026-03-18T09:00:00.000Z',
      repeat: 'weekly',
      repeat_until: '2026-04-30',
      is_completed: false,
    };

    await AsyncStorage.setItem(STORAGE_KEYS.events, JSON.stringify([repeatingEvent]));

    await expect(loadEventsFromStorage()).resolves.toEqual([
      expect.objectContaining(repeatingEvent),
    ]);
  });

  it('filters out events with invalid repeat_until values', async () => {
    const validEvent = {
      id: 'repeat-until-valid-2',
      title: 'Valid Repeating Event',
      category: '学习',
      start_time: '2026-03-19T08:00:00.000Z',
      end_time: '2026-03-19T09:00:00.000Z',
      repeat: 'weekly',
      repeat_until: '2026-05-01',
      is_completed: false,
    };

    const invalidEvents = [
      {
        ...validEvent,
        id: 'repeat-until-invalid-number',
        repeat_until: 123456,
      },
      {
        ...validEvent,
        id: 'repeat-until-invalid-garbage',
        repeat_until: 'not-a-date',
      },
      {
        ...validEvent,
        id: 'repeat-until-invalid-unparseable',
        repeat_until: '2026-02-30',
      },
    ];

    await AsyncStorage.setItem(
      STORAGE_KEYS.events,
      JSON.stringify([validEvent, ...invalidEvents]),
    );

    await expect(loadEventsFromStorage()).resolves.toEqual([
      expect.objectContaining(validEvent),
    ]);
  });

  it('accepts events with the new source field', async () => {
    const importedEvent = {
      id: 'import-1',
      title: 'Imported Event',
      category: '学习',
      start_time: '2026-03-16T10:00:00.000Z',
      end_time: '2026-03-16T11:00:00.000Z',
      repeat: 'weekly',
      source: 'whut-import',
      is_completed: false,
    };

    await AsyncStorage.setItem(STORAGE_KEYS.events, JSON.stringify([importedEvent]));

    await expect(loadEventsFromStorage()).resolves.toEqual([
      expect.objectContaining(importedEvent),
    ]);
  });
});

describe('events storage lazy sync-field upgrade', () => {
  const ISO_MS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

  const legacyEvent = {
    id: 'upgrade-1',
    title: 'Pre-sync Event',
    category: '学习',
    start_time: '2026-03-16T08:00:00.000Z',
    end_time: '2026-03-16T09:00:00.000Z',
    repeat: 'none',
    is_completed: false,
  };

  beforeEach(() => {
    clearEventsCache();
  });

  it('back-fills created_at/updated_at with millisecond ISO timestamps', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.events, JSON.stringify([legacyEvent]));

    const [event] = await loadEventsFromStorage();

    expect(event.created_at).toMatch(ISO_MS);
    expect(event.updated_at).toMatch(ISO_MS);
    // Not yet pushed, so it stays in the pending-sync set.
    expect(event.synced_at).toBeNull();
    // Missing deleted_at reads as "active".
    expect(event.deleted_at ?? null).toBeNull();
  });

  it('writes the back-filled timestamps back so the upgrade happens once', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.events, JSON.stringify([legacyEvent]));

    const [first] = await loadEventsFromStorage();

    const persisted = JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.events)) ?? '[]');
    expect(persisted[0].created_at).toBe(first.created_at);
    expect(persisted[0].updated_at).toBe(first.updated_at);

    // A fresh load (cold cache) must reuse the stored timestamps, not re-stamp.
    clearEventsCache();
    const [second] = await loadEventsFromStorage();
    expect(second.created_at).toBe(first.created_at);
    expect(second.updated_at).toBe(first.updated_at);
  });

  it('leaves records that already carry sync fields untouched', async () => {
    const synced = {
      ...legacyEvent,
      id: 'upgrade-2',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z',
      synced_at: '2026-01-02T00:00:01.000Z',
      deleted_at: null,
    };
    await AsyncStorage.setItem(STORAGE_KEYS.events, JSON.stringify([synced]));

    await expect(loadEventsFromStorage()).resolves.toEqual([synced]);
  });
});
