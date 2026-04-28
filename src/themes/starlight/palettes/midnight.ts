import type { ThemeConfig } from '../../../theme/types';
import type { ThemePalette } from '../../types';
import type { StarlightPaletteColors } from '../components/starlightTypes';

export const STARLIGHT_MIDNIGHT_COLORS: StarlightPaletteColors = {
  dark: true,
  bg: '#03060f',
  bgGrad: 'radial-gradient(150% 95% at 50% -5%, #0a1838 0%, #050a1f 50%, #020410 100%)',
  ink: '#e0eaff',
  dim: '#3a4670',
  line: 'rgba(155,193,255,0.10)',
  subtle: '#8094c0',
  panel: 'rgba(15,28,58,0.55)',
  panelSolid: '#0c1630',
  accent: '#9bc1ff',
  accent2: '#b8a8ff',
  nowLine: '#9bc1ff',
  nowGlow: 'rgba(155,193,255,0.55)',
  moonFace: '#eaf1ff',
  moonShadow: 'rgba(120,145,200,0.55)',
  star: '#ffffff',
  firefly: '#c3e0ff',
  sheetScrim: 'rgba(2,4,12,0.72)',
  galaxy: 'radial-gradient(ellipse 120% 50% at 60% 70%, rgba(110,150,230,0.07) 0%, transparent 65%)',
};

export function buildStarlightMidnightThemeConfig(id: string): ThemeConfig {
  return {
    id,
    name: 'Starlight Midnight',
    colors: {
      bg: STARLIGHT_MIDNIGHT_COLORS.bg,
      card: STARLIGHT_MIDNIGHT_COLORS.panelSolid,
      cardBorder: STARLIGHT_MIDNIGHT_COLORS.line,
      primary: STARLIGHT_MIDNIGHT_COLORS.accent,
      accent: STARLIGHT_MIDNIGHT_COLORS.accent2,
      success: '#8EE6A1',
      ratingFill: STARLIGHT_MIDNIGHT_COLORS.firefly,
      danger: '#FF7A9A',
      warning: '#FFC080',
      textMain: STARLIGHT_MIDNIGHT_COLORS.ink,
      textSub: STARLIGHT_MIDNIGHT_COLORS.subtle,
      overlay: STARLIGHT_MIDNIGHT_COLORS.sheetScrim,
      inputBg: STARLIGHT_MIDNIGHT_COLORS.panel,
      divider: STARLIGHT_MIDNIGHT_COLORS.line,
      priorityHigh: '#FF7A9A',
      priorityMedium: '#FFC080',
      priorityLow: STARLIGHT_MIDNIGHT_COLORS.subtle,
    },
    fonts: {
      heading: 'NotoSerifSC-SemiBold',
      body: 'NotoSansSC-Regular',
    },
    radius: {
      card: 14,
      button: 999,
      sheet: 28,
    },
  };
}

export const starlightMidnightPalette: ThemePalette = {
  id: 'starlight-midnight',
  label: 'Starlight Midnight',
  sub: '深蓝之夜',
  preview: {
    bg: STARLIGHT_MIDNIGHT_COLORS.bg,
    ink: STARLIGHT_MIDNIGHT_COLORS.ink,
    accent: STARLIGHT_MIDNIGHT_COLORS.accent,
    line: STARLIGHT_MIDNIGHT_COLORS.line,
  },
  themeConfig: buildStarlightMidnightThemeConfig('starlight-midnight'),
};
