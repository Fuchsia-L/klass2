import React from 'react';
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import type { TimeSlotRating } from '../../../../features/rating/types';
import type { MinimalPaletteColors } from '../minimalTypes';
import { buildSevenDayTrendBuckets, MinTrends } from './MinTrends';

const paletteColors: MinimalPaletteColors = {
  bg: '#ffffff',
  ink: '#111111',
  dim: '#777777',
  line: '#dddddd',
  subtle: '#555555',
  panel: '#f7f7f7',
  accent: '#ff0000',
  nowLine: '#ff0000',
  sheetScrim: 'rgba(0,0,0,0.2)',
};

function localIso(year: number, monthIndex: number, day: number, hour = 12, minute = 0): string {
  return new Date(year, monthIndex, day, hour, minute, 0, 0).toISOString();
}

function makeRating(id: string, created_at: string, overrides: Partial<TimeSlotRating> = {}): TimeSlotRating {
  return {
    id,
    slot_start: created_at,
    slot_end: created_at,
    linked_event_id: `event-${id}`,
    rating: 3,
    efficiency: 3,
    mood: '平',
    created_at,
    updated_at: created_at,
    schema_version: 1,
    ...overrides,
  };
}

describe('buildSevenDayTrendBuckets', () => {
  const now = new Date(2026, 3, 20, 15, 30);

  it('creates seven local-day buckets including empty days', () => {
    const buckets = buildSevenDayTrendBuckets([makeRating('today', localIso(2026, 3, 20, 9))], now);

    expect(buckets).toHaveLength(7);
    expect(buckets[0].key).toBe('2026-04-14');
    expect(buckets[6].key).toBe('2026-04-20');
    expect(buckets.slice(0, 6).every((day) => day.count === 0)).toBe(true);
    expect(buckets[6].count).toBe(1);
  });

  it('groups by local day boundaries and ignores ratings outside the seven-day window', () => {
    const buckets = buildSevenDayTrendBuckets(
      [
        makeRating('start', localIso(2026, 3, 14, 0, 0)),
        makeRating('before', localIso(2026, 3, 13, 23, 59)),
        makeRating('tomorrow', localIso(2026, 3, 21, 0, 0)),
      ],
      now,
    );

    expect(buckets[0].count).toBe(1);
    expect(buckets.reduce((total, day) => total + day.count, 0)).toBe(1);
  });

  it('averages multiple efficiency values in one day', () => {
    const buckets = buildSevenDayTrendBuckets(
      [
        makeRating('one', localIso(2026, 3, 18, 8), { efficiency: 1 }),
        makeRating('five', localIso(2026, 3, 18, 20), { efficiency: 5 }),
      ],
      now,
    );

    expect(buckets.find((day) => day.key === '2026-04-18')?.count).toBe(2);
    expect(buckets.find((day) => day.key === '2026-04-18')?.efficiencyAverage).toBe(3);
  });

  it('averages mood labels through their 1-5 indexes', () => {
    const buckets = buildSevenDayTrendBuckets(
      [
        makeRating('low', localIso(2026, 3, 19, 8), { mood: '困' }),
        makeRating('high', localIso(2026, 3, 19, 20), { mood: '极' }),
      ],
      now,
    );

    expect(buckets.find((day) => day.key === '2026-04-19')?.moodAverage).toBe(3);
  });
});

describe('MinTrends', () => {
  it('renders the trend title, seven columns, populated bars, mood labels, and empty placeholders', () => {
    const { getByText, getAllByTestId } = render(
      <MinTrends
        p={paletteColors}
        now={new Date(2026, 3, 20, 15, 30)}
        categoryByEventId={{}}
        ratings={[
          makeRating('one', localIso(2026, 3, 18, 8), { efficiency: 2, mood: '躁' }),
          makeRating('two', localIso(2026, 3, 19, 8), { efficiency: 5, mood: '极' }),
        ]}
      />,
    );

    expect(getByText('TRENDS · 7 DAYS')).toBeTruthy();
    expect(getAllByTestId('min-trends-day')).toHaveLength(7);
    expect(getAllByTestId('min-trends-efficiency-bar')).toHaveLength(2);
    expect(getAllByTestId('min-trends-empty-day')).toHaveLength(5);
    expect(getAllByTestId('min-trends-mood-point')).toHaveLength(2);
    expect(getByText('极')).toBeTruthy();
    expect(getByText('平')).toBeTruthy();
    expect(getByText('困')).toBeTruthy();

    const firstBarStyle = StyleSheet.flatten(getAllByTestId('min-trends-efficiency-bar')[0].props.style) ?? {};
    expect(firstBarStyle.backgroundColor).toBe(paletteColors.ink);
    expect(firstBarStyle.height).toBeGreaterThan(0);
  });
});
