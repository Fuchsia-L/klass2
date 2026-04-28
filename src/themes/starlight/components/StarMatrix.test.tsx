import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { STARLIGHT_NEBULA_COLORS } from '../palettes/nebula';
import {
  StarMatrix,
  scrollMatrixToNow,
  triggerMatrixWeekSwipeNavigation,
  type StarMatrixEvent,
} from './StarMatrix';

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

const weekStart = new Date(2026, 3, 20, 0, 0, 0, 0);

function renderMatrix(overrides: Partial<React.ComponentProps<typeof StarMatrix>> = {}) {
  const onPrevWeek = jest.fn();
  const onNextWeek = jest.fn();
  const onResetWeek = jest.fn();
  const onOpenEvent = jest.fn();
  const props: React.ComponentProps<typeof StarMatrix> = {
    p: STARLIGHT_NEBULA_COLORS,
    events: [
      matrixEvent('work', 'Project Review', new Date(2026, 3, 21, 9, 30).toISOString(), new Date(2026, 3, 21, 11, 0).toISOString(), 'next'),
      matrixEvent('overnight', 'Overnight Build', new Date(2026, 3, 20, 6, 0).toISOString(), new Date(2026, 3, 20, 7, 0).toISOString(), 'past'),
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

describe('StarMatrix initial positioning', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('scrolls near the current-time row through the ScrollView ref path', () => {
    const scrollTo = jest.fn();

    scrollMatrixToNow({ scrollTo }, 510);

    expect(scrollTo).toHaveBeenCalledWith({ y: 410, animated: false });
  });

  it('uses layout readiness instead of iOS-only contentOffset for initial position', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 3, 20, 14, 30, 0, 0));

    const { getByTestId } = render(
      <StarMatrix
        p={STARLIGHT_NEBULA_COLORS}
        events={[]}
        weekStart={new Date(2026, 3, 20, 0, 0, 0, 0)}
        semesterWeek={8}
        weekOffset={0}
        onOpenEvent={jest.fn()}
        onPrevWeek={jest.fn()}
        onNextWeek={jest.fn()}
        onResetWeek={jest.fn()}
      />,
    );

    const scrollView = getByTestId('starlight-matrix-scroll');
    expect(scrollView.props.onLayout).toEqual(expect.any(Function));
    expect(scrollView.props.contentOffset).toBeUndefined();
  });
});

describe('StarMatrix week navigation', () => {
  it('navigates to the next week for a left swipe past the horizontal threshold', () => {
    const onPrevWeek = jest.fn();
    const onNextWeek = jest.fn();

    const handled = triggerMatrixWeekSwipeNavigation(-56, 12, onPrevWeek, onNextWeek);

    expect(handled).toBe(true);
    expect(onNextWeek).toHaveBeenCalledTimes(1);
    expect(onPrevWeek).not.toHaveBeenCalled();
  });

  it('navigates to the previous week for a right swipe past the horizontal threshold', () => {
    const onPrevWeek = jest.fn();
    const onNextWeek = jest.fn();

    const handled = triggerMatrixWeekSwipeNavigation(64, -8, onPrevWeek, onNextWeek);

    expect(handled).toBe(true);
    expect(onPrevWeek).toHaveBeenCalledTimes(1);
    expect(onNextWeek).not.toHaveBeenCalled();
  });

  it('ignores horizontal movement below the threshold', () => {
    const onPrevWeek = jest.fn();
    const onNextWeek = jest.fn();

    const handled = triggerMatrixWeekSwipeNavigation(-50, 8, onPrevWeek, onNextWeek);

    expect(handled).toBe(false);
    expect(onPrevWeek).not.toHaveBeenCalled();
    expect(onNextWeek).not.toHaveBeenCalled();
  });

  it('ignores vertical-dominant movement so timeline scrolling can continue', () => {
    const onPrevWeek = jest.fn();
    const onNextWeek = jest.fn();

    const handled = triggerMatrixWeekSwipeNavigation(-80, 30, onPrevWeek, onNextWeek);

    expect(handled).toBe(false);
    expect(onPrevWeek).not.toHaveBeenCalled();
    expect(onNextWeek).not.toHaveBeenCalled();
  });

  it('keeps the header previous and next week buttons wired to their callbacks', () => {
    const { getByTestId, onPrevWeek, onNextWeek } = renderMatrix();

    fireEvent.press(getByTestId('starlight-matrix-prev-week'));
    fireEvent.press(getByTestId('starlight-matrix-next-week'));

    expect(onPrevWeek).toHaveBeenCalledTimes(1);
    expect(onNextWeek).toHaveBeenCalledTimes(1);
  });
});

describe('StarMatrix rendering', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 3, 21, 10, 30, 0, 0));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

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

  it('renders selected-week events and forwards event presses', () => {
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
