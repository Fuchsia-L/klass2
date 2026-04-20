import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import type { TimeSlotRating } from '../../../../features/rating/types';
import type { MinimalPaletteColors } from '../minimalTypes';
import { MOOD_LABELS, moodToIndex } from '../minimalTypes';

export type MinTrendDay = {
  key: string;
  label: string;
  date: Date;
  count: number;
  efficiencyAverage: number | null;
  moodAverage: number | null;
};

type Accumulator = {
  efficiencyTotal: number;
  efficiencyCount: number;
  moodTotal: number;
  moodCount: number;
};

type Props = {
  p: MinimalPaletteColors;
  ratings: TimeSlotRating[];
  now?: Date;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const CHART_WIDTH = 240;
const MOOD_HEIGHT = 74;
const COLUMN_COUNT = 7;

function startOfLocalDay(date: Date): Date {
  const local = new Date(date);
  local.setHours(0, 0, 0, 0);
  return local;
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dayLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2).toUpperCase();
}

export function buildSevenDayTrendBuckets(ratings: TimeSlotRating[], now = new Date()): MinTrendDay[] {
  const todayStart = startOfLocalDay(now);
  const firstDayStart = new Date(todayStart);
  firstDayStart.setDate(todayStart.getDate() - (COLUMN_COUNT - 1));
  const afterToday = new Date(todayStart);
  afterToday.setDate(todayStart.getDate() + 1);

  const days = Array.from({ length: COLUMN_COUNT }, (_, index) => {
    const date = new Date(firstDayStart);
    date.setDate(firstDayStart.getDate() + index);
    return date;
  });

  const totals = new Map<string, Accumulator>();
  days.forEach((date) => {
    totals.set(dayKey(date), {
      efficiencyTotal: 0,
      efficiencyCount: 0,
      moodTotal: 0,
      moodCount: 0,
    });
  });

  ratings.forEach((rating) => {
    const createdAt = new Date(rating.created_at);
    const createdMs = createdAt.getTime();
    if (Number.isNaN(createdMs) || createdMs < firstDayStart.getTime() || createdMs >= afterToday.getTime()) return;

    const key = dayKey(startOfLocalDay(createdAt));
    const day = totals.get(key);
    if (!day) return;

    day.efficiencyTotal += rating.efficiency;
    day.efficiencyCount += 1;

    const moodIndex = moodToIndex(rating.mood);
    if (moodIndex > 0) {
      day.moodTotal += moodIndex;
      day.moodCount += 1;
    }
  });

  return days.map((date) => {
    const key = dayKey(date);
    const day = totals.get(key);
    const count = day?.efficiencyCount ?? 0;
    return {
      key,
      label: dayLabel(date),
      date,
      count,
      efficiencyAverage: day && day.efficiencyCount > 0 ? day.efficiencyTotal / day.efficiencyCount : null,
      moodAverage: day && day.moodCount > 0 ? day.moodTotal / day.moodCount : null,
    };
  });
}

function moodY(value: number): number {
  const top = 8;
  const bottom = MOOD_HEIGHT - 16;
  return bottom - ((value - 1) / 4) * (bottom - top);
}

function moodX(index: number): number {
  return (index / (COLUMN_COUNT - 1)) * CHART_WIDTH;
}

export function MinTrends({ p, ratings, now }: Props) {
  const days = React.useMemo(() => buildSevenDayTrendBuckets(ratings, now), [ratings, now?.getTime()]);
  const moodPoints = days
    .map((day, index) => (day.moodAverage === null ? null : { x: moodX(index), y: moodY(day.moodAverage), key: day.key }))
    .filter((point): point is { x: number; y: number; key: string } => point !== null);
  const moodPath = moodPoints.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <View style={styles.wrap} testID="min-trends">
      <Text style={[styles.sectionTitle, { color: p.subtle }]}>TRENDS · 7 DAYS</Text>

      <View style={styles.barsRow} testID="min-trends-efficiency">
        {days.map((day) => {
          const barHeight = day.efficiencyAverage === null ? 1 : Math.max(6, (day.efficiencyAverage / 5) * 54);
          return (
            <View key={day.key} style={styles.dayColumn} testID="min-trends-day">
              <View style={[styles.barTrack, { borderColor: p.line, backgroundColor: p.bg }]}>
                {day.efficiencyAverage === null ? (
                  <View testID="min-trends-empty-day" style={[styles.emptyBar, { backgroundColor: p.line }]} />
                ) : (
                  <View
                    testID="min-trends-efficiency-bar"
                    style={[styles.efficiencyBar, { height: barHeight, backgroundColor: p.ink }]}
                  />
                )}
              </View>
              <Text style={[styles.dayLabel, { color: p.subtle }]} numberOfLines={1}>
                {day.label}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.moodBlock}>
        <View style={styles.moodLabels}>
          <Text style={[styles.moodLabel, { color: p.subtle }]}>{MOOD_LABELS[4]}</Text>
          <Text style={[styles.moodLabel, { color: p.subtle }]}>{MOOD_LABELS[2]}</Text>
          <Text style={[styles.moodLabel, { color: p.subtle }]}>{MOOD_LABELS[0]}</Text>
        </View>
        <View style={styles.moodChart} testID="min-trends-mood">
          <Svg width="100%" height={MOOD_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${MOOD_HEIGHT}`}>
            {[1, 3, 5].map((level) => (
              <Line
                key={level}
                x1="0"
                x2={CHART_WIDTH}
                y1={moodY(level)}
                y2={moodY(level)}
                stroke={p.line}
                strokeWidth="1"
                strokeDasharray="3 5"
              />
            ))}
            {moodPoints.length > 1 ? (
              <Polyline testID="min-trends-mood-line" points={moodPath} fill="none" stroke={p.ink} strokeWidth="1" />
            ) : null}
            {moodPoints.map((point) => (
              <Circle key={point.key} testID="min-trends-mood-point" cx={point.x} cy={point.y} r="3" fill={p.bg} stroke={p.ink} strokeWidth="1.5" />
            ))}
          </Svg>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  dayColumn: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  barTrack: {
    width: '100%',
    maxWidth: 28,
    height: 58,
    borderWidth: 1,
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  efficiencyBar: {
    width: '100%',
  },
  emptyBar: {
    height: 1,
    width: '100%',
  },
  dayLabel: {
    marginTop: 7,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  moodBlock: {
    flexDirection: 'row',
    marginTop: 18,
    minHeight: MOOD_HEIGHT,
  },
  moodLabels: {
    width: 24,
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  moodLabel: {
    fontSize: 10,
    lineHeight: 12,
  },
  moodChart: {
    flex: 1,
    minWidth: 0,
  },
});
