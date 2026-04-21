import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ThemePalette } from '../../types';
import { StarlightPaletteCell } from './parts';
import type { StarlightPaletteColors } from './starlightTypes';

type Props = {
  p: StarlightPaletteColors;
  paletteId: string;
  palettes: ThemePalette[];
  onSelectPalette: (id: string) => void;
};

export function StarSettings({ p, paletteId, palettes, onSelectPalette }: Props) {
  const current = palettes.find((palette) => palette.id === paletteId);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: p.subtle }]}>Ambience</Text>
        <Text style={[styles.title, { color: p.ink }]}>Settings</Text>
      </View>

      <ScrollView testID="starlight-settings" contentContainerStyle={styles.scroll}>
        <Text style={[styles.sectionTitle, { color: p.subtle }]}>Palette</Text>
        <View style={styles.paletteGrid}>
          {palettes.map((palette) => (
            <StarlightPaletteCell
              key={palette.id}
              p={p}
              palette={palette}
              selected={palette.id === paletteId}
              onPress={() => onSelectPalette(palette.id)}
              testID={`starlight-palette-${palette.id}`}
              selectedTestID={`starlight-palette-active-${palette.id}`}
            />
          ))}
        </View>

        <Text style={[styles.sectionTitle, styles.themeTitle, { color: p.subtle }]}>Theme</Text>
        <View testID="starlight-settings-current-palette" style={[styles.themeCard, { backgroundColor: p.panel, borderColor: p.line }]}>
          <Text style={[styles.themeKicker, { color: p.subtle }]}>Current palette</Text>
          <Text style={[styles.themeName, { color: p.ink }]}>{current?.label ?? paletteId}</Text>
          <Text testID="starlight-settings-current-palette-id" style={[styles.themeSub, { color: p.subtle }]}>
            {paletteId}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 32,
    paddingHorizontal: 22,
    paddingBottom: 14,
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 6,
    fontFamily: 'Fraunces-Regular',
    fontSize: 36,
    lineHeight: 42,
    fontStyle: 'italic',
  },
  scroll: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 36,
  },
  sectionTitle: {
    marginTop: 6,
    marginBottom: 10,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  themeTitle: {
    marginTop: 24,
  },
  themeCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  themeKicker: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  themeName: {
    marginTop: 2,
    fontFamily: 'Fraunces-Regular',
    fontSize: 18,
    fontStyle: 'italic',
  },
  themeSub: {
    marginTop: 2,
    fontSize: 11,
  },
});
