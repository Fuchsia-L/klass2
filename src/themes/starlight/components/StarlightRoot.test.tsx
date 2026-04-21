import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useTheme, useThemeSettings } from '../../../theme/ThemeContext';
import { useEvents, useSemesterConfig } from '../../../features/schedule';
import { useRatings } from '../../../features/rating';
import { useTodos } from '../../../features/todo';
import { starlightPackage } from '../package';
import { STARLIGHT_NEBULA_COLORS } from '../palettes/nebula';
import { StarlightRoot } from './StarlightRoot';
import type { RouteName } from '../../types';
import type { ScheduleEvent } from '../../../features/schedule/types';

jest.mock('../../../theme/ThemeContext', () => ({
  useTheme: jest.fn(),
  useThemeSettings: jest.fn(),
}));

jest.mock('../../../features/schedule', () => ({
  useEvents: jest.fn(),
  useSemesterConfig: jest.fn(),
}));

jest.mock('../../../features/rating', () => ({
  useRatings: jest.fn(),
}));

jest.mock('../../../features/todo', () => ({
  useTodos: jest.fn(),
}));

jest.mock('../../../features/todo/services/todo.service', () => ({
  toggleTodoComplete: jest.fn(),
}));

const mockUseTheme = jest.mocked(useTheme);
const mockUseThemeSettings = jest.mocked(useThemeSettings);
const mockUseEvents = jest.mocked(useEvents);
const mockUseSemesterConfig = jest.mocked(useSemesterConfig);
const mockUseRatings = jest.mocked(useRatings);
const mockUseTodos = jest.mocked(useTodos);

function selectedScreen(result: ReturnType<typeof render>, name: string): boolean | undefined {
  return result.getByTestId(`starlight-screen-${name}`).props.accessibilityState?.selected;
}

function renderRoot(route: RouteName = 'home') {
  return render(<StarlightRoot route={route} />);
}

