import React from 'react';
import { render } from '@testing-library/react-native';
import type { TimeSlotRating } from '../../../features/rating/types';
import type { TodoItem } from '../../../features/todo/types';
import type { MinimalEvent, MinimalPaletteColors } from './minimalTypes';
import { MinHome } from './MinHome';

const paletteColors: MinimalPaletteColors = {
  bg: '#ffffff',
  ink: '#111111',
  dim: '#777777',
  line: '#dddddd',
  subtle: '#555555',
  panel: '#f7f7f7',
  accent: '#ff0000',
  nowLine: '#ff0000',
  sheetScrim: 'rgba(0,0,0,0.2)',
};

function makeEvent(overrides: Partial<MinimalEvent> = {}): MinimalEvent {
  return {
    id: 'event-1',
    title: 'Morning Block',
    category: '学习',
    start_time: '2026-04-20T09:00:00.000Z',
    end_time: '2026-04-20T10:00:00.000Z',
    repeat: 'none',
    is_completed: false,
    state: 'past',
    ...overrides,
  };
}

function makeRating(overrides: Partial<TimeSlotRating> = {}): TimeSlotRating {
  return {
    id: 'rating-1',
    slot_start: '2026-04-20T09:00:00.000Z',
    slot_end: '2026-04-20T10:00:00.000Z',
    linked_event_id: 'event-1',
    rating: 4,
    efficiency: 4,
    mood: '好',
    created_at: '2026-04-20T10:05:00.000Z',
    updated_at: '2026-04-20T10:05:00.000Z',
    schema_version: 1,
    ...overrides,
  };
}

describe('MinHome', () => {
  it('renders the trends section after timeline content when ratings are provided', () => {
    const event = makeEvent();
    const rating = makeRating();
    const { getByText, toJSON } = render(
      <MinHome
        p={paletteColors}
        events={[event]}
        todos={[] as TodoItem[]}
        ratings={[rating]}
        ratingsByEventId={{ [event.id]: rating }}
        categoryByEventId={{ [event.id]: event.category }}
        semesterWeek={8}
        nudgeEvent={null}
        nudgeText=""
        unratedCount={0}
        onOpenEvent={jest.fn()}
        onRate={jest.fn()}
        onDismissNudge={jest.fn()}
        onToggleTodo={jest.fn()}
        onGoTodos={jest.fn()}
      />,
    );

    expect(getByText('Morning Block')).toBeTruthy();
    expect(getByText('TRENDS · 7 DAYS')).toBeTruthy();

    const treeText = JSON.stringify(toJSON());
    expect(treeText.indexOf('Morning Block')).toBeLessThan(treeText.indexOf('TRENDS · 7 DAYS'));
  });
});
