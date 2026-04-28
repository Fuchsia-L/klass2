import type { ThemeConfig } from '../../../theme/types';
import type { ThemePalette } from '../../types';
import type { StarlightPaletteColors } from '../components/starlightTypes';

export const STARLIGHT_TWILIGHT_COLORS: StarlightPaletteColors = {
  dark: true,
  bg: '#0c0818',
  bgGrad: 'radial-gradient(150% 95% at 80% -5%, #2a1028 0%, #140a22 45%, #060410 100%)',
  ink: '#f0d8ea',
  dim: '#4a3252',
  line: 'rgba(230,180,210,0.10)',
  subtle: '#a08098',
  panel: 'rgba(42,20,44,0.55)',
  panelSolid: '#1a0e22',
  accent: '#f2a8c8',
  accent2: '#c88ce0',
  nowLine: '#f2a8c8',
  nowGlow: 'rgba(242,168,200,0.50)',
  moonFace: '#fdeaf0',
  moonShadow: 'rgba(180,120,150,0.55)',
  star: '#fff2e0',
  firefly: '#ffb080',
  sheetScrim: 'rgba(8,4,16,0.72)',
  galaxy: 'radial-gradient(ellipse 120% 50% at 30% 75%, rgba(220,130,170,0.08) 0%, transparent 65%)',
};

export function buildStarlightTwilightThemeConfig(id: string): ThemeConfig {
  return {
    id,
    name: 'Starlight Twilight',
    colors: {
      bg: STARLIGHT_TWILIGHT_COLORS.bg,
      card: STARLIGHT_TWILIGHT_COLORS.panelSolid,
      cardBorder: STARLIGHT_TWILIGHT_COLORS.line,
      primary: STARLIGHT_TWILIGHT_COLORS.accent,
      accent: STARLIGHT_TWILIGHT_COLORS.accent2,
      success: '#F0C8A0',
      ratingFill: STARLIGHT_TWILIGHT_COLORS.firefly,
      danger: '#FF6A8A',
      warning: STARLIGHT_TWILIGHT_COLORS.firefly,
      textMain: STARLIGHT_TWILIGHT_COLORS.ink,
      textSub: STARLIGHT_TWILIGHT_COLORS.subtle,
      overlay: STARLIGHT_TWILIGHT_COLORS.sheetScrim,
      inputBg: STARLIGHT_TWILIGHT_COLORS.panel,
      divider: STARLIGHT_TWILIGHT_COLORS.line,
      priorityHigh: '#FF6A8A',
      priorityMedium: STARLIGHT_TWILIGHT_COLORS.firefly,
      priorityLow: STARLIGHT_TWILIGHT_COLORS.subtle,
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

export const starlightTwilightPalette: ThemePalette = {
  id: 'starlight-twilight',
  label: 'Starlight Twilight',
  sub: '暮色玫瑰',
  preview: {
    bg: STARLIGHT_TWILIGHT_COLORS.bg,
    ink: STARLIGHT_TWILIGHT_COLORS.ink,
    accent: STARLIGHT_TWILIGHT_COLORS.accent,
    line: STARLIGHT_TWILIGHT_COLORS.line,
  },
  themeConfig: buildStarlightTwilightThemeConfig('starlight-twilight'),
};
