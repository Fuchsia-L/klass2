import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import type { StarlightPaletteColors } from '../starlightTypes';
import type { FlyVariant } from './starlightMotion';
import { useFirefly } from './starlightMotion';

export type StarlightTimelineState = 'past' | 'now' | 'next' | 'upcoming';

export type StarlightTimelineEvent = {
  id: string | number;
  startLabel: string;
  endLabel: string;
  title: string;
  location?: string;
  categoryLabel: string;
  state: StarlightTimelineState;
};

export type StarlightTimelineRating = {
  efficiency: number;
  moodLabel?: string;
};

type Props = {
  p: StarlightPaletteColors;
  event: StarlightTimelineEvent;
  rating?: StarlightTimelineRating;
  onOpen: () => void;
  onRate?: () => void;
  testID?: string;
};

const ROW_FIREFLIES: Array<{ variant: FlyVariant; top: number; right: number; duration: number }> = [
  { variant: 'flyA', top: 10, right: 14, duration: 5800 },
  { variant: 'flyB', top: 32, right: 28, duration: 6400 },
  { variant: 'flyC', top: 52, right: 8, duration: 7200 },
];

function RowFirefly({
  p,
  variant,
  top,
  right,
  duration,
  seed,
}: {
  p: StarlightPaletteColors;
  variant: FlyVariant;
  top: number;
  right: number;
  duration: number;
  seed: number;
}) {
  const animatedStyle = useFirefly(variant, duration, ((seed * 13) % 50) * 100);

  return (
    <Animated.View
      testID="starlight-row-firefly"
      style={[styles.rowFirefly, { top, right, backgroundColor: p.firefly, shadowColor: p.firefly }, animatedStyle]}
    />
  );
}

export function StarlightTimelineRow({ p, event, rating, onOpen, onRate, testID }: Props) {
  const isPast = event.state === 'past';
  const isNext = event.state === 'next';
  const isUpcoming = event.state === 'upcoming';
  const textColor = isPast ? p.dim : p.ink;
  const metaColor = isPast ? p.dim : p.subtle;
  const seed = typeof event.id === 'number' ? event.id : event.id.length;

  return (
    <Pressable
      testID={testID}
      onPress={onOpen}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? p.panel : 'transparent',
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      <View style={styles.timeCol}>
        <Text
          style={[
            styles.start,
            { color: textColor, textDecorationLine: isPast ? 'line-through' : 'none', textDecorationColor: p.dim },
          ]}
        >
          {event.startLabel}
        </Text>
        <Text style={[styles.end, { color: metaColor }]}>{event.endLabel}</Text>
      </View>
      <View testID="starlight-timeline-rail" style={[styles.rail, { backgroundColor: p.line, opacity: isPast ? 0.6 : 1 }]}>
        <View
          style={[
            styles.dot,
            {
              backgroundColor: isNext ? p.accent : isPast ? 'transparent' : p.panelSolid,
              borderColor: isNext ? p.accent : isPast ? p.line : p.subtle,
              shadowColor: p.accent,
              shadowOpacity: isNext ? 0.8 : 0,
            },
          ]}
        />
      </View>
      <View style={styles.body}>
        <Text
          style={[
            styles.title,
            {
              color: textColor,
              fontFamily: isNext ? 'Fraunces-SemiBold' : 'Inter-Medium',
              fontStyle: isNext ? 'italic' : 'normal',
              textDecorationLine: isPast ? 'line-through' : 'none',
              textDecorationColor: p.dim,
            },
          ]}
          numberOfLines={1}
        >
          {event.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.meta, { color: metaColor }]} numberOfLines={1}>
            {event.location || '-'}
          </Text>
          <Text style={[styles.sep, { color: metaColor }]}>·</Text>
          <Text style={[styles.tag, { color: metaColor }]}>{event.categoryLabel}</Text>
          {isPast && rating ? (
            <>
              <Text style={[styles.sep, { color: metaColor }]}>·</Text>
              <Text style={[styles.rating, { color: p.accent }]}>
                EFF {rating.efficiency}/5{rating.moodLabel ? ` · ${rating.moodLabel}` : ''}
              </Text>
            </>
          ) : null}
          {isPast && !rating && onRate ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onRate();
              }}
              style={[styles.rateBtn, { borderColor: p.accent }]}
            >
              <Text style={[styles.rateText, { color: p.accent }]}>未评 +</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      {isUpcoming
        ? ROW_FIREFLIES.map((item, index) => (
            <RowFirefly key={item.variant} p={p} seed={seed * 3 + index + 1} {...item} />
          ))
        : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'relative',
    flexDirection: 'row',
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  timeCol: {
    width: 62,
    paddingRight: 10,
    alignItems: 'flex-end',
  },
  start: {
    fontFamily: 'Fraunces-Regular',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 17,
    fontVariant: ['tabular-nums'],
  },
  end: {
    fontSize: 10,
    marginTop: 2,
  },
  rail: {
    width: 1,
    marginRight: 16,
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    left: -3,
    top: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  body: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  meta: {
    flexShrink: 1,
    fontSize: 12,
  },
  sep: {
    opacity: 0.4,
    fontSize: 12,
  },
  tag: {
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '500',
  },
  rating: {
    fontSize: 10,
    letterSpacing: 0.8,
    fontWeight: '500',
  },
  rateBtn: {
    marginLeft: 'auto',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rateText: {
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  rowFirefly: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 3,
    shadowOpacity: 0.85,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
});
