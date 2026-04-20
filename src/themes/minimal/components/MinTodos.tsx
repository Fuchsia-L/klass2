import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { TodoItem, TodoType } from '../../../features/todo/types';
import { TODO_TYPE_LABELS } from '../../../features/todo/types';
import type { MinimalPaletteColors } from './minimalTypes';
import { MinTodoRow } from './parts/MinTodoRow';

type Props = {
  p: MinimalPaletteColors;
  todos: TodoItem[];
  onToggle: (id: string) => void;
  onOpenTodo: (todo: TodoItem) => void;
};

type TodoFilter = TodoType | 'all';
const FILTER_KEYS: TodoFilter[] = ['all', 'daily', 'weekly', 'longterm'];
const FILTER_LABELS: Record<TodoFilter, string> = {
  all: 'ALL',
  daily: TODO_TYPE_LABELS.daily,
  weekly: TODO_TYPE_LABELS.weekly,
  longterm: TODO_TYPE_LABELS.longterm,
};

export function MinTodos({ p, todos, onToggle, onOpenTodo }: Props) {
  const [activeFilter, setActiveFilter] = React.useState<TodoFilter>('all');
  const filtered = activeFilter === 'all' ? todos : todos.filter((todo) => todo.type === activeFilter);
  const openCount = todos.filter((todo) => !todo.is_completed).length;
  const doneCount = todos.filter((todo) => todo.is_completed).length;
  const open = filtered.filter((todo) => !todo.is_completed);
  const done = filtered.filter((todo) => todo.is_completed);

  return (
    <View style={[styles.container, { backgroundColor: p.bg }]}>
      <View style={[styles.header, { borderBottomColor: p.line }]}>
        <Text style={[styles.kicker, { color: p.subtle }]}>
          {openCount} open · {doneCount} done
        </Text>
        <Text style={[styles.title, { color: p.ink }]}>Todos</Text>
      </View>
      <View style={[styles.tabRow, { borderBottomColor: p.line }]}>
        {FILTER_KEYS.map((key) => {
          const active = key === activeFilter;
          const count = key === 'all'
            ? openCount
            : todos.filter((todo) => todo.type === key && !todo.is_completed).length;
          return (
            <Pressable
              key={key}
              testID={`min-todos-tab-${key}`}
              onPress={() => setActiveFilter(key)}
              style={[
                styles.tab,
                {
                  borderBottomColor: active ? p.ink : 'transparent',
                },
              ]}
            >
              <Text style={[styles.tabLabel, { color: active ? p.ink : p.dim }]}>
                {FILTER_LABELS[key]}
              </Text>
              <Text style={[styles.tabCount, { color: active ? p.ink : p.dim }]}>
                {count}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <ScrollView style={styles.list}>
        {open.length > 0 ? <Text style={[styles.section, { color: p.subtle }]}>Open</Text> : null}
        {open.map((todo) => (
          <MinTodoRow
            key={todo.id}
            p={p}
            todo={todo}
            onToggle={() => onToggle(todo.id)}
            onOpen={() => onOpenTodo(todo)}
          />
        ))}
        {done.length > 0 ? <Text style={[styles.section, styles.doneSection, { color: p.subtle }]}>Done</Text> : null}
        {done.map((todo) => (
          <MinTodoRow
            key={todo.id}
            p={p}
            todo={todo}
            onToggle={() => onToggle(todo.id)}
            onOpen={() => onOpenTodo(todo)}
          />
        ))}
        {open.length === 0 && done.length === 0 ? (
          <Text style={[styles.empty, { color: p.dim }]}>—</Text>
        ) : null}
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
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    gap: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 1.8,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  tabCount: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
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
  empty: {
    paddingTop: 40,
    textAlign: 'center',
    fontSize: 14,
  },
  bottomSpacer: {
    height: 40,
  },
});
