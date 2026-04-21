import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { STARLIGHT_NEBULA_COLORS } from '../palettes/nebula';
import { StarMatrix, type StarMatrixEvent } from './StarMatrix';

function matrixEvent(id: string, title: string, start: string, end: string, state: StarMatrixEvent['state'] = 'upcoming'): StarMatrixEvent {
  return {
    id,
    title,
    category: id === 'work' ? '工作' : '学习',
    start_time: start,
    end_time: end,
    repeat: 'none',
    location: `${title} room`,
    is_completed: false,
    state,
  };
}

const weekStart = new Date('2026-04-20T00:00:00.000Z');

function renderMatrix(overrides: Partial<React.ComponentProps<typeof StarMatrix>> = {}) {
  const onPrevWeek = jest.fn();
  const onNextWeek = jest.fn();
  const onResetWeek = jest.fn();
  const onOpenEvent = jest.fn();
  const props: React.ComponentProps<typeof StarMatrix> = {
    p: STARLIGHT_NEBULA_COLORS,
    events: [
      matrixEvent('work', 'Project Review', '2026-04-21T09:30:00.000Z', '2026-04-21T11:00:00.000Z', 'next'),
      matrixEvent('overnight', 'Overnight Build', '2026-04-19T23:00:00.000Z', '2026-04-20T07:00:00.000Z', 'past'),
    ],
    weekStart,
    semesterWeek: 9,
    weekOffset: 1,
    onPrevWeek,
    onNextWeek,
    onResetWeek,
    onOpenEvent,
    ...overrides,
  };

  return { ...render(<StarMatrix {...props} />), onPrevWeek, onNextWeek, onResetWeek, onOpenEvent };
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-04-21T10:30:00.000Z'));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('StarMatrix', () => {
  it('renders the week header strip, semester label, grid, and now marker', () => {
    const result = renderMatrix();

    expect(result.getByText('Week 9 · Apr 20 – 26')).toBeTruthy();
    expect(result.getByText('Constellation')).toBeTruthy();
    expect(result.getByText('一')).toBeTruthy();
    expect(result.getByTestId('starlight-matrix-day-0')).toBeTruthy();
    expect(result.getByText('06')).toBeTruthy();
    expect(result.getAllByText('24').length).toBeGreaterThan(0);
    expect(result.getByTestId('starlight-matrix-now-marker')).toBeTruthy();
  });

  it('forwards previous, next, and reset week controls', () => {
    const result = renderMatrix();

    fireEvent.press(result.getByTestId('starlight-matrix-prev-week'));
    fireEvent.press(result.getByTestId('starlight-matrix-next-week'));
    fireEvent.press(result.getByTestId('starlight-matrix-reset-week'));

    expect(result.onPrevWeek).toHaveBeenCalledTimes(1);
    expect(result.onNextWeek).toHaveBeenCalledTimes(1);
    expect(result.onResetWeek).toHaveBeenCalledTimes(1);
  });

  it('renders selected-week events, including a clipped spanning event, and forwards event presses', () => {
    const result = renderMatrix();

    expect(result.getByText('Project Review')).toBeTruthy();
    expect(result.getByText('Overnight Build')).toBeTruthy();

    fireEvent.press(result.getByTestId('starlight-matrix-event-work'));
    expect(result.onOpenEvent).toHaveBeenCalledWith('work');

    fireEvent.press(result.getByTestId('starlight-matrix-event-overnight'));
    expect(result.onOpenEvent).toHaveBeenCalledWith('overnight');
  });

  it('renders an empty selected week without overlapping the header shell', () => {
    const result = renderMatrix({ events: [], weekOffset: 0 });

    expect(result.getByText('Constellation')).toBeTruthy();
    expect(result.getByText('No constellations')).toBeTruthy();
    expect(result.queryByTestId('starlight-matrix-reset-week')).toBeNull();
  });
});
