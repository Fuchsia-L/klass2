import React from 'react';
import { Alert, Animated, StyleSheet, View } from 'react-native';
import { useTheme, useThemeSettings } from '../../../theme/ThemeContext';
import { useEvents, useSemesterConfig } from '../../../features/schedule';
import { type CategoryKey, type ScheduleEvent } from '../../../features/schedule/types';
import { expandRepeatingEvents } from '../../../features/schedule/domain/repeat';
import { getSemesterWeek, getWeekStart } from '../../../features/schedule/domain/calendar';
import { useRatings } from '../../../features/rating';
import type { TimeSlotRating } from '../../../features/rating/types';
import { useTodos } from '../../../features/todo';
import { toggleTodoComplete } from '../../../features/todo/services/todo.service';
import type { TodoItem } from '../../../features/todo/types';
import type { RouteName, ThemePalette } from '../../types';
import { starlightNebulaPalette, STARLIGHT_NEBULA_COLORS } from '../palettes/nebula';
import type { StarlightPaletteColors } from './starlightTypes';
import {
  StarlightBackground,
  StarlightTabBar,
  type StarlightTab,
  type StarlightTimelineEvent,
} from './parts';
import { StarHome } from './StarHome';
import { StarMatrix } from './StarMatrix';
import { StarEventSheet } from './StarEventSheet';
import { StarRatingSheet, STARLIGHT_MOOD_LABELS, type StarRatingSavePayload } from './StarRatingSheet';
import { StarSettings } from './StarSettings';
import { StarTodoSheet } from './StarTodoSheet';
import { StarTodos } from './StarTodos';

type StarlightEvent = ScheduleEvent & { state: StarlightTimelineEvent['state'] };

type RatingsByEventId = Record<string, TimeSlotRating>;

type TodoSheetState =
  | { mode: 'create' }
  | { mode: 'edit'; todo: TodoItem }
  | null;

const STARLIGHT_PALETTES: ThemePalette[] = [starlightNebulaPalette];
const STARLIGHT_COLORS_BY_ID: Record<string, StarlightPaletteColors> = {
  [starlightNebulaPalette.id]: STARLIGHT_NEBULA_COLORS,
};

function routeToTab(route: RouteName): StarlightTab {
  if (route === 'matrix') return 'week';
  if (route === 'settings') return 'settings';
  if (route === 'todos') return 'todos';
  return 'today';
}

function sameDay(event: Pick<ScheduleEvent, 'start_time' | 'end_time'>, dayStart: Date, nextDayStart: Date): boolean {
  const start = new Date(event.start_time).getTime();
  const end = new Date(event.end_time).getTime();
  return start < nextDayStart.getTime() && end > dayStart.getTime();
}

function withState(events: ScheduleEvent[], nowMs: number): StarlightEvent[] {
  const upcoming = events.find((event) => new Date(event.start_time).getTime() > nowMs);
  return events.map((event) => {
    const start = new Date(event.start_time).getTime();
    const end = new Date(event.end_time).getTime();
    if (end < nowMs) return { ...event, state: 'past' };
    if (start <= nowMs && nowMs < end) return { ...event, state: 'now' };
    if (upcoming?.id === event.id && upcoming.start_time === event.start_time) return { ...event, state: 'next' };
    return { ...event, state: 'upcoming' };
  });
}

function latestRatingsByEventId(ratings: TimeSlotRating[]): RatingsByEventId {
  return ratings.reduce<RatingsByEventId>((acc, rating) => {
    if (!rating.linked_event_id) return acc;
    const current = acc[rating.linked_event_id];
    if (!current || new Date(rating.updated_at).getTime() > new Date(current.updated_at).getTime()) {
      acc[rating.linked_event_id] = rating;
    }
    return acc;
  }, {});
}

function nudgeCopy(event: StarlightEvent | null): string {
  if (!event) return '';
  const diffMin = Math.max(0, Math.floor((Date.now() - new Date(event.end_time).getTime()) / 60000));
  if (diffMin === 0) return '刚结束';
  if (diffMin < 60) return `刚结束 ${diffMin} 分钟`;
  return `结束 ${Math.floor(diffMin / 60)} 小时前`;
}

