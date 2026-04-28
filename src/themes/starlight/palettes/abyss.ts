import type { ThemeConfig } from '../../../theme/types';
import type { ThemePalette } from '../../types';
import type { StarlightPaletteColors } from '../components/starlightTypes';

export const STARLIGHT_ABYSS_COLORS: StarlightPaletteColors = {
  dark: true,
  bg: '#020814',
  bgGrad: 'radial-gradient(150% 95% at 30% 105%, #083040 0%, #04162a 45%, #010408 100%)',
  ink: '#d8ecf0',
  dim: '#2e4a58',
  line: 'rgba(140,210,220,0.10)',
  subtle: '#6a98a8',
  panel: 'rgba(10,32,48,0.55)',
  panelSolid: '#071826',
  accent: '#7cdee0',
  accent2: '#8abfe0',
  nowLine: '#7cdee0',
  nowGlow: 'rgba(124,222,224,0.50)',
  moonFace: '#e8f8fa',
  moonShadow: 'rgba(100,170,190,0.55)',
  star: '#e8f8ff',
  firefly: '#a0e8d8',
  sheetScrim: 'rgba(1,4,10,0.72)',
  galaxy: 'radial-gradient(ellipse 120% 50% at 70% 80%, rgba(90,200,220,0.07) 0%, transparent 65%)',
};

export function buildStarlightAbyssThemeConfig(id: string): ThemeConfig {
  return {
    id,
    name: 'Starlight Abyss',
    colors: {
      bg: STARLIGHT_ABYSS_COLORS.bg,
      card: STARLIGHT_ABYSS_COLORS.panelSolid,
      cardBorder: STARLIGHT_ABYSS_COLORS.line,
      primary: STARLIGHT_ABYSS_COLORS.accent,
      accent: STARLIGHT_ABYSS_COLORS.accent2,
      success: '#8EE6C0',
      ratingFill: STARLIGHT_ABYSS_COLORS.firefly,
      danger: '#FF7A9A',
      warning: '#FFC080',
      textMain: STARLIGHT_ABYSS_COLORS.ink,
      textSub: STARLIGHT_ABYSS_COLORS.subtle,
      overlay: STARLIGHT_ABYSS_COLORS.sheetScrim,
      inputBg: STARLIGHT_ABYSS_COLORS.panel,
      divider: STARLIGHT_ABYSS_COLORS.line,
      priorityHigh: '#FF7A9A',
      priorityMedium: '#FFC080',
      priorityLow: STARLIGHT_ABYSS_COLORS.subtle,
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

export const starlightAbyssPalette: ThemePalette = {
  id: 'starlight-abyss',
  label: 'Starlight Abyss',
  sub: '幽蓝深海',
  preview: {
    bg: STARLIGHT_ABYSS_COLORS.bg,
    ink: STARLIGHT_ABYSS_COLORS.ink,
    accent: STARLIGHT_ABYSS_COLORS.accent,
    line: STARLIGHT_ABYSS_COLORS.line,
  },
  themeConfig: buildStarlightAbyssThemeConfig('starlight-abyss'),
};
