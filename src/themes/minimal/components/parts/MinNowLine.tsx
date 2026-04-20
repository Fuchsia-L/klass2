import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import type { MinimalPaletteColors } from '../minimalTypes';
import { usePulse } from './usePulse';

type Props = {
  p: MinimalPaletteColors;
  time: string;
};

export function MinNowLine({ p, time }: Props) {
  const opacity = usePulse();

  return (
    <View style={styles.wrap}>
      <View style={styles.timeCol}>
        <Text style={[styles.time, { color: p.ink }]}>{time}</Text>
      </View>
      <Animated.View style={[styles.line, { backgroundColor: p.nowLine, opacity }]}>
        <View style={[styles.node, { backgroundColor: p.nowLine }]} />
        <Text style={[styles.label, { color: p.ink, backgroundColor: p.bg }]}>NOW</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingRight: 20,
    paddingBottom: 10,
  },
  timeCol: {
    width: 62,
    paddingRight: 10,
    alignItems: 'flex-end',
  },
  time: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    fontVariant: ['tabular-nums'],
  },
  line: {
    flex: 1,
    height: 1,
    position: 'relative',
  },
  node: {
    position: 'absolute',
    left: -3,
    top: -3,
    width: 7,
    height: 7,
  },
  label: {
    position: 'absolute',
    right: 0,
    top: -7,
    paddingLeft: 4,
    paddingRight: 8,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
