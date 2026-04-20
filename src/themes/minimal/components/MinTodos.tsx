import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { TodoItem } from '../../../features/todo/types';
import type { MinimalPaletteColors, MinimalTodoPatch } from './minimalTypes';
import { MinTodoRow } from './parts/MinTodoRow';

type Props = {
  p: MinimalPaletteColors;
  todos: TodoItem[];
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  onToggle: (id: string) => void;
  onUpdate: (todo: TodoItem, patch: MinimalTodoPatch) => void;
  onDelete: (id: string) => void;
};

export function MinTodos({ p, todos, editingId, setEditingId, onToggle, onUpdate, onDelete }: Props) {
  const open = todos.filter((todo) => !todo.is_completed);
  const done = todos.filter((todo) => todo.is_completed);

  return (
    <View style={[styles.container, { backgroundColor: p.bg }]}>
      <View style={[styles.header, { borderBottomColor: p.line }]}>
        <Text style={[styles.kicker, { color: p.subtle }]}>
          {open.length} open · {done.length} done
        </Text>
        <Text style={[styles.title, { color: p.ink }]}>Todos</Text>
      </View>
      <ScrollView style={styles.list}>
        {open.length > 0 ? <Text style={[styles.section, { color: p.subtle }]}>Open</Text> : null}
        {open.map((todo) => (
          <MinTodoRow
            key={todo.id}
            p={p}
            todo={todo}
            editing={editingId === todo.id}
            onToggle={() => onToggle(todo.id)}
            onEdit={() => setEditingId(todo.id)}
            onCommit={() => setEditingId(null)}
            onChange={(patch) => onUpdate(todo, patch)}
            onDelete={() => onDelete(todo.id)}
          />
        ))}
        {done.length > 0 ? <Text style={[styles.section, styles.doneSection, { color: p.subtle }]}>Done</Text> : null}
        {done.map((todo) => (
          <MinTodoRow
            key={todo.id}
            p={p}
            todo={todo}
            editing={false}
            onToggle={() => onToggle(todo.id)}
            onEdit={() => undefined}
            onCommit={() => undefined}
            onChange={() => undefined}
            onDelete={() => onDelete(todo.id)}
          />
        ))}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 34,
    fontWeight: '600',
    marginTop: 6,
  },
  list: {
    flex: 1,
  },
  section: {
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 4,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  doneSection: {
    paddingTop: 20,
  },
  bottomSpacer: {
    height: 40,
  },
});
