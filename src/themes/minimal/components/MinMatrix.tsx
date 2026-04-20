import React from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { MinimalEvent, MinimalPaletteColors } from './minimalTypes';
import { usePulse } from './parts/usePulse';

// Web-only escape hatches (RN's StyleSheet types reject these but RN-Web passes them through to CSS).
// dayStrip mirrors the grid's scrollbar gutter so day columns and grid columns align horizontally.
const WEB_DAY_STRIP_STYLE: any = Platform.OS === 'web' ? { overflowY: 'auto', scrollbarGutter: 'stable' } : null;
const WEB_GRID_SCROLL_STYLE: any = Platform.OS === 'web' ? { scrollbarGutter: 'stable' } : null;

type Props = {
  p: MinimalPaletteColors;
  events: MinimalEvent[];
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

function eventTop(event: MinimalEvent): number {
  const start = new Date(event.start_time);
  return Math.max(0, (start.getHours() - START_HOUR) * HOUR_HEIGHT + (start.getMinutes() / 60) * HOUR_HEIGHT);
}

function eventHeight(event: MinimalEvent): number {
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);
  const minutes = Math.max(30, (end.getTime() - start.getTime()) / 60000);
  return (minutes / 60) * HOUR_HEIGHT;
}

function weekDayIndex(event: MinimalEvent, weekStart: Date): number {
  const start = new Date(event.start_time);
  const day = new Date(start);
  day.setHours(0, 0, 0, 0);
  return Math.floor((day.getTime() - weekStart.getTime()) / 86400000);
}

export function scrollMatrixToNow(scrollView: Pick<ScrollView, 'scrollTo'> | null, nowTop: number): void {
  scrollView?.scrollTo({ y: Math.max(0, nowTop - 100), animated: false });
}

