import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { MinimalPaletteColors } from '../minimalTypes';

type Props = {
  p: MinimalPaletteColors;
  label: string;
  value: string;
};

export function MinSheetRow({ p, label, value }: Props) {
  return (
    <View style={[styles.row, { borderBottomColor: p.line }]}>
      <Text style={[styles.label, { color: p.subtle }]}>{label}</Text>
      <Text style={[styles.value, { color: p.ink }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'baseline',
    borderBottomWidth: 1,
  },
  label: {
    flex: 1,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
});
