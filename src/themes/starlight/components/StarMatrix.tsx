import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { CATEGORIES, type CategoryKey, type ScheduleEvent } from '../../../features/schedule/types';
import type { StarlightPaletteColors } from './starlightTypes';
import {
  StarlightMoon,
  StarlightSheetBtn,
  type StarlightTimelineEvent,
} from './parts';
import { useNowShimmer } from './parts/starlightMotion';

export type StarMatrixEvent = ScheduleEvent & { state: StarlightTimelineEvent['state'] };

type Props = {
  p: StarlightPaletteColors;
  events: StarMatrixEvent[];
  weekStart: Date;
  semesterWeek: number | null;
  weekOffset: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onResetWeek: () => void;
  onOpenEvent: (eventId: string) => void;
};

type MatrixBlockData = {
  event: StarMatrixEvent;
  day: number;
  top: number;
  height: number;
  category: CategoryKey;
};

const DAYS = ['一', '二', '三', '四', '五', '六', '日'];
const HOURS = Array.from({ length: 19 }, (_, index) => 6 + index);
const HOUR_HEIGHT = 60;
const START_HOUR = 6;
const MS_DAY = 86400000;

const DARK_INK_ON_ACCENT = '#06060f';

const WEB_DAY_STRIP_STYLE: any = Platform.OS === 'web' ? { overflowY: 'auto', scrollbarGutter: 'stable' } : null;
const WEB_GRID_SCROLL_STYLE: any = Platform.OS === 'web' ? { scrollbarGutter: 'stable' } : null;

function formatRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return `${MONTH(weekStart)} ${weekStart.getDate()} – ${weekEnd.getDate()}`;
}

function MONTH(date: Date): string {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
}

