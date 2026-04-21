import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { StarlightPaletteColors } from '../starlightTypes';

type Props = {
  p: StarlightPaletteColors;
  label: string;
  value: string;
  testID?: string;
};

export function StarlightSheetRow({ p, label, value, testID }: Props) {
  return (
    <View testID={testID} style={[styles.row, { borderBottomColor: p.line }]}>
      <Text style={[styles.label, { color: p.subtle }]}>{label}</Text>
      <Text style={[styles.value, { color: p.ink }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'baseline',
    borderBottomWidth: 1,
    gap: 12,
  },
  label: {
    width: 60,
    fontSize: 10,
    letterSpacing: 1.8,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  value: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: '500',
  },
});
