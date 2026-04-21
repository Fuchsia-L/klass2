import React from 'react';
import { Animated, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  StarlightPaletteCell,
  StarlightSheetBtn,
  StarlightSheetRow,
  StarlightTabBar,
  StarlightTodoRow,
  type StarlightTab,
  type StarlightTimelineEvent,
} from './parts';
import { StarHome } from './StarHome';
import { StarMatrix } from './StarMatrix';

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

function formatTime(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function todoDueLabel(todo: TodoItem): string {
  if (todo.type === 'daily') return 'DAILY';
  if (todo.type === 'weekly') return 'WEEKLY';
  return 'LONG';
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
        <StarlightTodos
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
        <StarlightSettings
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
      <StarlightEventSheet p={p} event={selectedEvent} isNew={eventSheetId === 'new'} onClose={() => setEventSheetId(null)} />
      <StarlightRatingSheet
        p={p}
        event={ratingTarget}
        existing={existingRating}
        onClose={() => setRatingTargetId(null)}
      />
      <StarlightTodoSheet p={p} todo={todoSheetTodo} isNew={todoSheetIsNew} onClose={() => setTodoSheetState(null)} />
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

function StarlightTodos({
  p,
  todos,
  onToggle,
  onOpenTodo,
}: {
  p: StarlightPaletteColors;
  todos: TodoItem[];
  onToggle: (id: string) => void;
  onOpenTodo: (todo: TodoItem) => void;
}) {
  return (
    <ScrollView testID="starlight-todos" contentContainerStyle={styles.screenContent}>
      <Text style={[styles.kicker, { color: p.subtle }]}>TODOS</Text>
      <Text style={[styles.title, { color: p.ink }]}>Task Constellation</Text>
      {todos.map((todo) => (
        <StarlightTodoRow
          key={todo.id}
          p={p}
          todo={{
            id: todo.id,
            title: todo.title,
            dueLabel: todoDueLabel(todo),
            note: todo.notes,
            done: todo.is_completed,
          }}
          onToggle={() => onToggle(todo.id)}
          onOpen={() => onOpenTodo(todo)}
          testID={`starlight-todo-${todo.id}`}
        />
      ))}
    </ScrollView>
  );
}

function StarlightSettings({
  p,
  paletteId,
  palettes,
  onSelectPalette,
}: {
  p: StarlightPaletteColors;
  paletteId: string;
  palettes: ThemePalette[];
  onSelectPalette: (id: string) => void;
}) {
  return (
    <ScrollView testID="starlight-settings" contentContainerStyle={styles.screenContent}>
      <Text style={[styles.kicker, { color: p.subtle }]}>SET</Text>
      <Text style={[styles.title, { color: p.ink }]}>Sky Settings</Text>
      <View style={styles.paletteGrid}>
        {palettes.map((palette) => (
          <StarlightPaletteCell
            key={palette.id}
            p={p}
            palette={palette}
            selected={palette.id === paletteId}
            onPress={() => onSelectPalette(palette.id)}
            testID={`starlight-palette-${palette.id}`}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function SheetFrame({
  p,
  visible,
  testID,
  title,
  onClose,
  children,
}: {
  p: StarlightPaletteColors;
  visible: boolean;
  testID: string;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View testID={testID} style={[styles.scrim, { backgroundColor: p.sheetScrim }]}>
        <View style={[styles.sheet, { backgroundColor: p.panelSolid, borderColor: p.line }]}>
          <Text style={[styles.sheetTitle, { color: p.ink }]}>{title}</Text>
          {children}
          <StarlightSheetBtn p={p} label="Close" onPress={onClose} testID={`${testID}-close`} />
        </View>
      </View>
    </Modal>
  );
}

function StarlightEventSheet({
  p,
  event,
  isNew,
  onClose,
}: {
  p: StarlightPaletteColors;
  event: StarlightEvent | null;
  isNew: boolean;
  onClose: () => void;
}) {
  return (
    <SheetFrame p={p} visible={isNew || !!event} testID="starlight-event-sheet" title={isNew ? 'New Event' : 'Event'} onClose={onClose}>
      <StarlightSheetRow p={p} label="Title" value={event?.title ?? 'Draft event'} />
      <StarlightSheetRow p={p} label="Time" value={event ? `${formatTime(event.start_time)}-${formatTime(event.end_time)}` : 'Unset'} />
    </SheetFrame>
  );
}

function StarlightRatingSheet({
  p,
  event,
  existing,
  onClose,
}: {
  p: StarlightPaletteColors;
  event: StarlightEvent | null;
  existing?: TimeSlotRating;
  onClose: () => void;
}) {
  return (
    <SheetFrame p={p} visible={!!event} testID="starlight-rating-sheet" title="Rating" onClose={onClose}>
      <StarlightSheetRow p={p} label="Event" value={event?.title ?? '-'} />
      <StarlightSheetRow p={p} label="Efficiency" value={existing ? `${existing.efficiency}/5` : 'Unrated'} />
    </SheetFrame>
  );
}

function StarlightTodoSheet({
  p,
  todo,
  isNew,
  onClose,
}: {
  p: StarlightPaletteColors;
  todo: TodoItem | null;
  isNew: boolean;
  onClose: () => void;
}) {
  return (
    <SheetFrame p={p} visible={isNew || !!todo} testID="starlight-todo-sheet" title={isNew ? 'New Todo' : 'Todo'} onClose={onClose}>
      <StarlightSheetRow p={p} label="Title" value={todo?.title ?? 'Draft todo'} />
      <StarlightSheetRow p={p} label="Cadence" value={todo ? todoDueLabel(todo) : 'Unset'} />
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  stack: { flex: 1, position: 'relative', overflow: 'hidden' },
  screen: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  screenContent: { paddingTop: 72, paddingHorizontal: 22, paddingBottom: 36 },
  kicker: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
  },
  title: {
    marginTop: 6,
    marginBottom: 18,
    fontFamily: 'Fraunces-SemiBold',
    fontSize: 30,
    lineHeight: 36,
  },
  panel: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginVertical: 12,
  },
  panelTitle: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '700',
  },
  bodyText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
  },
  nudge: {
    marginVertical: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  scrim: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    gap: 12,
  },
  sheetTitle: {
    fontFamily: 'Fraunces-SemiBold',
    fontSize: 24,
    lineHeight: 30,
  },
});
