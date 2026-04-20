import type { ScheduleEvent } from '../../../features/schedule/types';
import type { TimeSlotRating } from '../../../features/rating/types';
import type { TodoItem } from '../../../features/todo/types';
import type { ThemePalette } from '../../types';
import { MINIMAL_BLACK_COLORS } from '../palettes/black';
import { MINIMAL_GHOST_COLORS } from '../palettes/ghost';
import { MINIMAL_GRAPHITE_COLORS } from '../palettes/graphite';
import { MINIMAL_INK_COLORS } from '../palettes/ink';
import { MINIMAL_PAPER_COLORS } from '../palettes/paper';
import { MINIMAL_SLATE_COLORS } from '../palettes/slate';

export type MinimalTab = 'today' | 'week' | 'todos' | 'settings';

export type MinimalPaletteColors = {
  bg: string;
  ink: string;
  dim: string;
  line: string;
  subtle: string;
  panel: string;
  accent: string;
  nowLine: string;
  sheetScrim: string;
};

export const MINIMAL_COLORS_BY_ID: Record<string, MinimalPaletteColors> = {
  'minimal-black': MINIMAL_BLACK_COLORS,
  'minimal-ghost': MINIMAL_GHOST_COLORS,
  'minimal-graphite': MINIMAL_GRAPHITE_COLORS,
  'minimal-ink': MINIMAL_INK_COLORS,
  'minimal-paper': MINIMAL_PAPER_COLORS,
  'minimal-slate': MINIMAL_SLATE_COLORS,
};

export type MinimalEvent = ScheduleEvent & {
  state: 'past' | 'now' | 'next' | 'upcoming';
};

export type RatingsByEventId = Record<string, TimeSlotRating | undefined>;

export type MinimalTodoPatch = Partial<Pick<TodoItem, 'title' | 'notes'>>;

export type PaletteChoice = ThemePalette;

export const MOOD_LABELS = ['困', '躁', '平', '好', '极'] as const;
export const MOOD_FACES = ['(๑-_-๑)', '(>﹏<)', '( ･_･)', '( ´ ▽ ` )', '(๑>ᴗ<๑)'] as const;

export function moodToIndex(mood: string | undefined): number {
  if (!mood) return 0;
  const index = MOOD_LABELS.indexOf(mood as (typeof MOOD_LABELS)[number]);
  return index === -1 ? 0 : index + 1;
}

export function categoryLabel(event: Pick<ScheduleEvent, 'category'>): string {
  switch (event.category) {
    case '学习':
      return 'STUDY';
    case '工作':
      return 'WORK';
    case '生活':
      return 'LIFE';
    case '运动':
      return 'SPORT';
    case '娱乐':
      return 'FUN';
    case '其他':
    default:
      return 'OTHER';
  }
}

export function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '--:--';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function formatDateDots(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '--.--.----';
  return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
}

export function durationMinutes(event: Pick<ScheduleEvent, 'start_time' | 'end_time'>): number {
  const start = new Date(event.start_time).getTime();
  const end = new Date(event.end_time).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.max(0, Math.round((end - start) / 60000));
}

export function todoDueLabel(todo: TodoItem): string {
  if (todo.type === 'daily') return '今日';
  if (todo.type === 'weekly') return '本周';
  return '长期';
}
