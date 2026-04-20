import React from 'react';
import { render } from '@testing-library/react-native';
import { MinMatrix, scrollMatrixToNow } from './MinMatrix';
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