function dayStart(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function minutesSinceStartOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function blockForEvent(event: StarMatrixEvent, weekStart: Date): MatrixBlockData | null {
  const normalizedWeekStart = dayStart(weekStart);
  const weekEnd = new Date(normalizedWeekStart);
  weekEnd.setDate(normalizedWeekStart.getDate() + 7);
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);
  if (start >= weekEnd || end <= normalizedWeekStart) return null;

  const visibleStart = new Date(Math.max(start.getTime(), normalizedWeekStart.getTime()));
  const visibleEnd = new Date(Math.min(end.getTime(), weekEnd.getTime()));
  const day = Math.floor((dayStart(visibleStart).getTime() - normalizedWeekStart.getTime()) / MS_DAY);
  if (day < 0 || day > 6) return null;

  const startMinutes = Math.max(START_HOUR * 60, minutesSinceStartOfDay(visibleStart));
  const endMinutes = Math.min((START_HOUR + HOURS.length) * 60, minutesSinceStartOfDay(visibleEnd));
  const durationMinutes = Math.max(30, endMinutes - startMinutes);

  return {
    event,
    day,
    top: ((startMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT,
    height: (durationMinutes / 60) * HOUR_HEIGHT,
    category: event.category,
  };
}

function rgbaFromHex(hex: string | undefined, alpha: number): string {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return `rgba(255,255,255,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function StarMatrix({
  p,
  events,
  weekStart,
  semesterWeek,
  weekOffset,
  onPrevWeek,
  onNextWeek,
  onResetWeek,
  onOpenEvent,
}: Props) {
  const normalizedWeekStart = dayStart(weekStart);
  const now = new Date();
  const todayIndex = Math.floor((dayStart(now).getTime() - normalizedWeekStart.getTime()) / MS_DAY);
  const showToday = todayIndex >= 0 && todayIndex <= 6;
  const nowTop = Math.max(0, (now.getHours() - START_HOUR) * HOUR_HEIGHT + (now.getMinutes() / 60) * HOUR_HEIGHT);
  const dayNums = DAYS.map((_, index) => {
    const date = new Date(normalizedWeekStart);
    date.setDate(normalizedWeekStart.getDate() + index);
    return date.getDate();
  });
  const blocks = events
    .map((event) => blockForEvent(event, normalizedWeekStart))
    .filter((block): block is MatrixBlockData => !!block);

  const shimmerStyle = useNowShimmer();
  const accentInk = p.dark ? DARK_INK_ON_ACCENT : '#ffffff';

  return (
    <View testID="starlight-matrix" style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.kicker, { color: p.subtle }]}>
            Week {semesterWeek ?? '-'} · {formatRange(normalizedWeekStart)}
          </Text>
          <Text style={[styles.title, { color: p.ink }]}>Constellation</Text>
        </View>
        <View style={styles.nav}>
          {weekOffset !== 0 ? (
            <StarlightSheetBtn p={p} label="This week" onPress={onResetWeek} testID="starlight-matrix-reset-week" />
          ) : null}
          <StarlightSheetBtn p={p} label="‹" onPress={onPrevWeek} testID="starlight-matrix-prev-week" />
          <StarlightSheetBtn p={p} label="›" onPress={onNextWeek} testID="starlight-matrix-next-week" />
        </View>
      </View>

      <View style={[styles.dayStrip, { borderBottomColor: p.line }, WEB_DAY_STRIP_STYLE]}>
        <View style={[styles.gutter, { borderRightColor: p.line }]} />
        {DAYS.map((day, index) => {
          const active = showToday && index === todayIndex;
          const textColor = active ? accentInk : p.ink;
          return (
            <View
              key={day}
              testID={`starlight-matrix-day-${index}`}
              style={[
                styles.dayCell,
                {
                  borderRightColor: p.line,
                  borderRightWidth: index < 6 ? 1 : 0,
                },
              ]}
            >
              {active ? (
                <LinearGradient
                  colors={[p.accent, p.accent2]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />
              ) : null}
              <Text style={[styles.dayName, { color: textColor }]}>{day}</Text>
              <Text style={[styles.dayNum, { color: textColor }]}>{dayNums[index]}</Text>
            </View>
          );
        })}
      </View>

      <ScrollView testID="starlight-matrix-scroll" style={[styles.gridScroll, WEB_GRID_SCROLL_STYLE]}>
        <View style={[styles.gridInner, { height: HOUR_HEIGHT * HOURS.length + 10 }]}>
          <View style={[styles.hourGutter, { borderRightColor: p.line }]}>
            {HOURS.map((hour, index) => (
              <Text
                key={hour}
                style={[styles.hourText, { top: index * HOUR_HEIGHT - 7, color: p.subtle }]}
              >
                {String(hour).padStart(2, '0')}
              </Text>
            ))}
          </View>
          <View style={styles.columns}>
            {HOURS.map((_, index) => (
              <View
                key={index}
                pointerEvents="none"
                style={[styles.hourLine, { top: index * HOUR_HEIGHT, borderTopColor: p.line }]}
              />
            ))}
            {DAYS.map((day, index) => (
              <View
                key={day}
                style={[styles.column, { borderRightColor: p.line, borderRightWidth: index < 6 ? 1 : 0 }]}
              >
                {blocks
                  .filter((block) => block.day === index)
                  .map((block) => (
                    <MatrixBlock
                      key={`${block.event.id}-${block.event.start_time}`}
                      p={p}
                      block={block}
                      onPress={() => onOpenEvent(block.event.id)}
                    />
                  ))}
              </View>
            ))}
            {showToday ? (
              <Animated.View
                pointerEvents="none"
                testID="starlight-matrix-now-marker"
                style={[
                  styles.nowLine,
                  { top: nowTop, shadowColor: p.nowGlow },
                  shimmerStyle,
                ]}
              >
                <LinearGradient
                  colors={['transparent', p.nowLine, `${p.nowLine}66`, 'transparent']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />
                <View style={styles.nowMoon}>
                  <StarlightMoon p={p} size={12} phase={0.75} />
                </View>
              </Animated.View>
            ) : null}
          </View>
        </View>
        {blocks.length === 0 ? (
          <View style={[styles.emptyPanel, { borderColor: p.line, backgroundColor: p.panel }]}>
            <Text style={[styles.emptyTitle, { color: p.ink }]}>No constellations</Text>
            <Text style={[styles.emptyText, { color: p.subtle }]}>This selected week has no scheduled events.</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function MatrixBlock({
  p,
  block,
  onPress,
}: {
  p: StarlightPaletteColors;
  block: MatrixBlockData;
  onPress: () => void;
}) {
  const categoryColor = CATEGORIES[block.category]?.color;
  const isPast = block.event.state === 'past';
  const isNext = block.event.state === 'next' || block.event.state === 'now';
  const thin = block.height < 38;
  const titleLines = Math.max(1, Math.floor((block.height - 8) / 13));

  const accentInk = p.dark ? DARK_INK_ON_ACCENT : '#ffffff';
  const textColor = isNext ? accentInk : isPast ? p.dim : p.ink;
  const metaColor = isNext ? accentInk : p.subtle;

  return (
    <Pressable
      testID={`starlight-matrix-event-${block.event.id}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.block,
        {
          top: block.top,
          height: block.height,
          borderColor: isNext ? 'transparent' : rgbaFromHex(categoryColor, 0.35),
          borderLeftColor: isNext ? 'transparent' : categoryColor ?? p.line,
          borderLeftWidth: isNext ? 0 : 2,
          transform: [{ scale: pressed ? 0.96 : 1 }],
          opacity: isPast ? 0.78 : 1,
          shadowColor: isNext ? p.nowGlow : 'transparent',
          shadowOpacity: isNext ? 1 : 0,
          shadowRadius: isNext ? 10 : 0,
          elevation: isNext ? 4 : 0,
          backgroundColor: isNext ? 'transparent' : rgbaFromHex(categoryColor, p.dark ? 0.2 : 0.14),
        },
      ]}
    >
      {isNext ? (
        <LinearGradient
          colors={[`${p.accent}e0`, `${p.accent2}cc`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}
      {/* inset highlight — subtle 1px top sheen */}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderTopWidth: 1,
            borderTopColor: isNext ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.05)',
            borderRadius: 10,
          },
        ]}
      />
      <Text
        style={[
          styles.blockTitle,
          {
            color: textColor,
            fontFamily: isNext ? 'Fraunces-Medium' : 'Inter-Medium',
            fontStyle: isNext ? 'italic' : 'normal',
            fontSize: isNext ? 11 : 10,
            textDecorationLine: isPast ? 'line-through' : 'none',
            paddingVertical: thin ? 1 : 0,
          },
        ]}
        numberOfLines={titleLines}
      >
        {block.event.title}
      </Text>
      {!thin && block.event.location && !isNext ? (
        <Text
          style={[
            styles.blockMeta,
            { color: metaColor, opacity: 0.72 },
          ]}
          numberOfLines={1}
        >
          {block.event.location}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 32,
    paddingHorizontal: 22,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  headerText: { flex: 1, minWidth: 0 },
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
    lineHeight: 40,
    fontWeight: '400',
    fontStyle: 'italic',
    letterSpacing: -0.8,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    maxWidth: 156,
  },
  dayStrip: { flexDirection: 'row', borderBottomWidth: 1 },
  gutter: { width: 36, borderRightWidth: 1 },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    overflow: 'hidden',
  },
  dayName: { fontFamily: 'Inter-Medium', fontSize: 10, opacity: 0.6, fontWeight: '500' },
  dayNum: {
    marginTop: 1,
    fontFamily: 'Fraunces-Medium',
    fontSize: 15,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  gridScroll: { flex: 1 },
  gridInner: { position: 'relative', paddingTop: 10, flexDirection: 'row' },
  hourGutter: { width: 36, borderRightWidth: 1, position: 'relative' },
  hourText: {
    position: 'absolute',
    left: 0,
    right: 4,
    height: 14,
    textAlign: 'right',
    fontFamily: 'Inter-Medium',
    fontSize: 9,
    fontWeight: '500',
    paddingHorizontal: 4,
    fontVariant: ['tabular-nums'],
  },
  columns: { flex: 1, flexDirection: 'row', position: 'relative' },
  hourLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.7,
  },
  column: { flex: 1, position: 'relative' },
  block: {
    position: 'absolute',
    left: 2,
    right: 2,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
  },
  blockTitle: { lineHeight: 13, fontWeight: '500' },
  blockMeta: {
    marginTop: 2,
    fontFamily: 'Inter-Medium',
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '500',
  },
  nowLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    zIndex: 3,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  nowMoon: { position: 'absolute', left: -7, top: -6 },
  emptyPanel: {
    margin: 22,
    padding: 18,
    borderWidth: 1,
    borderRadius: 14,
  },
  emptyTitle: { fontFamily: 'Fraunces-Medium', fontSize: 20, fontStyle: 'italic' },
  emptyText: { marginTop: 4, fontFamily: 'Inter-Regular', fontSize: 12, lineHeight: 18 },
});
