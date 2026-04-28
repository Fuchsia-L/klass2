import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, Text, UIManager, View } from 'react-native';
import type { TimeSlotRating } from '../../../features/rating/types';
import { CATEGORIES, type CategoryKey, type ScheduleEvent } from '../../../features/schedule/types';
import type { TodoItem } from '../../../features/todo/types';
import { MinTrends } from '../../minimal/components/parts/MinTrends';
import type { MinimalPaletteColors } from '../../minimal/components/minimalTypes';
import type { StarlightPaletteColors } from './starlightTypes';
import { useNow } from '../../../shared/lib/useNow';
import {
  StarlightMoon,
  StarlightNowLine,
  StarlightTimelineRow,
  type StarlightTimelineEvent,
} from './parts';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type StarEvent = ScheduleEvent & { state: StarlightTimelineEvent['state'] };
export type StarRatingsByEventId = Record<string, TimeSlotRating | undefined>;

type Props = {
  p: StarlightPaletteColors;
  events: StarEvent[];
  todos: TodoItem[];
  ratings?: TimeSlotRating[];
  ratingsByEventId: StarRatingsByEventId;
  categoryByEventId: Record<string, CategoryKey>;
  semesterWeek: number | null;
  nudgeEvent: StarEvent | null;
  nudgeText: string;
  unratedCount: number;
  openTodos?: number;
  doneTodos?: number;
  onOpenEvent: (eventId: string) => void;
  onRate: (eventId: string) => void;
  onDismissNudge: () => void;
  onToggleTodo: (id: string) => void;
  onGoTodos: () => void;
};

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Hardcoded accent-ink for accent-filled pills when palette omits it.
const DARK_INK_ON_ACCENT = '#06060f';

