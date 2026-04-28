import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { CATEGORIES, type CategoryKey, type ScheduleEvent } from '../../../features/schedule/types';
import type { StarlightPaletteColors } from './starlightTypes';
import {
  StarlightMoon,
  type StarlightTimelineEvent,
} from './parts';
import { useNowShimmer } from './parts/starlightMotion';
import { useNow } from '../../../shared/lib/useNow';

export type StarMatrixEvent = ScheduleEvent & { state: StarlightTimelineEvent['state'] };

// Web-only escape hatches (RN's StyleSheet types reject these but RN-Web passes them through to CSS).
// dayStrip mirrors the grid's scrollbar gutter so day columns and grid columns align horizontally.
const WEB_DAY_STRIP_STYLE: any = Platform.OS === 'web' ? { overflowY: 'auto', scrollbarGutter: 'stable' } : null;
const WEB_GRID_SCROLL_STYLE: any = Platform.OS === 'web' ? { scrollbarGutter: 'stable' } : null;

type Props = {
  p: StarlightPaletteColors;
  events: StarMatrixEvent[];
  weekStart: Date;
  semesterWeek: number | null;
  weekOffset: number;
  onOpenEvent: (eventId: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onResetWeek: () => void;
};

const DAYS = ['一', '二', '三', '四', '五', '六', '日'];
const HOURS = Array.from({ length: 19 }, (_, index) => 6 + index);
const HOUR_HEIGHT = 60;
const START_HOUR = 6;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DARK_INK_ON_ACCENT = '#06060f';

function eventTop(event: StarMatrixEvent): number {
  const start = new Date(event.start_time);
  return Math.max(0, (start.getHours() - START_HOUR) * HOUR_HEIGHT + (start.getMinutes() / 60) * HOUR_HEIGHT);
}

function eventHeight(event: StarMatrixEvent): number {
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);
  const minutes = Math.max(30, (end.getTime() - start.getTime()) / 60000);
  return (minutes / 60) * HOUR_HEIGHT;
}

function weekDayIndex(event: StarMatrixEvent, weekStart: Date): number {
  const start = new Date(event.start_time);
  const day = new Date(start);
  day.setHours(0, 0, 0, 0);
  return Math.floor((day.getTime() - weekStart.getTime()) / 86400000);
}

