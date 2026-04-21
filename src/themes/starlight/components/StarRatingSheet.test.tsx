import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import type { TimeSlotRating } from '../../../features/rating/types';
import type { ScheduleEvent } from '../../../features/schedule/types';
import { STARLIGHT_NEBULA_COLORS } from '../palettes/nebula';
import { StarRatingSheet } from './StarRatingSheet';

const event: ScheduleEvent = {
  id: 'event-1',
  title: 'Calculus Review',
  category: '学习',
  start_time: '2026-04-21T09:00:00.000Z',
  end_time: '2026-04-21T10:30:00.000Z',
  repeat: 'none',
  location: 'Teaching Hall A201',
  is_completed: false,
};

const existing: TimeSlotRating = {
  id: 'rating-1',
  linked_event_id: 'event-1',
  slot_start: event.start_time,
  slot_end: event.end_time,
  rating: 4,
  efficiency: 4,
  mood: '好',
  reflection: '节奏稳，比上次快一分钟。',
  created_at: '2026-04-21T10:35:00.000Z',
  updated_at: '2026-04-21T10:35:00.000Z',
  schema_version: 1,
};

function renderSheet(overrides: Partial<React.ComponentProps<typeof StarRatingSheet>> = {}) {
  const onClose = jest.fn();
  const onSave = jest.fn();
  const props: React.ComponentProps<typeof StarRatingSheet> = {
    p: STARLIGHT_NEBULA_COLORS,
    event,
    existing: undefined,
    onClose,
    onSave,
    ...overrides,
  };

  return { ...render(<StarRatingSheet {...props} />), onClose, onSave };
}

describe('StarRatingSheet', () => {
  it('renders event metadata and prefills an existing rating', () => {
    const result = renderSheet({ existing });

    expect(result.getByTestId('starlight-rating-sheet')).toBeTruthy();
    expect(result.getByTestId('starlight-rating-sheet-title').props.children).toBe('Calculus Review');
    expect(result.getByTestId('starlight-rating-sheet-category').props.children).toEqual(['Rate - ', 'STUDY']);
    expect(result.getByTestId('starlight-rating-sheet-location').props.children).toBe('Teaching Hall A201');
    expect(result.getByTestId('starlight-rating-efficiency-value').props.children).toEqual([4, '/5']);
    expect(result.getByTestId('starlight-rating-mood-value').props.children).toBe('好');
    expect(result.getByTestId('starlight-rating-reflection').props.value).toBe('节奏稳，比上次快一分钟。');
  });

  it('keeps save disabled until efficiency and mood are selected, then emits the expected payload', () => {
    const result = renderSheet();

    expect(result.getByTestId('starlight-rating-save').props.accessibilityState.disabled).toBe(true);
    fireEvent.press(result.getByTestId('starlight-rating-save'));
    expect(result.onSave).not.toHaveBeenCalled();

    fireEvent.press(result.getByTestId('starlight-rating-efficiency-3'));
    expect(result.getByTestId('starlight-rating-save').props.accessibilityState.disabled).toBe(true);

    fireEvent.press(result.getByTestId('starlight-rating-mood-2'));
    fireEvent.changeText(result.getByTestId('starlight-rating-reflection'), 'Focus dipped near the end.');

    expect(result.getByTestId('starlight-rating-save').props.accessibilityState.disabled).toBe(false);
    fireEvent.press(result.getByTestId('starlight-rating-save'));

    expect(result.onSave).toHaveBeenCalledWith({
      efficiency: 3,
      moodIndex: 2,
      reflection: 'Focus dipped near the end.',
    });
  });

  it('closes from skip and scrim actions', () => {
    const result = renderSheet();

    fireEvent.press(result.getByTestId('starlight-rating-skip'));
    fireEvent.press(result.getByTestId('starlight-rating-sheet-scrim'));

    expect(result.onClose).toHaveBeenCalledTimes(2);
  });
});