export function StarlightRoot({ route }: { route: RouteName }) {
  const theme = useTheme();
  const { themeName, setThemeName } = useThemeSettings();
  const p = STARLIGHT_COLORS_BY_ID[theme.id] ?? STARLIGHT_COLORS_BY_ID[themeName] ?? STARLIGHT_NEBULA_COLORS;
  const [tab, setTab] = React.useState<StarlightTab>(() => routeToTab(route));
  const [eventSheetId, setEventSheetId] = React.useState<string | 'new' | null>(null);
  const [ratingTargetId, setRatingTargetId] = React.useState<string | null>(null);
  const [dismissedNudgeId, setDismissedNudgeId] = React.useState<string | null>(null);
  const [todoSheetState, setTodoSheetState] = React.useState<TodoSheetState>(null);
  const [weekOffset, setWeekOffset] = React.useState(0);
  const { events } = useEvents();
  const { todos } = useTodos();
  const ratingsApi = useRatings();
  const { semester } = useSemesterConfig();

  React.useEffect(() => {
    setTab(routeToTab(route));
  }, [route]);

  const now = new Date();
  const nowMs = now.getTime();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const currentWeekStart = getWeekStart(now);
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekStart.getDate() + 7);
  const viewingWeekStart = new Date(currentWeekStart);
  viewingWeekStart.setDate(currentWeekStart.getDate() + weekOffset * 7);
  const viewingWeekEnd = new Date(viewingWeekStart);
  viewingWeekEnd.setDate(viewingWeekStart.getDate() + 7);

  const todayExpandedEvents = React.useMemo(
    () =>
      expandRepeatingEvents(events, currentWeekStart, currentWeekEnd).sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
      ),
    [events, currentWeekStart.toDateString()],
  );

  const viewingWeekExpanded = React.useMemo(
    () =>
      expandRepeatingEvents(events, viewingWeekStart, viewingWeekEnd).sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
      ),
    [events, viewingWeekStart.toDateString()],
  );

  const todayEvents = React.useMemo(
    () => withState(todayExpandedEvents.filter((event) => sameDay(event, todayStart, tomorrowStart)), nowMs),
    [todayExpandedEvents, todayStart.toDateString(), nowMs],
  );

  const matrixEvents = React.useMemo(() => withState(viewingWeekExpanded, nowMs), [viewingWeekExpanded, nowMs]);
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
  const openTodos = todos.filter((todo) => !todo.is_completed).length;
  const doneTodos = todos.length - openTodos;
  const categoryByEventId = React.useMemo(() => {
    const acc: Record<string, CategoryKey> = {};
    for (const event of events) acc[event.id] = event.category;
    return acc;
  }, [events]);
  const findEventById = (id: string): StarlightEvent | null =>
    matrixEvents.find((event) => event.id === id) ?? todayEvents.find((event) => event.id === id) ?? null;
  const selectedEvent = eventSheetId && eventSheetId !== 'new' ? findEventById(eventSheetId) : null;
  const ratingTarget = ratingTargetId ? findEventById(ratingTargetId) : null;
  const existingRating = ratingTargetId ? ratingsByEventId[ratingTargetId] : undefined;
  const todoSheetIsNew = todoSheetState?.mode === 'create';
  const todoSheetTodo = todoSheetState?.mode === 'edit' ? todoSheetState.todo : null;

  const handleSaveRating = async ({ efficiency, moodIndex, reflection }: StarRatingSavePayload) => {
    if (!ratingTarget) return;
    try {
      await ratingsApi.save(
        {
          slot_start: ratingTarget.start_time,
          slot_end: ratingTarget.end_time,
          linked_event_id: ratingTarget.id,
          efficiency,
          rating: efficiency,
          mood: STARLIGHT_MOOD_LABELS[moodIndex - 1],
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

  const screens: Array<{ key: StarlightTab; element: React.ReactNode }> = [
    {
      key: 'today',
      element: (
        <StarHome
          p={p}
          events={todayEvents}
          todos={todos}
          ratingsByEventId={ratingsByEventId}
          categoryByEventId={categoryByEventId}
          semesterWeek={semesterWeek}
          nudgeEvent={nudgeEvent}
          nudgeText={nudgeCopy(nudgeEvent)}
          unratedCount={pastUnratedToday.length}
          openTodos={openTodos}
          doneTodos={doneTodos}
          onOpenEvent={setEventSheetId}
          onRate={setRatingTargetId}
          onDismissNudge={() => setDismissedNudgeId(nudgeEvent?.id ?? null)}
          onToggleTodo={(id) => void toggleTodoComplete(id)}
          onGoTodos={() => setTab('todos')}
        />
      ),
    },
    {
      key: 'week',
      element: (
        <StarMatrix
          p={p}
          events={matrixEvents}
          weekStart={viewingWeekStart}
          semesterWeek={semester ? getSemesterWeek(semester.start_date, viewingWeekStart) : null}
          weekOffset={weekOffset}
          onPrevWeek={() => setWeekOffset((offset) => offset - 1)}
          onNextWeek={() => setWeekOffset((offset) => offset + 1)}
          onResetWeek={() => setWeekOffset(0)}
          onOpenEvent={setEventSheetId}
        />
      ),
    },
    {
      key: 'todos',
      element: (
        <StarTodos
          p={p}
          todos={todos}
          onToggle={(id) => void toggleTodoComplete(id)}
          onOpenTodo={(todo) => setTodoSheetState({ mode: 'edit', todo })}
        />
      ),
    },
    {
      key: 'settings',
      element: (
        <StarSettings
          p={p}
          paletteId={theme.id}
          palettes={STARLIGHT_PALETTES}
          onSelectPalette={setThemeName}
        />
      ),
    },
  ];

  return (
    <StarlightBackground p={p} testID="starlight-root-background">
      <View style={styles.stack}>
        {screens.map((screen) => (
          <Screen key={screen.key} name={screen.key} active={tab === screen.key}>
            {screen.element}
          </Screen>
        ))}
      </View>
      <StarlightTabBar
        p={p}
        tab={tab}
        setTab={setTab}
        onAdd={() => (tab === 'todos' ? setTodoSheetState({ mode: 'create' }) : setEventSheetId('new'))}
      />
      <StarEventSheet
        p={p}
        event={selectedEvent}
        visible={eventSheetId !== null}
        onClose={() => setEventSheetId(null)}
        onSave={() => setEventSheetId(null)}
      />
      <StarRatingSheet
        p={p}
        event={ratingTarget}
        existing={existingRating}
        onClose={() => setRatingTargetId(null)}
        onSave={(payload) => void handleSaveRating(payload)}
      />
      <StarTodoSheet p={p} todo={todoSheetTodo} isNew={todoSheetIsNew} onClose={() => setTodoSheetState(null)} />
    </StarlightBackground>
  );
}

function Screen({ name, active, children }: { name: StarlightTab; active: boolean; children: React.ReactNode }) {
  const opacity = React.useRef(new Animated.Value(active ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: active ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [active, opacity]);

  return (
    <Animated.View
      testID={`starlight-screen-${name}`}
      accessibilityState={{ selected: active }}
      pointerEvents={active ? 'auto' : 'none'}
      style={[styles.screen, { opacity }]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stack: { flex: 1, position: 'relative', overflow: 'hidden' },
  screen: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
});
