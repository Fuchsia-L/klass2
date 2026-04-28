import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import type { StarlightPaletteColors } from '../starlightTypes';
import { useMoonPulse } from './starlightMotion';

type Props = {
  p: StarlightPaletteColors;
  size?: number;
  phase?: number;
  testID?: string;
};

export function StarlightMoon({ p, size = 14, phase = 0.75, testID = 'starlight-moon' }: Props) {
  const pulseStyle = useMoonPulse(p.dark);
  const shadowWidth = Math.max(0, size * (1 - phase * 1.2));

  return (
    <Animated.View
      testID={testID}
      style={[
        styles.moon,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: p.moonFace,
          shadowColor: p.nowGlow,
          shadowOpacity: p.dark ? 0.55 : 0.2,
          shadowRadius: p.dark ? 24 : 8,
          elevation: p.dark ? 12 : 4,
        },
        pulseStyle,
      ]}
    >
      <View
        testID="starlight-moon-shadow"
        style={[
          styles.shadow,
          {
            width: shadowWidth,
            height: size,
            borderRadius: size / 2,
            backgroundColor: p.moonShadow,
            opacity: p.dark ? 0.55 : 0.25,
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  moon: {
    position: 'relative',
    flexShrink: 0,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
  },
  shadow: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
});
