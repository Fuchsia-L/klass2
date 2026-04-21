import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ThemePalette } from '../../../types';
import type { StarlightPaletteColors } from '../starlightTypes';

type Props = {
  p: StarlightPaletteColors;
  palette: ThemePalette;
  selected: boolean;
  onPress: () => void;
  testID?: string;
  selectedTestID?: string;
};

export function StarlightPaletteCell({ p, palette, selected, onPress, testID, selectedTestID }: Props) {
  const preview = palette.preview;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.cell,
        {
          borderColor: selected ? p.accent : p.line,
          backgroundColor: p.panel,
          opacity: selected ? 1 : 0.78,
          shadowColor: p.nowGlow,
          shadowOpacity: selected ? 0.65 : 0,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={[styles.preview, { backgroundColor: preview.bg, borderColor: preview.line }]}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.previewStar,
              {
                top: `${(i * 37) % 100}%`,
                left: `${(i * 53) % 100}%`,
                backgroundColor: preview.ink,
              },
            ]}
          />
        ))}
        <View style={[styles.previewAccent, { backgroundColor: preview.accent }]} />
      </View>
      <View style={styles.meta}>
        <Text style={[styles.name, { color: p.ink }]} numberOfLines={1}>
          {palette.label.replace('Starlight ', '')}
        </Text>
        <Text style={[styles.sub, { color: p.subtle }]} numberOfLines={1}>
          {palette.sub ?? ''}
        </Text>
      </View>
      {selected ? (
        <Text testID={selectedTestID} style={[styles.activeMark, { color: p.accent }]}>
          Selected
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    width: '50%',
    minHeight: 116,
    padding: 14,
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  preview: {
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  previewStar: {
    position: 'absolute',
    width: 1.5,
    height: 1.5,
    borderRadius: 2,
    opacity: 0.6,
  },
  previewAccent: {
    position: 'absolute',
    right: 8,
    bottom: 7,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  meta: {
    marginTop: 10,
  },
  name: {
    fontFamily: 'Fraunces-SemiBold',
    fontSize: 18,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  sub: {
    marginTop: 2,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  activeMark: {
    position: 'absolute',
    right: 12,
    bottom: 10,
    fontSize: 9,
    letterSpacing: 1.4,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
