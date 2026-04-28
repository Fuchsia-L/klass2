import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
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
  it('renders open and completed todos with Starlight header and section labels', () => {
    const result = render(
      <StarTodos p={STARLIGHT_NEBULA_COLORS} todos={todos} onToggle={jest.fn()} onOpenTodo={jest.fn()} />,
    );

    expect(result.getByText('Wishlist')).toBeTruthy();
    expect(result.getByText('1 open · 1 done')).toBeTruthy();
    expect(result.getByTestId('starlight-todos-open')).toBeTruthy();
    expect(result.getByTestId('starlight-todos-done')).toBeTruthy();
    expect(result.getByText('Finish lab notes')).toBeTruthy();
    expect(result.getByText('DAILY')).toBeTruthy();
    expect(result.getByText('Bring telescope data')).toBeTruthy();
    expect(result.getByText('Archive readings')).toBeTruthy();
    expect(result.getByText('WEEKLY')).toBeTruthy();
  });

  it('fires toggle and open callbacks with the selected todo', () => {
    const onToggle = jest.fn();
    const onOpenTodo = jest.fn();
    const result = render(
      <StarTodos p={STARLIGHT_NEBULA_COLORS} todos={todos} onToggle={onToggle} onOpenTodo={onOpenTodo} />,
    );

    fireEvent.press(result.getByTestId('starlight-todo-open-1'));
    expect(onOpenTodo).toHaveBeenCalledWith(todos[0]);

    // The StarlightTodoRow nests a toggle Pressable with testID="starlight-todo-toggle".
    const toggles = result.getAllByTestId('starlight-todo-toggle');
    fireEvent.press(toggles[0]);
    expect(onToggle).toHaveBeenCalledWith('open-1');
  });

  it('filters todos by type when a tab is selected', () => {
    const result = render(
      <StarTodos p={STARLIGHT_NEBULA_COLORS} todos={todos} onToggle={jest.fn()} onOpenTodo={jest.fn()} />,
    );

    // All filter shows both rows.
    expect(result.queryByText('Finish lab notes')).toBeTruthy();
    expect(result.queryByText('Archive readings')).toBeTruthy();

    fireEvent.press(result.getByTestId('starlight-todos-tab-daily'));
    expect(result.queryByText('Finish lab notes')).toBeTruthy();
    expect(result.queryByText('Archive readings')).toBeNull();

    fireEvent.press(result.getByTestId('starlight-todos-tab-weekly'));
    expect(result.queryByText('Finish lab notes')).toBeNull();
    expect(result.queryByText('Archive readings')).toBeTruthy();
  });
});
