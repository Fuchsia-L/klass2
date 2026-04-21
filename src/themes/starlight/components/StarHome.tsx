import React from 'react';
import { LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, Text, UIManager, View } from 'react-native';
import type { TimeSlotRating } from '../../../features/rating/types';
import { CATEGORIES, type CategoryKey, type ScheduleEvent } from '../../../features/schedule/types';
import type { TodoItem } from '../../../features/todo/types';
import type { StarlightPaletteColors } from './starlightTypes';
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
export type StarRatingsByEventId = Record<string, TimeSlotRating>;

type Props = {
  p: StarlightPaletteColors;
  events: StarEvent[];
  todos: TodoItem[];
  ratingsByEventId: StarRatingsByEventId;
  categoryByEventId: Record<string, CategoryKey>;
  semesterWeek: number | null;
  nudgeEvent: StarEvent | null;
  nudgeText: string;
  unratedCount: number;
  openTodos: number;
  doneTodos: number;
  onOpenEvent: (eventId: string) => void;
  onRate: (eventId: string) => void;
  onDismissNudge: () => void;
  onToggleTodo: (id: string) => void;
  onGoTodos: () => void;
};

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
  const now = new Date();
  const nextIndex = events.findIndex((event) => event.state === 'next');
  const openTodoPreview = todos.filter((todo) => !todo.is_completed).slice(0, 4);
  const firstUnrated = events.find((event) => event.state === 'past' && !ratingsByEventId[event.id]);

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTodoExpanded((value) => !value);
  };

  return (
    <View testID="starlight-home" style={styles.container}>
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

      <View style={styles.todoPad}>
        <Pressable
          testID="starlight-home-todo-summary"
          onPress={toggleExpanded}
          style={[styles.todoSummaryCard, { backgroundColor: p.panel, borderColor: p.line }]}
        >
          <Text style={[styles.todoLabel, { color: p.subtle }]}>Todos</Text>
          <View style={styles.todoSummaryText}>
            <Text style={[styles.todoOpen, { color: p.ink }]}>{openTodos}</Text>
            <Text style={[styles.todoSub, { color: p.subtle }]}>待办 · {doneTodos} 已完成</Text>
          </View>
          <Text style={[styles.chevron, { color: p.subtle, transform: [{ rotate: todoExpanded ? '90deg' : '0deg' }] }]}>▸</Text>
        </Pressable>
        {todoExpanded ? (
          <View testID="starlight-home-todo-preview" style={styles.todoPreview}>
            {openTodoPreview.length > 0 ? (
              openTodoPreview.map((todo) => (
                <View key={todo.id} style={styles.previewRow}>
                  <Pressable
                    testID={`starlight-home-todo-toggle-${todo.id}`}
                    onPress={() => onToggleTodo(todo.id)}
                    style={[styles.previewCheck, { borderColor: p.accent }]}
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
        <View testID="starlight-rating-nudge" style={[styles.nudge, { backgroundColor: p.panel, borderColor: p.accent }]}>
          <View style={[styles.nudgeDot, { backgroundColor: p.accent, shadowColor: p.accent }]} />
          <View style={styles.nudgeBody}>
            <Text style={[styles.nudgeTitle, { color: p.ink }]} numberOfLines={1}>
              {nudgeEvent.title} · {nudgeText}
            </Text>
            <Text style={[styles.nudgeSub, { color: p.subtle }]}>留下今晚的一点记录</Text>
          </View>
          <Pressable testID="starlight-rating-nudge-rate" onPress={() => onRate(nudgeEvent.id)} style={[styles.nudgeRate, { backgroundColor: p.accent }]}>
            <Text style={[styles.nudgeRateText, { color: p.dark ? p.bg : '#ffffff' }]}>Rate</Text>
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
            if (firstUnrated) onRate(firstUnrated.id);
          }}
          style={[styles.unrated, { borderColor: p.line }]}
        >
          <Text style={[styles.unratedLabel, { color: p.subtle }]}>Unrated</Text>
          <Text style={[styles.unratedText, { color: p.ink }]}>{unratedCount} 件已结束事件待评价</Text>
          <Text style={[styles.unratedArrow, { color: p.subtle }]}>→</Text>
        </Pressable>
      ) : null}

      <ScrollView style={styles.timeline} contentContainerStyle={styles.timelineContent}>
        {events.length > 0 ? (
          events.map((event, index) => {
            const rating = ratingsByEventId[event.id];
            return (
              <React.Fragment key={`${event.id}-${event.start_time}`}>
                {index === nextIndex ? <StarlightNowLine p={p} time={formatTime(new Date().toISOString())} testID="starlight-home-now-line" /> : null}
                <StarlightTimelineRow
                  p={p}
                  event={toTimelineEvent(event, categoryByEventId)}
                  rating={rating ? { efficiency: rating.efficiency, moodLabel: rating.mood } : undefined}
                  onOpen={() => onOpenEvent(event.id)}
                  onRate={() => onRate(event.id)}
                  testID={`starlight-event-${event.id}`}
                />
              </React.Fragment>
            );
          })
        ) : (
          <View style={[styles.emptyPanel, { borderColor: p.line, backgroundColor: p.panel }]}>
            <Text style={[styles.emptyTitle, { color: p.ink }]}>Quiet sky</Text>
            <Text style={[styles.emptyText, { color: p.subtle }]}>No events are scheduled for today.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, color: '#ffffff' },
  header: { paddingTop: 32, paddingHorizontal: 22, paddingBottom: 18 },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kicker: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 8,
    fontFamily: 'Fraunces-Regular',
    fontSize: 46,
    lineHeight: 48,
    fontWeight: '400',
    fontStyle: 'italic',
  },
  metaLine: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 10 },
  metaText: { fontFamily: 'Inter-Regular', fontSize: 12, letterSpacing: 0.4 },
  metaDot: { opacity: 0.4, fontSize: 12 },
  todoPad: { paddingHorizontal: 22, paddingBottom: 8 },
  todoSummaryCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
  },
  todoLabel: { marginRight: 10, fontSize: 10, letterSpacing: 2, fontWeight: '600', textTransform: 'uppercase' },
  todoSummaryText: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  todoOpen: { fontFamily: 'Fraunces-Medium', fontSize: 20, fontWeight: '500', fontVariant: ['tabular-nums'] },
  todoSub: { fontFamily: 'Inter-Regular', fontSize: 11 },
  chevron: { fontSize: 11 },
  todoPreview: { paddingTop: 8, paddingHorizontal: 6 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  previewCheck: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, flexShrink: 0 },
  previewTitle: { flex: 1, minWidth: 0, fontSize: 13, fontWeight: '500' },
  previewDue: { fontSize: 10, letterSpacing: 0.5, flexShrink: 0 },
  viewAll: { paddingTop: 8, paddingBottom: 2 },
  viewAllText: { fontSize: 10, letterSpacing: 2, fontWeight: '600', textTransform: 'uppercase' },
  nudge: {
    marginHorizontal: 22,
    marginVertical: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
  },
  nudgeDot: { width: 6, height: 6, borderRadius: 3, shadowOpacity: 1, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  nudgeBody: { flex: 1, minWidth: 0 },
  nudgeTitle: { fontSize: 12, fontWeight: '500' },
  nudgeSub: { marginTop: 2, fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase' },
  nudgeRate: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, flexShrink: 0 },
  nudgeRateText: { fontSize: 10, letterSpacing: 2, fontWeight: '600', textTransform: 'uppercase' },
  dismiss: { paddingHorizontal: 4, flexShrink: 0 },
  dismissText: { fontSize: 16 },
  unrated: {
    marginHorizontal: 22,
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
  },
  unratedLabel: { fontSize: 10, letterSpacing: 2, fontWeight: '600', textTransform: 'uppercase' },
  unratedText: { flex: 1, minWidth: 0, fontSize: 12, fontWeight: '500' },
  unratedArrow: { fontSize: 12 },
  timeline: { flex: 1 },
  timelineContent: { paddingTop: 10, paddingBottom: 24 },
  emptyPanel: { marginHorizontal: 22, padding: 18, borderWidth: 1, borderRadius: 14 },
  emptyTitle: { fontFamily: 'Fraunces-Medium', fontSize: 20 },
  emptyText: { fontSize: 12, lineHeight: 18 },
});
