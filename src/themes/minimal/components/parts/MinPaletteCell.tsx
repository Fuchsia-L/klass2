import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MinimalPaletteColors, PaletteChoice } from '../minimalTypes';
import { MINIMAL_COLORS_BY_ID } from '../minimalTypes';

type Props = {
  p: MinimalPaletteColors;
  palette: PaletteChoice;
  selected: boolean;
  onPress: () => void;
};

export function MinPaletteCell({ p, palette, selected, onPress }: Props) {
  const previewColors = MINIMAL_COLORS_BY_ID[palette.id] ?? p;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.cell, { opacity: selected ? 1 : 0.55, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
    >
      <View style={[styles.swatch, { backgroundColor: previewColors.bg, borderColor: previewColors.line }]}>
        <View style={[styles.swatchBase, { backgroundColor: previewColors.bg }]} />
        <View style={[styles.swatchInk, { backgroundColor: previewColors.ink }]} />
      </View>
      <View style={styles.meta}>
        <Text style={[styles.name, { color: p.ink, fontWeight: selected ? '700' : '500' }]} numberOfLines={1}>
          {palette.label.replace('Minimal ', '')}
        </Text>
        <Text style={[styles.sub, { color: p.subtle }]} numberOfLines={1}>
          {palette.sub ?? ''}
        </Text>
      </View>
      {selected ? <Text style={[styles.dot, { color: p.ink }]}>●</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    width: '50%',
    paddingTop: 14,
    paddingRight: 14,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  swatch: {
    width: 36,
    height: 36,
    borderWidth: 1,
  },
  swatchBase: {
    flex: 1,
  },
  swatchInk: {
    height: 10,
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 13,
  },
  sub: {
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 1,
  },
  dot: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
});
