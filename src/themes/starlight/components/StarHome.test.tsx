import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import type { TimeSlotRating } from '../../../features/rating/types';
import type { ScheduleEvent } from '../../../features/schedule/types';
import type { TodoItem } from '../../../features/todo/types';
import { STARLIGHT_NEBULA_COLORS } from '../palettes/nebula';
import { StarHome, type StarEvent } from './StarHome';

function event(id: string, title: string, start: string, end: string, state: StarEvent['state']): StarEvent {
  return {
    id,
    title,
    category: id === 'sport' ? '运动' : id === 'work' ? '工作' : '学习',
    start_time: start,
    end_time: end,
    repeat: 'none',
    location: `${title} room`,
    is_completed: false,
    state,
  };
}

function rating(linkedEventId: string): TimeSlotRating {
  return {
    id: `rating-${linkedEventId}`,
    linked_event_id: linkedEventId,
    slot_start: '2026-04-21T07:30:00.000Z',
    slot_end: '2026-04-21T08:00:00.000Z',
    rating: 4,
    efficiency: 4,
    mood: 'good',
    created_at: '2026-04-21T08:02:00.000Z',
    updated_at: '2026-04-21T08:02:00.000Z',
    schema_version: 1,
  };
}

const todos: TodoItem[] = [
  {
    id: 'todo-1',
    title: 'Finish lab notes',
    type: 'daily',
    priority: 'high',
    is_completed: false,
    last_reset: '2026-04-21',
    created_at: '2026-04-21T00:00:00.000Z',
  },
  {
    id: 'todo-2',
    title: 'Archive readings',
    type: 'weekly',
    priority: 'low',
    is_completed: true,
    last_reset: '2026-04-21',
    created_at: '2026-04-21T00:00:00.000Z',
  },
];

const events: StarEvent[] = [
  event('past-rated', 'Morning Run', '2026-04-21T07:30:00.000Z', '2026-04-21T08:00:00.000Z', 'past'),
  event('past-unrated', 'Calculus Review', '2026-04-21T09:00:00.000Z', '2026-04-21T10:30:00.000Z', 'past'),
  event('now-event', 'Studio Crit', '2026-04-21T11:00:00.000Z', '2026-04-21T12:00:00.000Z', 'now'),
  event('next-event', 'Project Review', '2026-04-21T13:00:00.000Z', '2026-04-21T14:00:00.000Z', 'next'),
  event('upcoming-event', 'Data Structures', '2026-04-21T15:00:00.000Z', '2026-04-21T16:30:00.000Z', 'upcoming'),
];

function renderHome(overrides: Partial<React.ComponentProps<typeof StarHome>> = {}) {
  const onOpenEvent = jest.fn();
  const onRate = jest.fn();
  const onDismissNudge = jest.fn();
  const props: React.ComponentProps<typeof StarHome> = {
    p: STARLIGHT_NEBULA_COLORS,
    events,
    todos,
    ratingsByEventId: { 'past-rated': rating('past-rated') },
    categoryByEventId: Object.fromEntries(events.map((item) => [item.id, item.category])) as Record<string, ScheduleEvent['category']>,
    semesterWeek: 9,
    nudgeEvent: events[1],
    nudgeText: '刚结束 5 分钟',
    unratedCount: 1,
    openTodos: 1,
    doneTodos: 1,
    onOpenEvent,
    onRate,
    onDismissNudge,
    onToggleTodo: jest.fn(),
    onGoTodos: jest.fn(),
    ...overrides,
  };

  return { ...render(<StarHome {...props} />), onOpenEvent, onRate, onDismissNudge };
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-04-21T11:30:00.000Z'));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('StarHome', () => {
  it('renders the starlight title, timeline states, nudge, todo summary, and counts', () => {
    const result = renderHome();

    expect(result.getByText('Tonight')).toBeTruthy();
    expect(result.getByText('5 事件')).toBeTruthy();
    expect(result.getByText('第 9 周')).toBeTruthy();
    expect(result.getByText('1')).toBeTruthy();
    expect(result.getByText('待办 · 1 已完成')).toBeTruthy();
    expect(result.getByText('Morning Run')).toBeTruthy();
    expect(result.getByText('EFF 4/5 · good')).toBeTruthy();
    expect(result.getByText('未评 +')).toBeTruthy();
    expect(result.getByText('Studio Crit')).toBeTruthy();
    expect(result.getByText('Project Review')).toBeTruthy();
    expect(result.getByText('Data Structures')).toBeTruthy();
    expect(result.getByText('Calculus Review · 刚结束 5 分钟')).toBeTruthy();
    expect(result.getByText('Unrated')).toBeTruthy();
    expect(result.getByTestId('starlight-home-now-line')).toBeTruthy();
    expect(result.getAllByTestId('starlight-row-firefly').length).toBeGreaterThan(0);
  });

  it('forwards event, nudge rating, unrated summary, and dismiss presses', () => {
    const result = renderHome();

    fireEvent.press(result.getByTestId('starlight-event-next-event'));
    expect(result.onOpenEvent).toHaveBeenCalledWith('next-event');

    fireEvent.press(result.getByTestId('starlight-rating-nudge-rate'));
    expect(result.onRate).toHaveBeenCalledWith('past-unrated');

    fireEvent.press(result.getByTestId('starlight-unrated-summary'));
    expect(result.onRate).toHaveBeenCalledWith('past-unrated');

    fireEvent.press(result.getByTestId('starlight-rating-nudge-dismiss'));
    expect(result.onDismissNudge).toHaveBeenCalledTimes(1);
  });

  it('handles empty event and todo states without dropping the primary layout', () => {
    const result = renderHome({
      events: [],
      todos: [],
      ratingsByEventId: {},
      categoryByEventId: {},
      nudgeEvent: null,
      unratedCount: 0,
      openTodos: 0,
      doneTodos: 0,
    });

    expect(result.getByText('Tonight')).toBeTruthy();
    expect(result.getByText('Quiet sky')).toBeTruthy();
    expect(result.getByText('No events are scheduled for today.')).toBeTruthy();
    fireEvent.press(result.getByTestId('starlight-home-todo-summary'));
    expect(result.getByText('No open todos tonight')).toBeTruthy();
  });
});
