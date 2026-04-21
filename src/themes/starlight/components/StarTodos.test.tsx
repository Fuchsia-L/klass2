import React from 'react';
import { fireEvent, render, within } from '@testing-library/react-native';
import type { TodoItem } from '../../../features/todo/types';
import { STARLIGHT_NEBULA_COLORS } from '../palettes/nebula';
import { StarTodos } from './StarTodos';

const todos: TodoItem[] = [
  {
    id: 'open-1',
    title: 'Finish lab notes',
    type: 'daily',
    priority: 'high',
    is_completed: false,
    last_reset: '2026-04-21',
    created_at: '2026-04-21T00:00:00.000Z',
    notes: 'Bring telescope data',
  },
  {
    id: 'done-1',
    title: 'Archive readings',
    type: 'weekly',
    priority: 'low',
    is_completed: true,
    last_reset: '2026-04-21',
    created_at: '2026-04-20T00:00:00.000Z',
    notes: 'Week 8 packet',
  },
];

describe('StarTodos', () => {
  it('renders open and completed todos in separate Starlight groups', () => {
    const result = render(
      <StarTodos p={STARLIGHT_NEBULA_COLORS} todos={todos} onToggle={jest.fn()} onOpenTodo={jest.fn()} />,
    );

    const openGroup = within(result.getByTestId('starlight-todos-open'));
    const doneGroup = within(result.getByTestId('starlight-todos-done'));

    expect(result.getByText('Wishlist')).toBeTruthy();
    expect(result.getByText('1 open · 1 done')).toBeTruthy();
    expect(openGroup.getByText('Open')).toBeTruthy();
    expect(openGroup.getByText('Finish lab notes')).toBeTruthy();
    expect(openGroup.getByText('DAILY')).toBeTruthy();
    expect(openGroup.getByText('Bring telescope data')).toBeTruthy();
    expect(doneGroup.getByText('Done')).toBeTruthy();
    expect(doneGroup.getByText('Archive readings')).toBeTruthy();
    expect(doneGroup.getByText('WEEKLY')).toBeTruthy();
  });

  it('fires toggle and open callbacks with the selected todo', () => {
    const onToggle = jest.fn();
    const onOpenTodo = jest.fn();
    const result = render(
      <StarTodos p={STARLIGHT_NEBULA_COLORS} todos={todos} onToggle={onToggle} onOpenTodo={onOpenTodo} />,
    );

    fireEvent.press(result.getByTestId('starlight-todo-open-1'));
    expect(onOpenTodo).toHaveBeenCalledWith(todos[0]);

    fireEvent.press(within(result.getByTestId('starlight-todo-open-1')).getByTestId('starlight-todo-toggle'));
    expect(onToggle).toHaveBeenCalledWith('open-1');
  });
});
