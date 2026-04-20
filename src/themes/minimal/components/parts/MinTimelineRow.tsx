import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MinimalEvent, MinimalPaletteColors } from '../minimalTypes';
import { categoryLabel, formatTime } from '../minimalTypes';
import type { TimeSlotRating } from '../../../../features/rating/types';

type Props = {
  event: MinimalEvent;
  p: MinimalPaletteColors;
  rating?: TimeSlotRating;
  onOpen: () => void;
  onRate: () => void;
};

export function MinTimelineRow({ event, p, rating, onOpen, onRate }: Props) {
  const isPast = event.state === 'past';
  const isNext = event.state === 'next';
  const textColor = isPast ? p.dim : p.ink;
  const metaColor = isPast ? p.dim : p.subtle;

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? p.panel : 'transparent', transform: [{ scale: pressed ? 0.985 : 1 }] },
      ]}
    >
      <View style={styles.timeCol}>
        <Text
          style={[
            styles.start,
            { color: textColor, textDecorationLine: isPast ? 'line-through' : 'none', textDecorationColor: p.dim },
          ]}
        >
          {formatTime(event.start_time)}
        </Text>
        <Text style={[styles.end, { color: metaColor }]}>{formatTime(event.end_time)}</Text>
      </View>
      <View style={[styles.rail, { backgroundColor: p.line, opacity: isPast ? 0.5 : 1 }]}>
        <View
          style={[
            styles.dot,
            {
              backgroundColor: isNext ? p.ink : isPast ? 'transparent' : p.bg,
              borderColor: isPast ? p.line : p.ink,
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
              fontWeight: isNext ? '600' : '500',
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
          <Text style={[styles.tag, { color: metaColor }]}>{categoryLabel(event)}</Text>
          {isPast && rating ? (
            <>
              <Text style={[styles.sep, { color: metaColor }]}>·</Text>
              <Text style={[styles.rating, { color: p.ink }]}>EFF {rating.efficiency}/5 · {rating.mood}</Text>
            </>
          ) : null}
          {isPast && !rating ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onRate();
              }}
              style={[styles.rateBtn, { borderColor: p.ink }]}
            >
              <Text style={[styles.rateText, { color: p.ink }]}>未评 +</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'relative',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  timeCol: {
    width: 62,
    paddingRight: 10,
    alignItems: 'flex-end',
  },
  start: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 16,
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
    borderWidth: 1,
  },
  body: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
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
    fontWeight: '600',
  },
  rating: {
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '600',
  },
  rateBtn: {
    marginLeft: 'auto',
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  rateText: {
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
