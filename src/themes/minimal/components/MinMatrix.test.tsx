import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { MinMatrix, scrollMatrixToNow, triggerMatrixWeekSwipeNavigation } from './MinMatrix';
import type { MinimalPaletteColors } from './minimalTypes';

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

describe('MinMatrix initial positioning', () => {
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
      <MinMatrix
        p={paletteColors}
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

    const scrollView = getByTestId('min-matrix-scroll');
    expect(scrollView.props.onLayout).toEqual(expect.any(Function));
    expect(scrollView.props.contentOffset).toBeUndefined();
  });
});

describe('MinMatrix week navigation', () => {
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
    const onPrevWeek = jest.fn();
    const onNextWeek = jest.fn();
    const { getByTestId } = render(
      <MinMatrix
        p={paletteColors}
        events={[]}
        weekStart={new Date(2026, 3, 20, 0, 0, 0, 0)}
        semesterWeek={8}
        weekOffset={0}
        onOpenEvent={jest.fn()}
        onPrevWeek={onPrevWeek}
        onNextWeek={onNextWeek}
        onResetWeek={jest.fn()}
      />,
    );

    fireEvent.press(getByTestId('min-matrix-prev-week'));
    fireEvent.press(getByTestId('min-matrix-next-week'));

    expect(onPrevWeek).toHaveBeenCalledTimes(1);
    expect(onNextWeek).toHaveBeenCalledTimes(1);
  });
});
