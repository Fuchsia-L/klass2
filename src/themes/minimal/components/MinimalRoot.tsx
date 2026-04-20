import React from 'react';
import { Alert, Animated, StyleSheet, View } from 'react-native';
import { useTheme, useThemeSettings } from '../../../theme/ThemeContext';
import { useEvents, useSemesterConfig } from '../../../features/schedule';
import { expandRepeatingEvents } from '../../../features/schedule/domain/repeat';
import { useRatings } from '../../../features/rating';
import { useTodos } from '../../../features/todo';
import { addTodo, deleteTodo, loadTodos, toggleTodoComplete, updateTodo } from '../../../features/todo/services/todo.service';
import type { TodoItem } from '../../../features/todo/types';
import { getSemesterWeek, getWeekStart } from '../../../features/schedule/domain/calendar';
import type { RouteName } from '../../types';
import { minimalPackage } from '../package';
import { MinEventSheet } from './MinEventSheet';
import { MinHome } from './MinHome';
import { MinMatrix } from './MinMatrix';
import { MinRatingSheet } from './MinRatingSheet';
import { MinSettings } from './MinSettings';
import { MinTodos } from './MinTodos';
import {
  MINIMAL_COLORS_BY_ID,
  MOOD_LABELS,
  MinimalEvent,
  MinimalTab,
  RatingsByEventId,
} from './minimalTypes';
import { MinTabBar } from './parts/MinTabBar';

function routeToTab(route: RouteName): MinimalTab {
  if (route === 'matrix') return 'week';
  if (route === 'settings') return 'settings';
  if (route === 'todos') return 'todos';
  return 'today';
}

function sameDay(event: Pick<MinimalEvent, 'start_time' | 'end_time'>, dayStart: Date, nextDayStart: Date): boolean {
  const start = new Date(event.start_time).getTime();
  const end = new Date(event.end_time).getTime();
  return start < nextDayStart.getTime() && end > dayStart.getTime();
}

function withState(events: MinimalEvent[], nowMs: number): MinimalEvent[] {
  const upcoming = events.find((event) => new Date(event.end_time).getTime() >= nowMs);
  return events.map((event) => {
    if (new Date(event.end_time).getTime() < nowMs) return { ...event, state: 'past' };
    if (upcoming?.id === event.id && upcoming.start_time === event.start_time) return { ...event, state: 'next' };
    return { ...event, state: 'upcoming' };
  });
}

function latestRatingsByEventId(ratings: ReturnType<typeof useRatings>['ratings']): RatingsByEventId {
  return ratings.reduce<RatingsByEventId>((acc, rating) => {
    if (!rating.linked_event_id) return acc;
    const current = acc[rating.linked_event_id];
    if (!current || new Date(rating.updated_at).getTime() > new Date(current.updated_at).getTime()) {
      acc[rating.linked_event_id] = rating;
    }
    return acc;
  }, {});
}

function nudgeCopy(event: MinimalEvent | null): string {
  if (!event) return '';
  const diffMin = Math.max(0, Math.floor((Date.now() - new Date(event.end_time).getTime()) / 60000));
  if (diffMin === 0) return '刚结束';
  if (diffMin < 60) return `刚结束 ${diffMin} 分钟`;
  return `结束 ${Math.floor(diffMin / 60)} 小时前`;
}

function newestTodoId(todos: TodoItem[]): string | null {
  const sorted = [...todos].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return sorted[0]?.id ?? null;
}