export function MinMatrix({ p, events, weekStart, semesterWeek, weekOffset, onOpenEvent, onPrevWeek, onNextWeek, onResetWeek }: Props) {
  const opacity = usePulse();
  const scrollRef = React.useRef<ScrollView>(null);
  const [layoutReady, setLayoutReady] = React.useState(false);
  const now = new Date();
  const todayIndex = Math.min(6, Math.max(0, Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - weekStart.getTime()) / 86400000)));
  const nowTop = Math.max(0, (now.getHours() - START_HOUR) * HOUR_HEIGHT + (now.getMinutes() / 60) * HOUR_HEIGHT);
  const nums = DAYS.map((_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date.getDate();
  });
  const weekEndLabel = new Date(weekStart);
  weekEndLabel.setDate(weekStart.getDate() + 6);
  const rangeLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()} – ${weekEndLabel.getMonth() + 1}/${weekEndLabel.getDate()}`;

  React.useEffect(() => {
    if (!layoutReady) return;
    scrollMatrixToNow(scrollRef.current, nowTop);
  }, [layoutReady, nowTop, events.length, weekStart.getTime()]);

  return (
    <View style={[styles.container, { backgroundColor: p.bg }]}>
      <View style={[styles.header, { borderBottomColor: p.line }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={[styles.kicker, { color: p.subtle }]}>Week {semesterWeek ?? '-'} · {rangeLabel}</Text>
            <Text style={[styles.title, { color: p.ink }]}>Matrix</Text>
          </View>
          <View style={styles.nav}>
            <Pressable onPress={onPrevWeek} testID="min-matrix-prev-week" style={styles.navBtn}>
              <Text style={[styles.navChevron, { color: p.ink }]}>‹</Text>
            </Pressable>
            <Pressable onPress={onNextWeek} testID="min-matrix-next-week" style={styles.navBtn}>
              <Text style={[styles.navChevron, { color: p.ink }]}>›</Text>
            </Pressable>
          </View>
        </View>
        {weekOffset !== 0 ? (
          <Pressable onPress={onResetWeek} testID="min-matrix-reset-week" style={styles.resetBtn}>
            <Text style={[styles.resetText, { color: p.subtle, borderColor: p.line }]}>← This week</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={[styles.dayStrip, { borderBottomColor: p.line }, WEB_DAY_STRIP_STYLE]}>
        <View style={[styles.gutter, { borderRightColor: p.line }]} />
        {DAYS.map((day, index) => (
          <View
            key={day}
            style={[
              styles.dayCell,
              {
                backgroundColor: index === todayIndex ? p.ink : 'transparent',
                borderRightColor: p.line,
                borderRightWidth: index < 6 ? 1 : 0,
              },
            ]}
          >
            <Text style={[styles.dayName, { color: index === todayIndex ? p.bg : p.ink }]}>{day}</Text>
            <Text style={[styles.dayNum, { color: index === todayIndex ? p.bg : p.ink }]}>{nums[index]}</Text>
          </View>
        ))}
      </View>
      <ScrollView ref={scrollRef} testID="min-matrix-scroll" style={[styles.gridScroll, WEB_GRID_SCROLL_STYLE]} onLayout={() => setLayoutReady(true)}>
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
              <View key={index} pointerEvents="none" style={[styles.hourLine, { top: index * HOUR_HEIGHT, borderTopColor: p.line, opacity: index === 0 ? 0.9 : 0.6 }]} />
            ))}
            {DAYS.map((day, index) => (
              <View key={day} style={[styles.column, { borderRightColor: p.line, borderRightWidth: index < 6 ? 1 : 0 }]}>
                {events.filter((event) => weekDayIndex(event, weekStart) === index).map((event) => (
                  <MatrixBlock key={event.id} p={p} event={event} hero={event.state === 'now'} onPress={() => onOpenEvent(event.id)} />
                ))}
              </View>
            ))}
            <Animated.View pointerEvents="none" style={[styles.nowLine, { top: nowTop, backgroundColor: p.nowLine, opacity }]}>
              <View style={[styles.nowDot, { backgroundColor: p.nowLine }]} />
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function MatrixBlock({ p, event, hero, onPress }: { p: MinimalPaletteColors; event: MinimalEvent; hero: boolean; onPress: () => void }) {
  const height = eventHeight(event);
  // Heuristic: each title line ≈ 13px (lineHeight 13). Block needs ~26px (one title line + padding)
  // before location can fit underneath at 9px line + 2px gap = ~37px gap budget.
  const titleMaxLines = Math.max(1, Math.floor((height - 10) / 13));
  const showLocation = !!event.location && height >= 38;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.block,
        {
          top: eventTop(event),
          height,
          backgroundColor: hero ? p.ink : p.panel,
          borderColor: hero ? 'transparent' : p.line,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}
    >
      <Text
        style={[styles.blockText, { color: hero ? p.bg : p.ink }]}
        numberOfLines={titleMaxLines}
        ellipsizeMode="tail"
      >
        {event.title}
      </Text>
      {showLocation ? (
        <Text
          style={[styles.blockLoc, { color: hero ? p.bg : p.subtle, opacity: hero ? 0.7 : 1 }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {event.location}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 24, paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  headerText: { flex: 1, minWidth: 0 },
  nav: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingBottom: 2 },
  navBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  navChevron: { fontSize: 24, lineHeight: 24, fontWeight: '400' },
  resetBtn: { marginTop: 10, alignSelf: 'flex-start' },
  resetText: { fontSize: 10, letterSpacing: 1.8, fontWeight: '700', textTransform: 'uppercase', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  kicker: { fontSize: 10, letterSpacing: 2, fontWeight: '600', textTransform: 'uppercase' },
  title: { fontSize: 28, fontWeight: '600', marginTop: 6 },
  dayStrip: { flexDirection: 'row', borderBottomWidth: 1 },
  gutter: { width: 36, borderRightWidth: 1 },
  dayCell: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  dayName: { fontSize: 10, opacity: 0.6, fontWeight: '500' },
  dayNum: { fontSize: 14, fontWeight: '600', marginTop: 2, fontVariant: ['tabular-nums'] },
  gridScroll: { flex: 1 },
  gridInner: { position: 'relative', paddingTop: 10, flexDirection: 'row' },
  hourGutter: { width: 36, borderRightWidth: 1, position: 'relative' },
  hourText: { position: 'absolute', left: 0, right: 4, height: 14, textAlign: 'right', fontSize: 9, fontWeight: '500', paddingHorizontal: 4, fontVariant: ['tabular-nums'] },
  columns: { flex: 1, flexDirection: 'row', position: 'relative' },
  hourLine: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1, borderStyle: 'dashed' },
  column: { flex: 1, position: 'relative' },
  block: { position: 'absolute', left: 2, right: 2, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 5, overflow: 'hidden' },
  blockText: { fontSize: 10, fontWeight: '600', lineHeight: 13 },
  blockLoc: { fontSize: 9, fontWeight: '500', marginTop: 2, fontStyle: 'italic' },
  nowLine: { position: 'absolute', left: 0, right: 0, height: 1, zIndex: 3 },
  nowDot: { position: 'absolute', left: -4, top: -3, width: 7, height: 7 },
});
