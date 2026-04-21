import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useThemeSettings } from '../../../theme/ThemeContext';
import type { ThemePalette } from '../../types';
import type { StarlightPaletteColors } from './starlightTypes';

type Props = {
  p: StarlightPaletteColors;
  paletteId: string;
  palettes: ThemePalette[];
  onSelectPalette?: (id: string) => void;
};

// Hex-opacity helper — appends 2-digit alpha to a #rrggbb hex color.
// Falls back to rgba() if the input isn't a 6-digit hex.
function withAlpha(hex: string, alpha01: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha01)) * 255)
    .toString(16)
    .padStart(2, '0');
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return `${hex}${a}`;
  return hex;
}

// Micro-starfield positions — deterministic, matches HTML's `(i * 37) % 100 / (i * 53) % 100` pattern.
const PREVIEW_STARS = Array.from({ length: 8 }, (_, i) => ({
  top: `${(i * 37) % 100}%` as `${number}%`,
  left: `${(i * 53) % 100}%` as `${number}%`,
}));

export function StarSettings({ p, paletteId, palettes, onSelectPalette }: Props) {
  const { setThemeName } = useThemeSettings();
  const selectPalette = onSelectPalette ?? setThemeName;
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
            <PaletteCard
              key={palette.id}
              p={p}
              palette={palette}
              selected={palette.id === paletteId}
              onPress={() => selectPalette(palette.id)}
            />
          ))}
        </View>

        <Text style={[styles.sectionTitle, styles.themeTitle, { color: p.subtle }]}>Theme</Text>
        <View
          testID="starlight-settings-current-palette"
          style={[styles.themeCard, { borderColor: p.line }]}
        >
          <BlurView
            intensity={20}
            tint={p.dark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { backgroundColor: p.panel }]}
          />
          <Text style={[styles.themeKicker, { color: p.subtle }]}>Current palette</Text>
          <Text style={[styles.themeName, { color: p.ink }]}>{current?.label ?? paletteId}</Text>
          <Text
            testID="starlight-settings-current-palette-id"
            style={[styles.themeSub, { color: p.subtle }]}
          >
            {paletteId}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

type CardProps = {
  p: StarlightPaletteColors;
  palette: ThemePalette;
  selected: boolean;
  onPress: () => void;
};

function PaletteCard({ p, palette, selected, onPress }: CardProps) {
  const preview = palette.preview;

  // Best-effort gradient that echoes HTML's `bgGrad` radial feel without access to the full palette object.
  // Top-left brighter → center/bottom deeper, using preview.accent tint at low alpha over preview.bg.
  const gradStart = withAlpha(preview.accent, 0.24);
  const gradMid = withAlpha(preview.ink, 0.06);
  const gradEnd = preview.bg;

  // Third swatch dot — derive a soft secondary from preview.ink (since ThemePalette doesn't expose accent2).
  const softInkDot = withAlpha(preview.ink, 0.3);

  // The HTML sub label is uppercase — palette.sub already provides short text like "深紫星云".
  const subText = palette.sub ?? '';

  return (
    <Pressable
      testID={`starlight-palette-${palette.id}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          borderColor: selected ? p.accent : p.line,
          shadowColor: p.nowGlow,
          shadowOpacity: selected ? 0.9 : 0,
          shadowRadius: selected ? 18 : 0,
          shadowOffset: { width: 0, height: 0 },
          elevation: selected ? 8 : 0,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      {/* base bg fill — sits below the gradient to catch any gaps */}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: preview.bg }]}
      />
      {/* approximated radial-gradient — accent-tinted wash falling to deep bg */}
      <LinearGradient
        colors={[gradStart, gradMid, gradEnd]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.2, y: -0.05 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* extra accent glow blob — further mimics nebula radial feel */}
      <View
        pointerEvents="none"
        style={[
          styles.cardGlow,
          {
            backgroundColor: preview.accent,
            opacity: 0.12,
          },
        ]}
      />
      {/* micro-starfield preview */}
      {PREVIEW_STARS.map((star, i) => (
        <View
          key={i}
          pointerEvents="none"
          style={[
            styles.previewStar,
            {
              top: star.top,
              left: star.left,
              backgroundColor: preview.ink,
            },
          ]}
        />
      ))}
      <View style={styles.cardBody}>
        <Text style={[styles.paletteName, { color: preview.ink }]} numberOfLines={1}>
          {palette.label.replace(/^Starlight\s+/, '')}
        </Text>
        {subText ? (
          <Text
            style={[styles.paletteSub, { color: withAlpha(preview.ink, 0.55) }]}
            numberOfLines={1}
          >
            {subText}
          </Text>
        ) : null}
        <View style={styles.swatchRow}>
          <View style={[styles.swatchDot, { backgroundColor: preview.accent }]} />
          <View
            style={[
              styles.swatchDot,
              { backgroundColor: withAlpha(preview.accent, 0.55) },
            ]}
          />
          <View style={[styles.swatchDot, { backgroundColor: softInkDot }]} />
        </View>
      </View>
      {selected ? (
        <Text
          testID={`starlight-palette-active-${palette.id}`}
          style={[styles.activeMark, { color: p.accent }]}
        >
          Selected
        </Text>
      ) : null}
    </Pressable>
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
    fontFamily: 'Inter-Medium',
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
    letterSpacing: -0.8,
    fontStyle: 'italic',
  },
  scroll: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 40,
  },
  sectionTitle: {
    marginTop: 6,
    marginBottom: 10,
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 10,
    rowGap: 10,
  },
  card: {
    width: '48.5%',
    minHeight: 118,
    borderWidth: 1,
    borderRadius: 14,
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  cardGlow: {
    position: 'absolute',
    top: -40,
    left: -40,
    width: 140,
    height: 140,
    borderRadius: 80,
  },
  cardBody: {
    position: 'relative',
  },
  previewStar: {
    position: 'absolute',
    width: 1.5,
    height: 1.5,
    borderRadius: 2,
    opacity: 0.65,
  },
  paletteName: {
    fontFamily: 'Fraunces-Medium',
    fontSize: 18,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  paletteSub: {
    marginTop: 2,
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 10,
  },
  swatchDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  activeMark: {
    position: 'absolute',
    right: 12,
    bottom: 10,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    letterSpacing: 1.4,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  themeTitle: {
    marginTop: 24,
  },
  themeCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    overflow: 'hidden',
  },
  themeKicker: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  themeName: {
    marginTop: 4,
    fontFamily: 'Fraunces-Regular',
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.3,
    fontStyle: 'italic',
  },
  themeSub: {
    marginTop: 4,
    fontFamily: 'Inter-Regular',
    fontSize: 11,
  },
});
