import React from 'react';
import { LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, Text, UIManager, View } from 'react-native';
import type { TimeSlotRating } from '../../../features/rating/types';
import type { CategoryKey } from '../../../features/schedule/types';
import type { TodoItem } from '../../../features/todo/types';
import type { MinimalEvent, MinimalPaletteColors, RatingsByEventId } from './minimalTypes';
import { formatTime } from './minimalTypes';
import { MinNowLine } from './parts/MinNowLine';
import { MinTimelineRow } from './parts/MinTimelineRow';
import { MinTrends } from './parts/MinTrends';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  p: MinimalPaletteColors;
  events: MinimalEvent[];
  todos: TodoItem[];
  ratings: TimeSlotRating[];
  ratingsByEventId: RatingsByEventId;
  categoryByEventId: Record<string, CategoryKey>;
  semesterWeek: number | null;
  nudgeEvent: MinimalEvent | null;
  nudgeText: string;
  unratedCount: number;
  onOpenEvent: (eventId: string) => void;
  onRate: (eventId: string) => void;
  onDismissNudge: () => void;
  onToggleTodo: (id: string) => void;
  onGoTodos: () => void;
};

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function MinHome({
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
  onOpenEvent,
  onRate,
  onDismissNudge,
  onToggleTodo,
  onGoTodos,
}: Props) {
  const [todoExpanded, setTodoExpanded] = React.useState(false);
  const now = new Date();
  const openTodos = todos.filter((todo) => !todo.is_completed);
  const doneTodos = todos.filter((todo) => todo.is_completed);
  const nextIndex = events.findIndex((event) => event.state === 'next');

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTodoExpanded((value) => !value);
  };

  return (
    <View style={[styles.container, { backgroundColor: p.bg }]}>
      <View style={[styles.header, { borderBottomColor: p.line }]}>
        <Text style={[styles.kicker, { color: p.subtle }]}>
          {WEEKDAYS[now.getDay()]} · {MONTHS[now.getMonth()]} {now.getDate()}
        </Text>
        <Text style={[styles.title, { color: p.ink }]}>Today</Text>
        <View style={styles.metaLine}>
          <Text style={[styles.metaText, { color: p.subtle }]}>{events.length} 事件</Text>
          <Text style={[styles.metaDot, { color: p.subtle }]}>·</Text>
          <Text style={[styles.metaText, { color: p.subtle }]}>第 {semesterWeek ?? '-'} 周</Text>
        </View>
      </View>

      <View style={[styles.todoBlock, { borderBottomColor: p.line }]}>
        <Pressable onPress={toggleExpanded} style={styles.todoHeader}>
          <Text style={[styles.todoLabel, { color: p.subtle }]}>Todos</Text>
          <View style={styles.todoSummary}>
            <Text style={[styles.todoOpen, { color: p.ink }]}>{openTodos.length}</Text>
            <Text style={[styles.todoSub, { color: p.subtle }]}>待办 · {doneTodos.length} 已完成</Text>
          </View>
          <Text style={[styles.chevron, { color: p.subtle, transform: [{ rotate: todoExpanded ? '90deg' : '0deg' }] }]}>
            ▸
          </Text>
        </Pressable>
        {todoExpanded ? (
          <View style={styles.todoPreview}>
            {openTodos.slice(0, 4).map((todo) => (
              <View key={todo.id} style={[styles.previewRow, { borderTopColor: p.line }]}>
                <Pressable onPress={() => onToggleTodo(todo.id)} style={[styles.previewCheck, { borderColor: p.ink }]} />
                <Text style={[styles.previewTitle, { color: p.ink }]} numberOfLines={1}>
                  {todo.title || '无标题'}
                </Text>
                <Text style={[styles.previewDue, { color: p.subtle }]}>{todo.type === 'daily' ? '今日' : todo.type === 'weekly' ? '本周' : '长期'}</Text>
              </View>
            ))}
            <Pressable onPress={onGoTodos} style={styles.viewAll}>
              <Text style={[styles.viewAllText, { color: p.subtle }]}>View all →</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {nudgeEvent ? (
        <View style={[styles.nudge, { borderBottomColor: p.line, backgroundColor: p.panel }]}>
          <View style={[styles.nudgeDot, { backgroundColor: p.ink }]} />
          <View style={styles.nudgeBody}>
            <Text style={[styles.nudgeTitle, { color: p.ink }]} numberOfLines={1}>
              {nudgeEvent.title} · {nudgeText}
            </Text>
            <Text style={[styles.nudgeSub, { color: p.subtle }]}>Rate this event</Text>
          </View>
          <Pressable onPress={() => onRate(nudgeEvent.id)} style={[styles.nudgeRate, { backgroundColor: p.ink }]}>
            <Text style={[styles.nudgeRateText, { color: p.bg }]}>Rate</Text>
          </Pressable>
          <Pressable onPress={onDismissNudge} style={styles.dismiss}>
            <Text style={[styles.dismissText, { color: p.subtle }]}>×</Text>
          </Pressable>
        </View>
      ) : null}

      {unratedCount > 0 ? (
        <Pressable
          onPress={() => {
            const first = events.find((event) => event.state === 'past' && !ratingsByEventId[event.id]);
            if (first) onRate(first.id);
          }}
          style={[styles.unrated, { borderBottomColor: p.line }]}
        >
          <Text style={[styles.unratedLabel, { color: p.subtle }]}>Unrated</Text>
          <Text style={[styles.unratedText, { color: p.ink }]}>{unratedCount} 件已结束事件待评价</Text>
          <Text style={[styles.unratedArrow, { color: p.subtle }]}>→</Text>
        </Pressable>
      ) : null}

      <ScrollView style={styles.timeline} contentContainerStyle={styles.timelineContent}>
        {events.map((event, index) => (
          <React.Fragment key={event.id}>
            {index === nextIndex ? <MinNowLine p={p} time={formatTime(new Date().toISOString())} /> : null}
            <MinTimelineRow
              event={event}
              p={p}
              rating={ratingsByEventId[event.id]}
              onOpen={() => onOpenEvent(event.id)}
              onRate={() => onRate(event.id)}
            />
          </React.Fragment>
        ))}
        <MinTrends p={p} ratings={ratings} categoryByEventId={categoryByEventId} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 34,
    fontWeight: '600',
    marginTop: 6,
  },
  metaLine: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  metaText: {
    fontSize: 12,
  },
  metaDot: {
    opacity: 0.4,
  },
  todoBlock: {
    borderBottomWidth: 1,
  },
  todoHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  todoLabel: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginRight: 10,
  },
  todoSummary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  todoOpen: {
    fontSize: 17,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  todoSub: {
    fontSize: 11,
  },
  chevron: {
    fontSize: 11,
  },
  todoPreview: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderStyle: 'dashed',
  },
  previewCheck: {
    width: 14,
    height: 14,
    borderWidth: 1,
  },
  previewTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  previewDue: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  viewAll: {
    paddingTop: 10,
    paddingBottom: 2,
  },
  viewAllText: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  nudge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
  },
  nudgeDot: {
    width: 6,
    height: 6,
  },
  nudgeBody: {
    flex: 1,
    minWidth: 0,
  },
  nudgeTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  nudgeSub: {
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  nudgeRate: {
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  nudgeRateText: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dismiss: {
    paddingHorizontal: 4,
  },
  dismissText: {
    fontSize: 16,
  },
  unrated: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
  },
  unratedLabel: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  unratedText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  unratedArrow: {
    fontSize: 12,
  },
  timeline: {
    flex: 1,
  },
  timelineContent: {
    paddingTop: 12,
    paddingBottom: 20,
  },
});
