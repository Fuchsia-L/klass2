import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import type { StarlightPaletteColors } from '../starlightTypes';

type Props = {
  p: StarlightPaletteColors;
  label: string;
  onPress: () => void;
  primary?: boolean;
  flex?: number;
  disabled?: boolean;
  testID?: string;
};

export function StarlightSheetBtn({
  p,
  label,
  onPress,
  primary = false,
  flex = 1,
  disabled = false,
  testID,
}: Props) {
  const activePrimary = primary && !disabled;

  return (
    <Pressable
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        {
          flex,
          backgroundColor: activePrimary ? p.accent : disabled ? p.panel : 'transparent',
          borderColor: activePrimary ? p.accent : p.line,
          opacity: pressed ? 0.86 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          shadowColor: p.nowGlow,
          shadowOpacity: activePrimary ? 0.8 : 0,
        },
      ]}
    >
      <Text style={[styles.text, { color: activePrimary ? (p.dark ? p.bg : '#ffffff') : disabled ? p.dim : p.ink }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 14,
    borderWidth: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  text: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
