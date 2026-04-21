import type { ScheduleEvent } from '../../../features/schedule/types';
import type { TimeSlotRating } from '../../../features/rating/types';
import type { ThemePalette } from '../../types';
import { STARLIGHT_NEBULA_COLORS } from '../palettes/nebula';

export type StarlightPaletteColors = {
  dark: boolean;
  bg: string;
  bgGrad: string;
  ink: string;
  dim: string;
  line: string;
  subtle: string;
  panel: string;
  panelSolid: string;
  accent: string;
  accent2: string;
  nowLine: string;
  nowGlow: string;
  moonFace: string;
  moonShadow: string;
  star: string;
  firefly: string;
  sheetScrim: string;
  galaxy: string;
};

export type StarlightPaletteId = 'starlight-nebula';

export type StarlightPaletteMap = Record<StarlightPaletteId, StarlightPaletteColors>;

export type StarlightTab = 'today' | 'week' | 'todos' | 'settings';

export const STARLIGHT_COLORS_BY_ID: Record<string, StarlightPaletteColors> = {
  'starlight-nebula': STARLIGHT_NEBULA_COLORS,
};

export type StarlightEvent = ScheduleEvent & {
  state: 'past' | 'now' | 'next' | 'upcoming';
};

export type RatingsByEventId = Record<string, TimeSlotRating | undefined>;

export type PaletteChoice = ThemePalette;

export const MOOD_LABELS = ['困', '躁', '平', '好', '极'] as const;