beforeEach(() => {
  mockUseTheme.mockReturnValue({
    id: 'starlight-nebula',
    name: 'Starlight Nebula',
    colors: {
      bg: STARLIGHT_NEBULA_COLORS.bg,
      card: STARLIGHT_NEBULA_COLORS.panelSolid,
      cardBorder: STARLIGHT_NEBULA_COLORS.line,
      primary: STARLIGHT_NEBULA_COLORS.accent,
      accent: STARLIGHT_NEBULA_COLORS.accent2,
      success: '#8EE6A1',
      ratingFill: STARLIGHT_NEBULA_COLORS.firefly,
      danger: '#FF7A9A',
      warning: STARLIGHT_NEBULA_COLORS.firefly,
      textMain: STARLIGHT_NEBULA_COLORS.ink,
      textSub: STARLIGHT_NEBULA_COLORS.subtle,
      overlay: STARLIGHT_NEBULA_COLORS.sheetScrim,
      inputBg: STARLIGHT_NEBULA_COLORS.panel,
      divider: STARLIGHT_NEBULA_COLORS.line,
      priorityHigh: '#FF7A9A',
      priorityMedium: STARLIGHT_NEBULA_COLORS.firefly,
      priorityLow: STARLIGHT_NEBULA_COLORS.subtle,
    },
    fonts: { heading: 'Fraunces-SemiBold', body: 'Inter-Regular' },
    radius: { card: 14, button: 999, sheet: 28 },
  });
  mockUseThemeSettings.mockReturnValue({ themeName: 'starlight-nebula', setThemeName: jest.fn() });
  mockUseEvents.mockReturnValue({ events: [], loading: false, refresh: jest.fn() });
  mockUseSemesterConfig.mockReturnValue({ semester: { start_date: '2026-02-23', total_weeks: 20 }, loading: false, refresh: jest.fn() });
  mockUseRatings.mockReturnValue({
    ratings: [],
    loading: false,
    error: null,
    refresh: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  });
  mockUseTodos.mockReturnValue({ todos: [], loading: false, refresh: jest.fn() });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('StarlightRoot route mapping', () => {
  it.each([
    ['home', 'today'],
    ['matrix', 'week'],
    ['todos', 'todos'],
    ['settings', 'settings'],
  ] as const)('selects %s route as the %s tab', (route, tab) => {
    const result = renderRoot(route);

    expect(selectedScreen(result, tab)).toBe(true);
  });

  it('is returned by the starlight package renderRoot entry point', () => {
    const element = starlightPackage.renderRoot('home') as React.ReactElement<{ route: RouteName }>;

    expect(element.type).toBe(StarlightRoot);
    expect(element.props.route).toBe('home');
  });
});

describe('StarlightRoot tab and sheet state', () => {
  it('switches visible screens from the Starlight tab bar without expo-router navigation', () => {
    const result = renderRoot('home');

    expect(selectedScreen(result, 'today')).toBe(true);
    expect(selectedScreen(result, 'week')).toBe(false);

    fireEvent.press(result.getByTestId('starlight-tab-week'));

    expect(selectedScreen(result, 'today')).toBe(false);
    expect(selectedScreen(result, 'week')).toBe(true);
  });

  it('opens the event sheet from schedule tabs and the todo sheet from the todos tab', () => {
    const result = renderRoot('home');

    fireEvent.press(result.getByTestId('starlight-tab-add'));
    expect(result.getByTestId('starlight-event-sheet')).toBeTruthy();

    fireEvent.press(result.getByTestId('starlight-event-sheet-close'));
    fireEvent.press(result.getByTestId('starlight-tab-week'));
    fireEvent.press(result.getByTestId('starlight-tab-add'));
    expect(result.getByTestId('starlight-event-sheet')).toBeTruthy();

    fireEvent.press(result.getByTestId('starlight-event-sheet-close'));
    fireEvent.press(result.getByTestId('starlight-tab-todos'));
    fireEvent.press(result.getByTestId('starlight-tab-add'));

    expect(result.getByTestId('starlight-todo-sheet')).toBeTruthy();
  });

  it('saves a rating through ratingsApi, closes the sheet, and dismisses the nudge', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-21T12:00:00.000Z'));

    const save = jest.fn().mockResolvedValue(undefined);
    const pastEvent: ScheduleEvent = {
      id: 'past-unrated',
      title: 'Calculus Review',
      category: '学习',
      start_time: '2026-04-21T09:00:00.000Z',
      end_time: '2026-04-21T10:30:00.000Z',
      repeat: 'none',
      location: 'Teaching Hall A201',
      is_completed: false,
    };
    mockUseEvents.mockReturnValue({ events: [pastEvent], loading: false, refresh: jest.fn() });
    mockUseRatings.mockReturnValue({
      ratings: [],
      loading: false,
      error: null,
      refresh: jest.fn(),
      save,
      remove: jest.fn(),
    });

    const result = renderRoot('home');

    expect(result.getByTestId('starlight-rating-nudge-rate')).toBeTruthy();
    fireEvent.press(result.getByTestId('starlight-rating-nudge-rate'));
    expect(result.getByTestId('starlight-rating-sheet')).toBeTruthy();

    fireEvent.press(result.getByTestId('starlight-rating-efficiency-5'));
    fireEvent.press(result.getByTestId('starlight-rating-mood-4'));
    fireEvent.changeText(result.getByTestId('starlight-rating-reflection'), 'Solid review block.');
    fireEvent.press(result.getByTestId('starlight-rating-save'));

    await waitFor(() => {
      expect(save).toHaveBeenCalledWith(
        {
          slot_start: pastEvent.start_time,
          slot_end: pastEvent.end_time,
          linked_event_id: pastEvent.id,
          efficiency: 5,
          rating: 5,
          mood: '好',
          reflection: 'Solid review block.',
        },
        undefined,
      );
    });
    await waitFor(() => expect(result.queryByTestId('starlight-rating-sheet')).toBeNull());
    expect(result.queryByTestId('starlight-rating-nudge-rate')).toBeNull();

  });
});
