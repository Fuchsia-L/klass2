import React from 'react';
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import type { MinimalEvent, MinimalPaletteColors } from '../minimalTypes';
import { MinTimelineRow } from './MinTimelineRow';

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

function createEvent(overrides: Partial<MinimalEvent> = {}): MinimalEvent {
  return {
    id: 'event-1',
    title: 'Deep Work',
    category: '学习',
    start_time: '2026-04-20T09:00:00.000Z',
    end_time: '2026-04-20T10:00:00.000Z',
    repeat: 'none',
    location: 'Room 1',
    is_completed: false,
    state: 'upcoming',
    ...overrides,
  };
}

function flattenRailStyle(style: unknown) {
  return StyleSheet.flatten(style) ?? {};
}

describe('MinTimelineRow', () => {
  it('renders a 1px rail using the active palette line color', () => {
    const { getByTestId } = render(
      <MinTimelineRow event={createEvent({ category: '学习' })} p={paletteColors} onOpen={jest.fn()} onRate={jest.fn()} />,
    );

    const railStyle = flattenRailStyle(getByTestId('min-timeline-rail').props.style);

    expect(railStyle).toMatchObject({
      width: 1,
      backgroundColor: paletteColors.line,
      opacity: 1,
    });
  });

  it('keeps past row opacity on the rail', () => {
    const { getByTestId } = render(
      <MinTimelineRow event={createEvent({ category: '工作', state: 'past' })} p={paletteColors} onOpen={jest.fn()} onRate={jest.fn()} />,
    );

    const railStyle = flattenRailStyle(getByTestId('min-timeline-rail').props.style);

    expect(railStyle).toMatchObject({
      width: 1,
      backgroundColor: paletteColors.line,
      opacity: 0.5,
    });
  });
});
