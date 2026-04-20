import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import type { MinimalPaletteColors } from '../minimalTypes';

type Props = {
  p: MinimalPaletteColors;
  label: string;
  onPress: () => void;
  primary?: boolean;
  flex?: number;
  disabled?: boolean;
  testID?: string;
};

export function MinSheetBtn({ p, label, onPress, primary = false, flex = 1, disabled = false, testID }: Props) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        {
          flex,
          backgroundColor: primary && !disabled ? p.ink : disabled ? p.panel : 'transparent',
          borderColor: p.ink,
          borderLeftWidth: primary ? 0 : 1,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <Text style={[styles.text, { color: primary && !disabled ? p.bg : disabled ? p.dim : p.ink }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
