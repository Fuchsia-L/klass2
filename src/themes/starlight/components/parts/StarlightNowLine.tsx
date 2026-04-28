import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { StarlightPaletteColors } from '../starlightTypes';
import { StarlightMoon } from './StarlightMoon';
import { useNowShimmer } from './starlightMotion';

type Props = {
  p: StarlightPaletteColors;
  time: string;
  testID?: string;
};

export function StarlightNowLine({ p, time, testID = 'starlight-now-line' }: Props) {
  const shimmerStyle = useNowShimmer();

  return (
    <View testID={testID} style={styles.wrap}>
      <View style={styles.timeCol}>
        <StarlightMoon p={p} size={12} phase={0.75} />
        <Text style={[styles.time, { color: p.nowLine }]}>{time}</Text>
      </View>
      <Animated.View
        testID="starlight-now-line-bar"
        style={[styles.line, { backgroundColor: p.nowLine, shadowColor: p.nowGlow }, shimmerStyle]}
      >
        <LinearGradient
          colors={[p.nowLine, `${p.nowLine}66`, 'transparent']}
          locations={[0, 0.8, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <Text testID="starlight-now-line-label" style={[styles.label, { color: p.nowLine }]}>
          NOW
        </Text>
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
    paddingRight: 22,
    paddingBottom: 10,
  },
  timeCol: {
    width: 62,
    paddingRight: 10,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  time: {
    fontFamily: 'NotoSerifSC-SemiBold',
    fontSize: 12,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  line: {
    flex: 1,
    height: 1,
    position: 'relative',
    shadowOpacity: 0.85,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  label: {
    position: 'absolute',
    right: 8,
    top: -9,
    paddingHorizontal: 6,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 2,
  },
});
