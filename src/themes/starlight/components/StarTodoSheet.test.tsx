import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { addTodo, deleteTodo, updateTodo } from '../../../features/todo/services/todo.service';
import type { TodoItem } from '../../../features/todo/types';
import { STARLIGHT_NEBULA_COLORS } from '../palettes/nebula';
import { StarTodoSheet } from './StarTodoSheet';

jest.mock('../../../features/todo/services/todo.service', () => ({
  addTodo: jest.fn(),
  updateTodo: jest.fn(),
  deleteTodo: jest.fn(),
}));

const mockAddTodo = jest.mocked(addTodo);
const mockUpdateTodo = jest.mocked(updateTodo);
const mockDeleteTodo = jest.mocked(deleteTodo);

const todo: TodoItem = {
  id: 'todo-1',
  title: 'Chart the moon garden',
  type: 'longterm',
  priority: 'medium',
  is_completed: false,
  last_reset: '2026-04-21',
  created_at: '2026-04-20T00:00:00.000Z',
  notes: 'Use the quiet lens',
};

describe('StarTodoSheet', () => {
  beforeEach(() => {
    mockAddTodo.mockReset();
    mockUpdateTodo.mockReset();
    mockDeleteTodo.mockReset();
    mockAddTodo.mockResolvedValue(undefined);
    mockUpdateTodo.mockResolvedValue(undefined);
    mockDeleteTodo.mockResolvedValue(undefined);
  });

  it('renders create mode with editable title and no delete button', () => {
    const result = render(
      <StarTodoSheet p={STARLIGHT_NEBULA_COLORS} todo={null} isNew onClose={jest.fn()} />,
    );

    expect(result.getByTestId('starlight-todo-sheet')).toBeTruthy();
    expect(result.getByText('New Todo')).toBeTruthy();
    expect(result.getByTestId('starlight-todo-sheet-title').props.placeholder).toBe('Title');
    expect(result.queryByTestId('starlight-todo-sheet-delete')).toBeNull();
  });

  it('renders edit mode title, note, and delete button', () => {
    const result = render(
      <StarTodoSheet p={STARLIGHT_NEBULA_COLORS} todo={todo} isNew={false} onClose={jest.fn()} />,
    );

    expect(result.getByText('Edit Todo')).toBeTruthy();
    expect(result.getByTestId('starlight-todo-sheet-title').props.value).toBe('Chart the moon garden');
    expect(result.getByTestId('starlight-todo-sheet-note').props.value).toBe('Use the quiet lens');
    expect(result.getByText('长期')).toBeTruthy();
    expect(result.getByText('中')).toBeTruthy();
    expect(result.getByTestId('starlight-todo-sheet-delete')).toBeTruthy();
  });

  it('calls onClose from the close button and scrim', () => {
    const onClose = jest.fn();
    const result = render(
      <StarTodoSheet p={STARLIGHT_NEBULA_COLORS} todo={todo} isNew={false} onClose={onClose} />,
    );

    fireEvent.press(result.getByTestId('starlight-todo-sheet-close'));
    fireEvent.press(result.getByTestId('starlight-todo-sheet-scrim'));

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('adds a todo from create mode', async () => {
    const onClose = jest.fn();
    const result = render(
      <StarTodoSheet p={STARLIGHT_NEBULA_COLORS} todo={null} isNew onClose={onClose} />,
    );

    fireEvent.changeText(result.getByTestId('starlight-todo-sheet-title'), 'Map comet routes');
    fireEvent.press(result.getByTestId('starlight-todo-type-weekly'));
    fireEvent.press(result.getByTestId('starlight-todo-priority-high'));
    fireEvent.changeText(result.getByTestId('starlight-todo-sheet-note'), 'Use red ink');
    fireEvent.press(result.getByTestId('starlight-todo-sheet-save'));

    await waitFor(() => {
      expect(mockAddTodo).toHaveBeenCalledWith({
        title: 'Map comet routes',
        type: 'weekly',
        priority: 'high',
        notes: 'Use red ink',
      });
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('updates a todo from edit mode', async () => {
    const onClose = jest.fn();
    const result = render(
      <StarTodoSheet p={STARLIGHT_NEBULA_COLORS} todo={todo} isNew={false} onClose={onClose} />,
    );

    fireEvent.changeText(result.getByTestId('starlight-todo-sheet-title'), 'Chart the morning garden');
    fireEvent.press(result.getByTestId('starlight-todo-priority-low'));
    fireEvent.press(result.getByTestId('starlight-todo-sheet-save'));

    await waitFor(() => {
      expect(mockUpdateTodo).toHaveBeenCalledWith('todo-1', {
        title: 'Chart the morning garden',
        type: 'longterm',
        priority: 'low',
        notes: 'Use the quiet lens',
      });
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('deletes a todo after confirmation in edit mode', async () => {
    const onClose = jest.fn();
    const result = render(
      <StarTodoSheet p={STARLIGHT_NEBULA_COLORS} todo={todo} isNew={false} onClose={onClose} />,
    );

    fireEvent.press(result.getByTestId('starlight-todo-sheet-delete'));
    expect(mockDeleteTodo).not.toHaveBeenCalled();

    fireEvent.press(result.getByTestId('starlight-todo-sheet-delete'));

    await waitFor(() => {
      expect(mockDeleteTodo).toHaveBeenCalledWith('todo-1');
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
