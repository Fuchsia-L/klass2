import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { addEvent } from '../../../features/schedule/services/events.service';
import { STARLIGHT_NEBULA_COLORS } from '../palettes/nebula';
import { StarEventSheet } from './StarEventSheet';

jest.mock('../../../features/schedule/services/events.service', () => ({
  addEvent: jest.fn(),
  deleteEvent: jest.fn(),
  updateEvent: jest.fn(),
}));

describe('StarEventSheet new event form', () => {
  const mockedAddEvent = addEvent as jest.MockedFunction<typeof addEvent>;

  beforeEach(() => {
    mockedAddEvent.mockResolvedValue({ success: true });
  });

  it('saves a valid new event through the schedule service', async () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <StarEventSheet p={STARLIGHT_NEBULA_COLORS} event={null} isNew onClose={onClose} />,
    );

    fireEvent.changeText(getByTestId('starlight-event-title-input'), 'Planning Block');
    fireEvent.changeText(getByTestId('starlight-event-start-input'), '2026-04-20 09:00');
    fireEvent.changeText(getByTestId('starlight-event-end-input'), '2026-04-20 10:30');
    fireEvent.press(getByTestId('starlight-event-category-学习'));
    fireEvent.press(getByTestId('starlight-event-save'));

    await waitFor(() => {
      expect(mockedAddEvent).toHaveBeenCalledWith({
        title: 'Planning Block',
        category: '学习',
        start_time: new Date(2026, 3, 20, 9, 0, 0, 0).toISOString(),
        end_time: new Date(2026, 3, 20, 10, 30, 0, 0).toISOString(),
        repeat: 'none',
        source: 'manual',
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('keeps invalid form state local without calling the service', () => {
    const { getByTestId, getByText } = render(
      <StarEventSheet p={STARLIGHT_NEBULA_COLORS} event={null} isNew onClose={jest.fn()} />,
    );

    fireEvent.changeText(getByTestId('starlight-event-title-input'), 'Backwards Block');
    fireEvent.changeText(getByTestId('starlight-event-start-input'), '2026-04-20 11:00');
    fireEvent.changeText(getByTestId('starlight-event-end-input'), '2026-04-20 10:00');
    fireEvent.press(getByTestId('starlight-event-save'));

    expect(getByText('End must be after start')).toBeTruthy();
    expect(mockedAddEvent).not.toHaveBeenCalled();
  });

  it('requires a title before saving', () => {
    const { getByTestId, getByText } = render(
      <StarEventSheet p={STARLIGHT_NEBULA_COLORS} event={null} isNew onClose={jest.fn()} />,
    );

    fireEvent.changeText(getByTestId('starlight-event-title-input'), '   ');
    fireEvent.press(getByTestId('starlight-event-save'));

    expect(getByText('Title is required')).toBeTruthy();
    expect(mockedAddEvent).not.toHaveBeenCalled();
  });

  it('closes from the scrim press', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <StarEventSheet p={STARLIGHT_NEBULA_COLORS} event={null} isNew onClose={onClose} />,
    );

    fireEvent.press(getByTestId('starlight-event-sheet-scrim'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
