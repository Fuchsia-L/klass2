import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { TodoItem } from '../../../features/todo/types';
import type { StarlightPaletteColors } from './starlightTypes';
import { StarlightTodoRow } from './parts';

type Props = {
  p: StarlightPaletteColors;
  todos: TodoItem[];
  onToggle: (id: string) => void;
  onOpenTodo: (todo: TodoItem) => void;
};

export function todoDueLabel(todo: Pick<TodoItem, 'type'>): string {
  if (todo.type === 'daily') return 'DAILY';
  if (todo.type === 'weekly') return 'WEEKLY';
  return 'LONG';
}

export function StarTodos({ p, todos, onToggle, onOpenTodo }: Props) {
  const open = todos.filter((todo) => !todo.is_completed);
  const done = todos.filter((todo) => todo.is_completed);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: p.subtle }]}>Notes to self</Text>
        <Text style={[styles.title, { color: p.ink }]}>Wishlist</Text>
        <Text style={[styles.counts, { color: p.subtle }]}>
          {open.length} open · {done.length} done
        </Text>
      </View>

      <ScrollView testID="starlight-todos" contentContainerStyle={styles.list}>
        <TodoSection p={p} title="Open" todos={open} onToggle={onToggle} onOpenTodo={onOpenTodo} testID="starlight-todos-open" />
        <TodoSection p={p} title="Done" todos={done} onToggle={onToggle} onOpenTodo={onOpenTodo} testID="starlight-todos-done" />
        {todos.length === 0 ? (
          <View style={[styles.emptyPanel, { backgroundColor: p.panel, borderColor: p.line }]}>
            <Text style={[styles.emptyTitle, { color: p.ink }]}>Clear sky</Text>
            <Text style={[styles.emptyBody, { color: p.subtle }]}>No tasks are waiting tonight.</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function TodoSection({
  p,
  title,
  todos,
  onToggle,
  onOpenTodo,
  testID,
}: {
  p: StarlightPaletteColors;
  title: string;
  todos: TodoItem[];
  onToggle: (id: string) => void;
  onOpenTodo: (todo: TodoItem) => void;
  testID: string;
}) {
  if (todos.length === 0) return null;

  return (
    <View testID={testID} style={styles.section}>
      <Text style={[styles.sectionTitle, { color: p.subtle }]}>{title}</Text>
      <View style={[styles.sectionPanel, { backgroundColor: p.panel, borderColor: p.line }]}>
        {todos.map((todo) => (
          <StarlightTodoRow
            key={todo.id}
            p={p}
            todo={{
              id: todo.id,
              title: todo.title,
              dueLabel: todoDueLabel(todo),
              note: todo.notes,
              done: todo.is_completed,
            }}
            onToggle={() => onToggle(todo.id)}
            onOpen={() => onOpenTodo(todo)}
            testID={`starlight-todo-${todo.id}`}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 32,
    paddingHorizontal: 22,
    paddingBottom: 14,
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 6,
    fontFamily: 'Fraunces-Regular',
    fontSize: 36,
    lineHeight: 42,
    fontStyle: 'italic',
  },
  counts: {
    marginTop: 6,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  list: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 36,
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    marginBottom: 6,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sectionPanel: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    overflow: 'hidden',
  },
  emptyPanel: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
  },
  emptyTitle: {
    fontFamily: 'Fraunces-SemiBold',
    fontSize: 20,
    fontStyle: 'italic',
  },
  emptyBody: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
  },
});
