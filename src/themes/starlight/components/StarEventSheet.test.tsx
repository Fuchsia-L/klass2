import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { ScheduleEvent } from '../../../features/schedule/types';
import { STARLIGHT_NEBULA_COLORS } from '../palettes/nebula';
import { StarEventSheet } from './StarEventSheet';

const event: ScheduleEvent = {
  id: 'event-1',
  title: 'Project review',
  category: '工作',
  start_time: new Date(2026, 3, 21, 11, 0).toISOString(),
  end_time: new Date(2026, 3, 21, 12, 0).toISOString(),
  repeat: 'none',
  location: 'Room 3',
  notes: 'Bring the lunar draft',
  source: 'manual',
  is_completed: false,
};

function renderSheet(
  props: Partial<React.ComponentProps<typeof StarEventSheet>> = {},
) {
  return render(
    <StarEventSheet
      p={STARLIGHT_NEBULA_COLORS}
      event={event}
      visible
      onClose={jest.fn()}
      onSave={jest.fn()}
      {...props}
    />,
  );
}

describe('StarEventSheet', () => {
  it('does not render sheet contents when closed', () => {
    const result = renderSheet({ visible: false, event: null });

    expect(result.queryByTestId('starlight-event-sheet')).toBeNull();
    expect(result.queryByText('Draft event')).toBeNull();
  });

  it('renders an existing event with header metadata and detail rows', () => {
    const result = renderSheet();

    expect(result.getByTestId('starlight-event-sheet')).toBeTruthy();
    expect(result.getAllByText('WORK').length).toBeGreaterThan(0);
    expect(result.getByTestId('starlight-event-sheet-time-range').props.children.join('')).toBe('11:00 - 12:00');
    expect(result.getByTestId('starlight-event-sheet-badge').props.children).toContain('WEEK');
    expect(result.getByTestId('starlight-event-sheet-title').props.value).toBe('Project review');
    expect(result.getByTestId('starlight-event-sheet-location').props.value).toBe('Room 3');
    expect(result.getByTestId('starlight-event-sheet-note').props.value).toBe('Bring the lunar draft');
    expect(result.getByTestId('starlight-event-sheet-location-row')).toBeTruthy();
    expect(result.getByTestId('starlight-event-sheet-category-row')).toBeTruthy();
    expect(result.getByTestId('starlight-event-sheet-note-row')).toBeTruthy();
  });

  it('renders new-event placeholder state on narrow-width friendly controls', () => {
    const result = renderSheet({ event: null, visible: true });

    expect(result.getByText('New · 新建')).toBeTruthy();
    expect(result.getAllByText('WORK').length).toBeGreaterThan(0);
    expect(result.getByTestId('starlight-event-sheet-title').props.placeholder).toBe('Draft event');
    expect(result.getByTestId('starlight-event-sheet-location').props.placeholder).toBe('—');
    expect(result.getByTestId('starlight-event-sheet-note').props.placeholder).toBe('—');
    expect(result.getByTestId('starlight-event-sheet-close')).toBeTruthy();
    expect(result.getByTestId('starlight-event-sheet-save')).toBeTruthy();
  });

  it('calls onClose from the close button and scrim', () => {
    const onClose = jest.fn();
    const result = renderSheet({ onClose });

    fireEvent.press(result.getByTestId('starlight-event-sheet-close'));
    fireEvent.press(result.getByTestId('starlight-event-sheet-scrim'));

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('calls onSave with the current form payload', async () => {
    const onClose = jest.fn();
    const onSave = jest.fn().mockResolvedValue(undefined);
    const result = renderSheet({ event: null, visible: true, onClose, onSave });

    fireEvent.changeText(result.getByTestId('starlight-event-sheet-title'), 'Map constellation lab');
    fireEvent.changeText(result.getByTestId('starlight-event-sheet-start'), '2026-04-22 09:30');
    fireEvent.changeText(result.getByTestId('starlight-event-sheet-end'), '2026-04-22 10:45');
    fireEvent.changeText(result.getByTestId('starlight-event-sheet-location'), 'A201');
    fireEvent.press(result.getByTestId('starlight-event-category-学习'));
    fireEvent.changeText(result.getByTestId('starlight-event-sheet-note'), 'Bring notebook');
    fireEvent.press(result.getByTestId('starlight-event-sheet-save'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Map constellation lab',
          category: '学习',
          start_time: new Date(2026, 3, 22, 9, 30).toISOString(),
          end_time: new Date(2026, 3, 22, 10, 45).toISOString(),
          repeat: 'none',
          location: 'A201',
          notes: 'Bring notebook',
          source: 'manual',
          is_completed: false,
        }),
      );
    });
    expect(onSave.mock.calls[0][0].id).toBeUndefined();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('preserves existing event identity and unchanged fields when saving edits', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const result = renderSheet({ onSave });

    fireEvent.changeText(result.getByTestId('starlight-event-sheet-location'), 'Moon room');
    fireEvent.press(result.getByTestId('starlight-event-sheet-save'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'event-1',
          title: 'Project review',
          category: '工作',
          location: 'Moon room',
          notes: 'Bring the lunar draft',
          repeat: 'none',
        }),
      );
    });
  });
});
