import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Animated, Platform, StyleSheet } from 'react-native';
import type { TimeSlotRating } from '../../../features/rating/types';
import type { MinimalEvent, MinimalPaletteColors } from './minimalTypes';
import { MOOD_FACES } from './minimalTypes';
import { MinRatingSheet } from './MinRatingSheet';

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
    id: overrides.id ?? 'event-1',
    title: overrides.title ?? 'Deep Work',
    category: overrides.category ?? '学习',
    start_time: overrides.start_time ?? '2026-04-20T09:00:00.000Z',
    end_time: overrides.end_time ?? '2026-04-20T10:00:00.000Z',
    repeat: overrides.repeat ?? 'none',
    is_completed: overrides.is_completed ?? false,
    state: overrides.state ?? 'past',
    ...overrides,
  };
}

function makeRating(overrides: Partial<TimeSlotRating> = {}): TimeSlotRating {
  return {
    id: overrides.id ?? 'rating-1',
    slot_start: overrides.slot_start ?? '2026-04-20T09:00:00.000Z',
    slot_end: overrides.slot_end ?? '2026-04-20T10:00:00.000Z',
    linked_event_id: overrides.linked_event_id ?? 'event-1',
    rating: overrides.rating ?? 4,
    efficiency: overrides.efficiency ?? 3,
    mood: overrides.mood ?? '平',
    reflection: overrides.reflection ?? 'initial reflection',
    created_at: overrides.created_at ?? '2026-04-20T10:00:00.000Z',
    updated_at: overrides.updated_at ?? '2026-04-20T10:00:00.000Z',
    synced_at: overrides.synced_at,
    deleted_at: overrides.deleted_at,
    schema_version: 1,
    ...overrides,
  };
}

describe('MinRatingSheet edit stability', () => {
  it('does not overwrite local edits when the same open event receives a refreshed existing rating', () => {
    const onSave = jest.fn();
    const event = makeEvent();
    const existing = makeRating();

    const { getByTestId, getByText, rerender } = render(
      <MinRatingSheet p={paletteColors} event={event} existing={existing} onClose={jest.fn()} onSave={onSave} />,
    );

    fireEvent.changeText(getByTestId('min-rating-reflection'), 'local draft');
    fireEvent.press(getByTestId('min-rating-efficiency-2'));
    fireEvent.press(getByTestId('min-rating-mood-4'));

    rerender(
      <MinRatingSheet
        p={paletteColors}
        event={event}
        existing={makeRating({
          id: existing.id,
          efficiency: 5,
          mood: '极',
          reflection: 'remote refresh',
          updated_at: '2026-04-20T10:05:00.000Z',
        })}
        onClose={jest.fn()}
        onSave={onSave}
      />,
    );

    expect(getByTestId('min-rating-reflection').props.value).toBe('local draft');

    fireEvent.press(getByText('Save'));

    expect(onSave).toHaveBeenCalledWith({
      efficiency: 2,
      moodIndex: 4,
      reflection: 'local draft',
    });
  });

  it('reseeds local rating fields when switching to a different event id', () => {
    const onSave = jest.fn();
    const firstEvent = makeEvent({ id: 'event-1', title: 'Deep Work' });
    const secondEvent = makeEvent({
      id: 'event-2',
      title: 'Review Notes',
      start_time: '2026-04-20T11:00:00.000Z',
      end_time: '2026-04-20T12:00:00.000Z',
    });

    const { getByTestId, getByText, rerender } = render(
      <MinRatingSheet
        p={paletteColors}
        event={firstEvent}
        existing={makeRating({ linked_event_id: firstEvent.id, reflection: 'first event' })}
        onClose={jest.fn()}
        onSave={onSave}
      />,
    );

    fireEvent.changeText(getByTestId('min-rating-reflection'), 'unsaved first draft');

    rerender(
      <MinRatingSheet
        p={paletteColors}
        event={secondEvent}
        existing={makeRating({
          id: 'rating-2',
          linked_event_id: secondEvent.id,
          slot_start: secondEvent.start_time,
          slot_end: secondEvent.end_time,
          efficiency: 5,
          mood: '极',
          reflection: 'second event seed',
        })}
        onClose={jest.fn()}
        onSave={onSave}
      />,
    );

    expect(getByTestId('min-rating-reflection').props.value).toBe('second event seed');

    fireEvent.press(getByText('Save'));

    expect(onSave).toHaveBeenCalledWith({
      efficiency: 5,
      moodIndex: 5,
      reflection: 'second event seed',
    });
  });
});

describe('MinRatingSheet mood visual fidelity', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses monospace only for the selected kaomoji face layer', () => {
    const { getByTestId } = render(
      <MinRatingSheet
        p={paletteColors}
        event={makeEvent()}
        existing={makeRating({ mood: '平' })}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />,
    );

    const selectedFaceStyle = flattenStyle(getByTestId('min-rating-mood-3-face').props.style);
    const selectedCharacterStyle = flattenStyle(getByTestId('min-rating-mood-3-character').props.style);
    const unselectedCharacterStyle = flattenStyle(getByTestId('min-rating-mood-4-character').props.style);

    expect(selectedFaceStyle.fontFamily).toBe(Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }));
    expect(selectedFaceStyle.fontSize).toBe(12);
    expect(selectedCharacterStyle.fontFamily).toBeUndefined();
    expect(unselectedCharacterStyle.fontFamily).toBeUndefined();
    expect(unselectedCharacterStyle.fontSize).toBe(16);
  });

  it('renders both mood character and face layers with unselected character visible by default', () => {
    const { getByTestId } = render(
      <MinRatingSheet p={paletteColors} event={makeEvent()} onClose={jest.fn()} onSave={jest.fn()} />,
    );

    expect(getByTestId('min-rating-mood-3-character').props.children).toBe('平');
    expect(getByTestId('min-rating-mood-3-face').props.children).toBe(MOOD_FACES[2]);
    expect(readAnimatedValue(flattenStyle(getByTestId('min-rating-mood-3-character').props.style).opacity)).toBe(1);
    expect(readAnimatedValue(flattenStyle(getByTestId('min-rating-mood-3-face').props.style).opacity)).toBe(0);
  });

  it('starts a 160ms Animated crossfade when selecting a mood', () => {
    const timingSpy = jest.spyOn(Animated, 'timing');
    const { getByTestId } = render(
      <MinRatingSheet p={paletteColors} event={makeEvent()} onClose={jest.fn()} onSave={jest.fn()} />,
    );
    timingSpy.mockClear();

    fireEvent.press(getByTestId('min-rating-mood-5'));

    const moodFadeCalls = timingSpy.mock.calls.filter(([, config]) => config.duration === 160);
    expect(moodFadeCalls).toHaveLength(2);
    expect(moodFadeCalls.map(([, config]) => config.toValue).sort()).toEqual([0, 1]);
    expect(moodFadeCalls.every(([, config]) => config.useNativeDriver === true)).toBe(true);
  });
});

function flattenStyle(style: unknown): Record<string, any> {
  return StyleSheet.flatten(style) as Record<string, any>;
}

function readAnimatedValue(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && '__getValue' in value && typeof value.__getValue === 'function') {
    return value.__getValue();
  }
  throw new Error('Animated value is not readable in test');
}