export function MinimalRoot({ route }: { route: RouteName }) {
  const theme = useTheme();
  const { themeName } = useThemeSettings();
  const p = MINIMAL_COLORS_BY_ID[theme.id] ?? MINIMAL_COLORS_BY_ID[themeName] ?? MINIMAL_COLORS_BY_ID['minimal-paper'];
  const [tab, setTab] = React.useState<MinimalTab>(() => routeToTab(route));
  const [eventSheetId, setEventSheetId] = React.useState<string | 'new' | null>(null);
  const [ratingTargetId, setRatingTargetId] = React.useState<string | null>(null);
  const [dismissedNudgeId, setDismissedNudgeId] = React.useState<string | null>(null);
  const [editingTodoId, setEditingTodoId] = React.useState<string | null>(null);
  const { events } = useEvents();
  const { todos } = useTodos();
  const ratingsApi = useRatings();
  const { semester } = useSemesterConfig();

  React.useEffect(() => {
    setTab(routeToTab(route));
  }, [route]);

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const weekStart = getWeekStart(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const expandedWeekEvents = React.useMemo(
    () => expandRepeatingEvents(events, weekStart, weekEnd).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()) as MinimalEvent[],
    [events, weekStart.toDateString()],
  );

  const todayEvents = React.useMemo(
    () =>
      withState(
        expandedWeekEvents.filter((event) => sameDay(event, todayStart, tomorrowStart)),
        now.getTime(),
      ),
    [expandedWeekEvents, todayStart.toDateString(), now.getTime()],
  );

  const matrixEvents = React.useMemo(() => withState(expandedWeekEvents, now.getTime()), [expandedWeekEvents, now.getTime()]);
  const ratingsByEventId = React.useMemo(() => latestRatingsByEventId(ratingsApi.ratings), [ratingsApi.ratings]);
  const semesterWeek = semester ? getSemesterWeek(semester.start_date, now) : null;

  const pastUnratedToday = React.useMemo(
    () =>
      todayEvents
        .filter((event) => {
          const end = new Date(event.end_time).getTime();
          return end < Date.now() && end >= todayStart.getTime() && end < tomorrowStart.getTime();
        })
        .filter((event) => !ratingsByEventId[event.id])
        .sort((a, b) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime()),
    [todayEvents, ratingsByEventId, todayStart.getTime(), tomorrowStart.getTime()],
  );
  const nudgeEvent = pastUnratedToday[0] && pastUnratedToday[0].id !== dismissedNudgeId ? pastUnratedToday[0] : null;
  const selectedEvent = eventSheetId && eventSheetId !== 'new' ? matrixEvents.find((event) => event.id === eventSheetId) ?? null : null;
  const ratingTarget = ratingTargetId ? matrixEvents.find((event) => event.id === ratingTargetId) ?? null : null;
  const existingRating = ratingTargetId ? ratingsByEventId[ratingTargetId] : undefined;

  const handleSaveRating = async ({ efficiency, moodIndex, reflection }: { efficiency: 1 | 2 | 3 | 4 | 5; moodIndex: 1 | 2 | 3 | 4 | 5; reflection: string }) => {
    if (!ratingTarget) return;
    try {
      await ratingsApi.save(
        {
          slot_start: ratingTarget.start_time,
          slot_end: ratingTarget.end_time,
          linked_event_id: ratingTarget.id,
          efficiency,
          rating: efficiency,
          mood: MOOD_LABELS[moodIndex - 1],
          reflection,
        },
        existingRating?.id,
      );
      setRatingTargetId(null);
      setDismissedNudgeId(ratingTarget.id);
    } catch (error) {
      Alert.alert('保存评分失败', error instanceof Error ? error.message : '请稍后重试。');
    }
  };

  const handleAddTodo = async () => {
    await addTodo({ title: '', type: 'daily', priority: 'medium' });
    const nextTodos = await loadTodos();
    setEditingTodoId(newestTodoId(nextTodos));
    setTab('todos');
  };

  const handleUpdateTodo = async (todo: TodoItem, patch: Partial<Pick<TodoItem, 'title' | 'notes'>>) => {
    await updateTodo(todo.id, {
      title: patch.title ?? todo.title,
      type: todo.type,
      priority: todo.priority,
      notes: patch.notes ?? todo.notes,
    });
  };

  const screens: Array<{ key: MinimalTab; element: React.ReactNode }> = [
    {
      key: 'today',
      element: (
        <MinHome
          p={p}
          events={todayEvents}
          todos={todos}
          ratingsByEventId={ratingsByEventId}
          semesterWeek={semesterWeek}
          nudgeEvent={nudgeEvent}
          nudgeText={nudgeCopy(nudgeEvent)}
          unratedCount={pastUnratedToday.length}
          onOpenEvent={setEventSheetId}
          onRate={setRatingTargetId}
          onDismissNudge={() => setDismissedNudgeId(nudgeEvent?.id ?? null)}
          onToggleTodo={(id) => void toggleTodoComplete(id)}
          onGoTodos={() => setTab('todos')}
        />
      ),
    },
    { key: 'week', element: <MinMatrix p={p} events={matrixEvents} weekStart={weekStart} semesterWeek={semesterWeek} onOpenEvent={setEventSheetId} /> },
    {
      key: 'todos',
      element: (
        <MinTodos
          p={p}
          todos={todos}
          editingId={editingTodoId}
          setEditingId={setEditingTodoId}
          onToggle={(id) => void toggleTodoComplete(id)}
          onUpdate={(todo, patch) => void handleUpdateTodo(todo, patch)}
          onDelete={(id) => void deleteTodo(id)}
        />
      ),
    },
    { key: 'settings', element: <MinSettings p={p} paletteId={theme.id} palettes={minimalPackage.palettes} /> },
  ];

  return (
    <View style={[styles.container, { backgroundColor: p.bg }]}>
      <View style={styles.stack}>
        {screens.map((screen) => (
          <Screen key={screen.key} active={tab === screen.key}>
            {screen.element}
          </Screen>
        ))}
      </View>
      <MinTabBar p={p} tab={tab} setTab={setTab} onAdd={() => (tab === 'todos' ? void handleAddTodo() : setEventSheetId('new'))} />
      <MinEventSheet p={p} event={selectedEvent} isNew={eventSheetId === 'new'} onClose={() => setEventSheetId(null)} />
      <MinRatingSheet p={p} event={ratingTarget} existing={existingRating} onClose={() => setRatingTargetId(null)} onSave={(payload) => void handleSaveRating(payload)} />
    </View>
  );
}

function Screen({ active, children }: { active: boolean; children: React.ReactNode }) {
  const opacity = React.useRef(new Animated.Value(active ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: active ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [active, opacity]);

  return (
    <Animated.View pointerEvents={active ? 'auto' : 'none'} style={[styles.screen, { opacity }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative', overflow: 'hidden' },
  stack: { flex: 1, position: 'relative', overflow: 'hidden' },
  screen: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
});
