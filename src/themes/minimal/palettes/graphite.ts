import type { ThemeConfig } from '../../../theme/types';
import type { ThemePalette } from '../../types';

// Graphite — warm dark. Contrast-bumped vs the design drop's panel/line so
// cards visibly separate from the background (the same anti-merge fix
// applied to Ghost).
export const MINIMAL_GRAPHITE_COLORS = {
  bg: '#18160f',
  ink: '#f4ede0',
  dim: '#5c564a',
  line: '#4a432e',
  subtle: '#918a78',
  panel: '#332e1f',
  accent: '#f4ede0',
  nowLine: '#f4ede0',
  sheetScrim: 'rgba(0,0,0,0.55)',
} as const;

export type MinimalPaletteColors = typeof MINIMAL_GRAPHITE_COLORS;

export function buildThemeConfig(id: string): ThemeConfig {
  return {
    id,
    name: 'Minimal Graphite',
    colors: {
      bg: MINIMAL_GRAPHITE_COLORS.bg,
      card: MINIMAL_GRAPHITE_COLORS.panel,
      cardBorder: MINIMAL_GRAPHITE_COLORS.line,
      primary: MINIMAL_GRAPHITE_COLORS.ink,
      accent: MINIMAL_GRAPHITE_COLORS.accent,
      success: '#2E7D32',
      ratingFill: MINIMAL_GRAPHITE_COLORS.accent,
      danger: '#C62828',
      textMain: MINIMAL_GRAPHITE_COLORS.ink,
      textSub: MINIMAL_GRAPHITE_COLORS.subtle,
      overlay: MINIMAL_GRAPHITE_COLORS.sheetScrim,
      inputBg: MINIMAL_GRAPHITE_COLORS.panel,
      divider: MINIMAL_GRAPHITE_COLORS.line,
      priorityHigh: '#C62828',
      priorityMedium: '#EF6C00',
      priorityLow: MINIMAL_GRAPHITE_COLORS.subtle,
    },
    fonts: { heading: 'Orbitron-Bold', body: 'System' },
    radius: { card: 10, button: 6, sheet: 16 },
  };
}

export const minimalGraphitePalette: ThemePalette = {
  id: 'minimal-graphite',
  label: 'Minimal Graphite',
  sub: 'warm dark',
  preview: {
    bg: MINIMAL_GRAPHITE_COLORS.bg,
    ink: MINIMAL_GRAPHITE_COLORS.ink,
    accent: MINIMAL_GRAPHITE_COLORS.accent,
    line: MINIMAL_GRAPHITE_COLORS.line,
  },
  themeConfig: buildThemeConfig('minimal-graphite'),
};
