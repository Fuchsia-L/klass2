import type { ThemeConfig } from '../../../theme/types';
import type { ThemePalette } from '../../types';
import type { StarlightPaletteColors } from '../components/starlightTypes';

export const STARLIGHT_NEBULA_COLORS: StarlightPaletteColors = {
  dark: true,
  bg: '#060417',
  bgGrad: 'radial-gradient(150% 95% at 20% -5%, #1a103a 0%, #0a0624 45%, #04030f 100%)',
  ink: '#e8dffe',
  dim: '#4a4274',
  line: 'rgba(201,182,255,0.10)',
  subtle: '#9688c8',
  panel: 'rgba(30,20,60,0.55)',
  panelSolid: '#14102a',
  accent: '#c9b6ff',
  accent2: '#6ea8ff',
  nowLine: '#c9b6ff',
  nowGlow: 'rgba(201,182,255,0.55)',
  moonFace: '#f3ecff',
  moonShadow: 'rgba(138,120,200,0.55)',
  star: '#ffffff',
  firefly: '#ffd89b',
  sheetScrim: 'rgba(4,3,15,0.72)',
  galaxy: 'radial-gradient(ellipse 120% 50% at 40% 70%, rgba(140,110,220,0.08) 0%, transparent 65%)',
};

export function buildStarlightNebulaThemeConfig(id: string): ThemeConfig {
  return {
    id,
    name: 'Starlight Nebula',
    colors: {
      bg: STARLIGHT_NEBULA_COLORS.bg,
      card: STARLIGHT_NEBULA_COLORS.panelSolid,
      cardBorder: STARLIGHT_NEBULA_COLORS.line,
      primary: STARLIGHT_NEBULA_COLORS.accent,
      accent: STARLIGHT_NEBULA_COLORS.accent2,
      success: '#8EE6A1',
      ratingFill: STARLIGHT_NEBULA_COLORS.firefly,
      danger: '#FF7A9A',
      warning: STARLIGHT_NEBULA_COLORS.firefly,
      textMain: STARLIGHT_NEBULA_COLORS.ink,
      textSub: STARLIGHT_NEBULA_COLORS.subtle,
      overlay: STARLIGHT_NEBULA_COLORS.sheetScrim,
      inputBg: STARLIGHT_NEBULA_COLORS.panel,
      divider: STARLIGHT_NEBULA_COLORS.line,
      priorityHigh: '#FF7A9A',
      priorityMedium: STARLIGHT_NEBULA_COLORS.firefly,
      priorityLow: STARLIGHT_NEBULA_COLORS.subtle,
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

export const starlightNebulaPalette: ThemePalette = {
  id: 'starlight-nebula',
  label: 'Starlight Nebula',
  sub: 'deep violet starfield',
  preview: {
    bg: STARLIGHT_NEBULA_COLORS.bg,
    ink: STARLIGHT_NEBULA_COLORS.ink,
    accent: STARLIGHT_NEBULA_COLORS.accent,
    line: STARLIGHT_NEBULA_COLORS.line,
  },
  themeConfig: buildStarlightNebulaThemeConfig('starlight-nebula'),
};