function rgbaFromHex(hex: string | undefined, alpha: number): string {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return `rgba(255,255,255,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function scrollMatrixToNow(scrollView: Pick<ScrollView, 'scrollTo'> | null, nowTop: number): void {
  scrollView?.scrollTo({ y: Math.max(0, nowTop - 100), animated: false });
}

export function isMatrixWeekSwipe(dx: number, dy: number): boolean {
  return Math.abs(dx) > 50 && Math.abs(dy) < 30;
}

export function triggerMatrixWeekSwipeNavigation(dx: number, dy: number, onPrevWeek: () => void, onNextWeek: () => void): boolean {
  if (!isMatrixWeekSwipe(dx, dy)) {
    return false;
  }

  if (dx < 0) {
    onNextWeek();
  } else {
    onPrevWeek();
  }

  return true;
}

export function StarMatrix({ p, events, weekStart, semesterWeek, weekOffset, onOpenEvent, onPrevWeek, onNextWeek, onResetWeek }: Props) {
  const shimmerStyle = useNowShimmer();
  const scrollRef = React.useRef<ScrollView>(null);
  const [layoutReady, setLayoutReady] = React.useState(false);
  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => isMatrixWeekSwipe(gestureState.dx, gestureState.dy),
        onMoveShouldSetPanResponderCapture: (_, gestureState) => isMatrixWeekSwipe(gestureState.dx, gestureState.dy),
        onPanResponderRelease: (_, gestureState) => {
          triggerMatrixWeekSwipeNavigation(gestureState.dx, gestureState.dy, onPrevWeek, onNextWeek);
        },
        onPanResponderTerminationRequest: () => true,
      }),
    [onNextWeek, onPrevWeek],
  );
  const nowMs = useNow();
  const now = new Date(nowMs);
  const todayIndex = Math.min(6, Math.max(0, Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - weekStart.getTime()) / 86400000)));
  const nowTop = Math.max(0, (now.getHours() - START_HOUR) * HOUR_HEIGHT + (now.getMinutes() / 60) * HOUR_HEIGHT);
  const showToday =
    new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() >= weekStart.getTime() &&
    new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() < weekStart.getTime() + 7 * 86400000;
  const nums = DAYS.map((_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date.getDate();
  });
  const weekEndLabel = new Date(weekStart);
  weekEndLabel.setDate(weekStart.getDate() + 6);
  const rangeLabel = `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()} – ${weekEndLabel.getDate()}`;
  const accentInk = p.dark ? DARK_INK_ON_ACCENT : '#ffffff';

  React.useEffect(() => {
    if (!layoutReady) return;
    scrollMatrixToNow(scrollRef.current, nowTop);
  }, [layoutReady, nowTop, events.length, weekStart.getTime()]);

  return (
    <View testID="starlight-matrix" style={[styles.container, { backgroundColor: 'transparent' }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={[styles.kicker, { color: p.subtle }]}>Week {semesterWeek ?? '-'} · {rangeLabel}</Text>
            <Text style={[styles.title, { color: p.ink }]}>Constellation</Text>
          </View>
          <View style={styles.nav}>
            {weekOffset !== 0 ? (
              <Pressable onPress={onResetWeek} testID="starlight-matrix-reset-week" style={styles.resetBtn}>
                <Text style={[styles.resetText, { color: p.subtle, borderColor: p.line }]}>← This week</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={onPrevWeek} testID="starlight-matrix-prev-week" style={[styles.navBtn, { borderColor: p.line }]}>
              <Text style={[styles.navChevron, { color: p.ink }]}>‹</Text>
            </Pressable>
            <Pressable onPress={onNextWeek} testID="starlight-matrix-next-week" style={[styles.navBtn, { borderColor: p.line }]}>
              <Text style={[styles.navChevron, { color: p.ink }]}>›</Text>
            </Pressable>
          </View>
        </View>
      </View>
      <View style={[styles.dayStrip, { borderBottomColor: p.line }, WEB_DAY_STRIP_STYLE]}>
        <View style={[styles.gutter, { borderRightColor: p.line }]} />
        {DAYS.map((day, index) => {
          const active = showToday && index === todayIndex;
          const textColor = active ? accentInk : p.ink;
          return (
            <View key={day} testID={`starlight-matrix-day-${index}`} style={[styles.dayCell, { borderRightColor: p.line, borderRightWidth: index < 6 ? 1 : 0, overflow: 'hidden' }]}>
              {active ? (
                <LinearGradient colors={[p.accent, p.accent2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
              ) : null}
              <Text style={[styles.dayName, { color: textColor }]}>{day}</Text>
              <Text style={[styles.dayNum, { color: textColor }]}>{nums[index]}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.matrixTouchArea} {...panResponder.panHandlers}>
        <ScrollView ref={scrollRef} testID="starlight-matrix-scroll" style={[styles.gridScroll, WEB_GRID_SCROLL_STYLE]} onLayout={() => setLayoutReady(true)}>
          <View style={[styles.gridInner, { height: HOUR_HEIGHT * HOURS.length + 10 }]}>
            <View style={[styles.hourGutter, { borderRightColor: p.line }]}>
              {HOURS.map((hour, index) => (
                <Text key={hour} style={[styles.hourText, { top: index * HOUR_HEIGHT - 7, color: p.subtle, backgroundColor: p.bg }]}>
                  {String(hour).padStart(2, '0')}
                </Text>
              ))}
            </View>
            <View style={styles.columns}>
              {HOURS.map((_, index) => (
                <View key={index} pointerEvents="none" style={[styles.hourLine, { top: index * HOUR_HEIGHT, borderTopColor: p.line, opacity: 0.7 }]} />
              ))}
              {DAYS.map((day, index) => (
                <View key={day} style={[styles.column, { borderRightColor: p.line, borderRightWidth: index < 6 ? 1 : 0 }]}>
                  {events.filter((event) => weekDayIndex(event, weekStart) === index).map((event) => (
                    <MatrixBlock
                      key={`${event.id}-${event.start_time}`}
                      p={p}
                      event={event}
                      hero={event.state === 'now' || event.state === 'next'}
                      onPress={() => onOpenEvent(event.id)}
                    />
                  ))}
                </View>
              ))}
              {showToday ? (
                <Animated.View pointerEvents="none" testID="starlight-matrix-now-marker" style={[styles.nowLine, { top: nowTop, shadowColor: p.nowGlow }, shimmerStyle]}>
                  <LinearGradient colors={['transparent', p.nowLine, `${p.nowLine}66`, 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
                  <View style={styles.nowMoon}><StarlightMoon p={p} size={12} phase={0.75} /></View>
                </Animated.View>
              ) : null}
            </View>
          </View>
          {events.length === 0 ? (
            <View style={[styles.emptyPanel, { borderColor: p.line, backgroundColor: p.panel }]}>
              <Text style={[styles.emptyTitle, { color: p.ink }]}>No constellations</Text>
              <Text style={[styles.emptyText, { color: p.subtle }]}>This selected week has no scheduled events.</Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}

function MatrixBlock({ p, event, hero, onPress }: { p: StarlightPaletteColors; event: StarMatrixEvent; hero: boolean; onPress: () => void }) {
  const height = eventHeight(event);
  const isPast = event.state === 'past';
  const titleMaxLines = Math.max(1, Math.floor((height - 10) / 13));
  const showLocation = !!event.location && height >= 38;
  const categoryColor = CATEGORIES[event.category]?.color;
  const accentInk = p.dark ? '#06060f' : '#ffffff';
  const textColor = hero ? accentInk : isPast ? p.dim : p.ink;
  const metaColor = hero ? accentInk : p.subtle;

  return (
    <Pressable
      testID={`starlight-matrix-event-${event.id}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.block,
        {
          top: eventTop(event),
          height,
          borderColor: hero ? 'transparent' : rgbaFromHex(categoryColor, 0.35),
          borderLeftColor: hero ? 'transparent' : categoryColor ?? p.line,
          borderLeftWidth: hero ? 0 : 2,
          backgroundColor: hero ? 'transparent' : rgbaFromHex(categoryColor, p.dark ? 0.2 : 0.14),
          transform: [{ scale: pressed ? 0.96 : 1 }],
          opacity: isPast ? 0.78 : 1,
          shadowColor: hero ? p.nowGlow : 'transparent',
          shadowOpacity: hero ? 1 : 0,
          shadowRadius: hero ? 10 : 0,
          elevation: hero ? 5 : 0,
        },
      ]}
    >
      {hero ? (
        <LinearGradient colors={[`${p.accent}e0`, `${p.accent2}cc`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
      ) : null}
      <View pointerEvents="none" style={[styles.blockHairline, { backgroundColor: hero ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)' }]} />
      <Text
        style={[styles.blockText, { color: textColor, fontFamily: hero ? 'NotoSerifSC-Medium' : 'NotoSansSC-Medium', fontStyle: hero ? 'italic' : 'normal', textDecorationLine: isPast ? 'line-through' : 'none' }]}
        numberOfLines={titleMaxLines}
        ellipsizeMode="tail"
      >
        {event.title}
      </Text>
      {showLocation ? (
        <Text style={[styles.blockLoc, { color: metaColor, opacity: hero ? 0.85 : 0.72 }]} numberOfLines={1} ellipsizeMode="tail">
          {event.location}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 32, paddingHorizontal: 22, paddingBottom: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  headerText: { flex: 1, minWidth: 0 },
  nav: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 2 },
  navBtn: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderRadius: 999 },
  navChevron: { fontFamily: 'NotoSerifSC-Regular', fontSize: 22, lineHeight: 24, fontWeight: '400' },
  resetBtn: { marginRight: 4 },
  resetText: { fontFamily: 'NotoSansSC-SemiBold', fontSize: 10, letterSpacing: 1.8, fontWeight: '600', textTransform: 'uppercase', borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  kicker: { fontFamily: 'NotoSansSC-Medium', fontSize: 10, letterSpacing: 3, fontWeight: '500', textTransform: 'uppercase' },
  title: { marginTop: 6, fontFamily: 'NotoSerifSC-Regular', fontSize: 36, lineHeight: 40, fontWeight: '400', fontStyle: 'italic', letterSpacing: -0.8 },
  dayStrip: { flexDirection: 'row', borderBottomWidth: 1 },
  gutter: { width: 36, borderRightWidth: 1 },
  dayCell: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  dayName: { fontFamily: 'NotoSansSC-Medium', fontSize: 10, opacity: 0.6, fontWeight: '500' },
  dayNum: { marginTop: 2, fontFamily: 'NotoSerifSC-Medium', fontSize: 15, fontWeight: '500', fontVariant: ['tabular-nums'] },
  matrixTouchArea: { flex: 1 },
  gridScroll: { flex: 1 },
  gridInner: { position: 'relative', paddingTop: 10, flexDirection: 'row' },
  hourGutter: { width: 36, borderRightWidth: 1, position: 'relative' },
  hourText: { position: 'absolute', left: 0, right: 4, height: 14, textAlign: 'right', fontFamily: 'NotoSansSC-Medium', fontSize: 9, fontWeight: '500', paddingHorizontal: 4, fontVariant: ['tabular-nums'] },
  columns: { flex: 1, flexDirection: 'row', position: 'relative' },
  hourLine: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1, borderStyle: 'dashed' },
  column: { flex: 1, position: 'relative' },
  block: { position: 'absolute', left: 2, right: 2, borderWidth: 1, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 5, overflow: 'hidden', shadowOffset: { width: 0, height: 0 } },
  blockText: { fontSize: 10, fontWeight: '500', lineHeight: 13 },
  blockLoc: { fontFamily: 'NotoSansSC-Medium', fontSize: 9, fontWeight: '500', marginTop: 2, fontStyle: 'italic' },
  blockHairline: { position: 'absolute', left: 0, right: 0, top: 0, height: 1 },
  nowLine: { position: 'absolute', left: 0, right: 0, height: 1, zIndex: 3, shadowOpacity: 0.9, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  nowMoon: { position: 'absolute', left: -7, top: -6 },
  emptyPanel: { margin: 22, padding: 18, borderWidth: 1, borderRadius: 14 },
  emptyTitle: { fontFamily: 'NotoSerifSC-Medium', fontSize: 20, fontStyle: 'italic' },
  emptyText: { marginTop: 4, fontFamily: 'NotoSansSC-Regular', fontSize: 12, lineHeight: 18 },
});
