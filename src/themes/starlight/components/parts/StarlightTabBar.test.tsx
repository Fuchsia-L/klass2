import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { STARLIGHT_NEBULA_COLORS } from '../../palettes/nebula';
import { StarlightTabBar } from './StarlightTabBar';

describe('StarlightTabBar', () => {
  it('keeps tab state controlled by callbacks and exposes prototype labels', () => {
    const setTab = jest.fn();
    const onAdd = jest.fn();
    const { getByTestId, getByText } = render(
      <StarlightTabBar p={STARLIGHT_NEBULA_COLORS} tab="today" setTab={setTab} onAdd={onAdd} />,
    );

    expect(getByText('TODAY')).toBeTruthy();
    expect(getByText('WEEK')).toBeTruthy();
    expect(getByText('TODOS')).toBeTruthy();
    expect(getByText('SET')).toBeTruthy();

    fireEvent.press(getByTestId('starlight-tab-today'));
    fireEvent.press(getByTestId('starlight-tab-week'));
    fireEvent.press(getByTestId('starlight-tab-todos'));
    fireEvent.press(getByTestId('starlight-tab-settings'));
    fireEvent.press(getByTestId('starlight-tab-add'));

    expect(setTab).toHaveBeenNthCalledWith(1, 'today');
    expect(setTab).toHaveBeenNthCalledWith(2, 'week');
    expect(setTab).toHaveBeenNthCalledWith(3, 'todos');
    expect(setTab).toHaveBeenNthCalledWith(4, 'settings');
    expect(onAdd).toHaveBeenCalledTimes(1);
  });
});