function formatTime(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function todoDueLabel(todo: TodoItem): string {
  if (todo.type === 'daily') return '今日';
  if (todo.type === 'weekly') return '本周';
  return '长期';
}

function toTimelineEvent(event: StarEvent, categoryByEventId: Record<string, CategoryKey>): StarlightTimelineEvent {
  const category = categoryByEventId[event.id] ?? event.category;
  return {
    id: event.id,
    startLabel: formatTime(event.start_time),
    endLabel: formatTime(event.end_time),
    title: event.title,
    location: event.location,
    categoryLabel: CATEGORIES[category]?.label ?? CATEGORIES['其他'].label,
    state: event.state,
  };
}

export function StarHome({
  p,
  events,
  todos,
  ratings,
  ratingsByEventId,
  categoryByEventId,
  semesterWeek,
  nudgeEvent,
  nudgeText,
  unratedCount,
  openTodos,
  doneTodos,
  onOpenEvent,
  onRate,
  onDismissNudge,
  onToggleTodo,
  onGoTodos,
}: Props) {
  const [todoExpanded, setTodoExpanded] = React.useState(false);
  const nowMs = useNow();
  const now = new Date(nowMs);
  const openTodosList = todos.filter((todo) => !todo.is_completed);
  const doneTodosList = todos.filter((todo) => todo.is_completed);
  const nextIndex = events.findIndex((event) => event.state === 'next');
  const openTodosCount = openTodos ?? openTodosList.length;
  const doneTodosCount = doneTodos ?? doneTodosList.length;
  const trendsPalette: MinimalPaletteColors = {
    bg: p.bg,
    ink: p.ink,
    dim: p.dim,
    line: p.line,
    subtle: p.subtle,
    panel: p.panelSolid,
    accent: p.accent,
    nowLine: p.nowLine,
    sheetScrim: p.sheetScrim,
  };
  const accentInk = p.dark ? DARK_INK_ON_ACCENT : '#ffffff';

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTodoExpanded((value) => !value);
  };

  return (
    <View testID="starlight-home" style={[styles.container, { backgroundColor: 'transparent' }]}>
      <View style={styles.header}>
        <View style={styles.kickerRow}>
          <StarlightMoon p={p} size={10} phase={0.75} />
          <Text style={[styles.kicker, { color: p.subtle }]}>
            {WEEKDAYS[now.getDay()]} · {MONTHS[now.getMonth()]} {now.getDate()}
          </Text>
        </View>
        <Text style={[styles.title, { color: p.ink }]}>Tonight</Text>
        <View style={styles.metaLine}>
          <Text style={[styles.metaText, { color: p.subtle }]}>{events.length} 事件</Text>
          <Text style={[styles.metaDot, { color: p.subtle }]}>✦</Text>
          <Text style={[styles.metaText, { color: p.subtle }]}>第 {semesterWeek ?? '-'} 周</Text>
        </View>
      </View>

      <View style={styles.todoBlock}>
        <Pressable testID="starlight-home-todo-summary" onPress={toggleExpanded} style={[styles.todoHeader, { backgroundColor: p.panel, borderColor: p.line }]}>
          <BlurView
            intensity={24}
            tint={p.dark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <LinearGradient
            colors={p.dark ? ['rgba(255,255,255,0.055)', 'rgba(255,255,255,0.015)'] : ['rgba(255,255,255,0.65)', 'rgba(255,255,255,0.20)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View pointerEvents="none" style={[styles.todoGlint, { backgroundColor: p.dark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.78)' }]} />
          <Text style={[styles.todoLabel, { color: p.subtle }]}>Todos</Text>
          <View style={styles.todoSummary}>
            <Text style={[styles.todoOpen, { color: p.ink }]}>{openTodosCount}</Text>
            <Text style={[styles.todoSub, { color: p.subtle }]}>待办 · {doneTodosCount} 已完成</Text>
          </View>
          <Text style={[styles.chevron, { color: p.subtle, transform: [{ rotate: todoExpanded ? '90deg' : '0deg' }] }]}>
            ▸
          </Text>
        </Pressable>
        {todoExpanded ? (
          <View testID="starlight-home-todo-preview" style={styles.todoPreview}>
            {openTodosList.length > 0 ? (
              openTodosList.slice(0, 4).map((todo) => (
                <View key={todo.id} style={[styles.previewRow, { borderTopColor: p.line }]}>
                  <Pressable
                    testID={`starlight-home-todo-toggle-${todo.id}`}
                    onPress={() => onToggleTodo(todo.id)}
                    style={[styles.previewCheck, { borderColor: p.accent, shadowColor: p.accent }]}
                  />
                  <Text style={[styles.previewTitle, { color: p.ink }]} numberOfLines={1}>
                    {todo.title || '无标题'}
                  </Text>
                  <Text style={[styles.previewDue, { color: p.subtle }]}>{todoDueLabel(todo)}</Text>
                </View>
              ))
            ) : (
              <Text style={[styles.emptyText, { color: p.subtle }]}>No open todos tonight</Text>
            )}
            <Pressable testID="starlight-home-view-todos" onPress={onGoTodos} style={styles.viewAll}>
              <Text style={[styles.viewAllText, { color: p.subtle }]}>View all →</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {nudgeEvent ? (
        <View
          testID="starlight-rating-nudge"
          style={[
            styles.nudge,
            { borderColor: p.accent, shadowColor: p.accent },
          ]}
        >
          <BlurView
            intensity={24}
            tint={p.dark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <LinearGradient
            colors={[`${p.accent}22`, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={[styles.nudgeDot, { backgroundColor: p.accent, shadowColor: p.accent }]} />
          <View style={styles.nudgeBody}>
            <Text style={[styles.nudgeTitle, { color: p.ink }]} numberOfLines={1}>
              {nudgeEvent.title} · {nudgeText}
            </Text>
            <Text style={[styles.nudgeSub, { color: p.subtle }]}>Rate this event</Text>
          </View>
          <Pressable
            testID="starlight-rating-nudge-rate"
            onPress={() => onRate(nudgeEvent.id)}
            style={({ pressed }) => [
              styles.nudgeRate,
              {
                backgroundColor: p.accent,
                shadowColor: p.accent,
                opacity: pressed ? 0.88 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <Text style={[styles.nudgeRateText, { color: accentInk }]}>Rate</Text>
          </Pressable>
          <Pressable testID="starlight-rating-nudge-dismiss" onPress={onDismissNudge} style={styles.dismiss}>
            <Text style={[styles.dismissText, { color: p.subtle }]}>×</Text>
          </Pressable>
        </View>
      ) : null}

      {unratedCount > 0 ? (
        <Pressable
          testID="starlight-unrated-summary"
          onPress={() => {
            const first = events.find((event) => event.state === 'past' && !ratingsByEventId[event.id]);
            if (first) onRate(first.id);
          }}
          style={({ pressed }) => [
            styles.unrated,
            {
              borderColor: p.line,
              opacity: pressed ? 0.8 : 1,
              transform: [{ scale: pressed ? 0.99 : 1 }],
            },
          ]}
        >
          <Text style={[styles.unratedLabel, { color: p.subtle }]}>Unrated</Text>
          <Text style={[styles.unratedText, { color: p.ink }]}>{unratedCount} 件已结束事件待评价</Text>
          <Text style={[styles.unratedArrow, { color: p.subtle }]}>→</Text>
        </Pressable>
      ) : null}

      <ScrollView style={styles.timeline} contentContainerStyle={styles.timelineContent}>
        {events.length > 0 ? (
          events.map((event, index) => (
            <React.Fragment key={`${event.id}-${event.start_time}`}>
              {index === nextIndex ? (
                <StarlightNowLine
                  p={p}
                  time={formatTime(new Date(nowMs).toISOString())}
                  testID="starlight-home-now-line"
                />
              ) : null}
              <StarlightTimelineRow
                p={p}
                event={toTimelineEvent(event, categoryByEventId)}
                rating={
                  ratingsByEventId[event.id]
                    ? {
                        efficiency: ratingsByEventId[event.id]!.efficiency,
                        moodLabel: ratingsByEventId[event.id]!.mood,
                      }
                    : undefined
                }
                onOpen={() => onOpenEvent(event.id)}
                onRate={() => onRate(event.id)}
                testID={`starlight-event-${event.id}`}
              />
            </React.Fragment>
          ))
        ) : (
          <View style={[styles.emptyPanel, { borderColor: p.line }]}>
            <BlurView
              intensity={22}
              tint={p.dark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <LinearGradient
              colors={[`${p.accent}14`, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <Text style={[styles.emptyTitle, { color: p.ink }]}>Quiet sky</Text>
            <Text style={[styles.emptyText, { color: p.subtle }]}>No events are scheduled for today.</Text>
          </View>
        )}
        {ratings ? (
          <MinTrends p={trendsPalette} ratings={ratings} categoryByEventId={categoryByEventId} />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 32, paddingHorizontal: 22, paddingBottom: 18 },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kicker: { fontFamily: 'NotoSansSC-Medium', fontSize: 10, letterSpacing: 3, fontWeight: '500', textTransform: 'uppercase' },
  title: { marginTop: 8, fontFamily: 'NotoSerifSC-Regular', fontSize: 46, lineHeight: 48, fontWeight: '400', fontStyle: 'italic', letterSpacing: -1 },
  metaLine: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 10 },
  metaText: { fontFamily: 'NotoSansSC-Regular', fontSize: 12, letterSpacing: 0.4 },
  metaDot: { opacity: 0.4, fontSize: 12 },
  todoBlock: { paddingHorizontal: 22, paddingBottom: 8 },
  todoHeader: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderRadius: 14 },
  todoGlint: { position: 'absolute', top: 0, left: 16, right: 16, height: 1, opacity: 0.85 },
  todoLabel: { fontFamily: 'NotoSansSC-SemiBold', fontSize: 10, letterSpacing: 2, fontWeight: '600', textTransform: 'uppercase', marginRight: 10 },
  todoSummary: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  todoOpen: { fontFamily: 'NotoSerifSC-Medium', fontSize: 20, fontWeight: '500', fontVariant: ['tabular-nums'] },
  todoSub: { fontFamily: 'NotoSansSC-Regular', fontSize: 11 },
  chevron: { fontSize: 11 },
  todoPreview: { paddingHorizontal: 6, paddingTop: 8 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4, paddingVertical: 8, borderTopWidth: 0, borderStyle: 'dashed' },
  previewCheck: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, shadowOpacity: 0.45, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 2 },
  previewTitle: { flex: 1, fontFamily: 'NotoSansSC-Medium', fontSize: 13, fontWeight: '500' },
  previewDue: { fontFamily: 'NotoSansSC-Regular', fontSize: 10, letterSpacing: 0.5 },
  viewAll: { paddingHorizontal: 4, paddingTop: 8, paddingBottom: 0 },
  viewAllText: { fontFamily: 'NotoSansSC-SemiBold', fontSize: 10, letterSpacing: 2, fontWeight: '600', textTransform: 'uppercase' },
  nudge: { position: 'relative', marginHorizontal: 22, marginVertical: 8, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, overflow: 'hidden', shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 7 },
  nudgeDot: { width: 6, height: 6, borderRadius: 3, shadowOpacity: 1, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  nudgeBody: { flex: 1, minWidth: 0 },
  nudgeTitle: { fontFamily: 'NotoSansSC-Medium', fontSize: 12, fontWeight: '500' },
  nudgeSub: { fontFamily: 'NotoSansSC-SemiBold', fontSize: 9, letterSpacing: 1.6, marginTop: 2, textTransform: 'uppercase', fontWeight: '500' },
  nudgeRate: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, shadowOpacity: 0.6, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 5 },
  nudgeRateText: { fontFamily: 'NotoSansSC-SemiBold', fontSize: 10, letterSpacing: 2, fontWeight: '600', textTransform: 'uppercase' },
  dismiss: { paddingHorizontal: 4 },
  dismissText: { fontSize: 16 },
  unrated: { marginHorizontal: 22, marginTop: 4, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderStyle: 'dashed', borderRadius: 14 },
  unratedLabel: { fontFamily: 'NotoSansSC-SemiBold', fontSize: 10, letterSpacing: 2, fontWeight: '600', textTransform: 'uppercase' },
  unratedText: { flex: 1, fontFamily: 'NotoSansSC-Medium', fontSize: 12, fontWeight: '500' },
  unratedArrow: { fontSize: 12 },
  timeline: { flex: 1 },
  timelineContent: { paddingTop: 10, paddingBottom: 20 },
  emptyPanel: { marginHorizontal: 22, padding: 18, borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  emptyTitle: { fontFamily: 'NotoSerifSC-Medium', fontSize: 20, fontStyle: 'italic' },
  emptyText: { marginTop: 4, fontFamily: 'NotoSansSC-Regular', fontSize: 12, lineHeight: 18 },
});
