import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { TodoItem, TodoType } from '../../../features/todo/types';
import { TODO_TYPE_LABELS } from '../../../features/todo/types';
import type { StarlightPaletteColors } from './starlightTypes';
import { StarlightTodoRow } from './parts/StarlightTodoRow';

type Props = {
  p: StarlightPaletteColors;
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

export function todoDueLabel(todo: Pick<TodoItem, 'type'>): string {
  if (todo.type === 'daily') return 'DAILY';
  if (todo.type === 'weekly') return 'WEEKLY';
  return 'LONG';
}

export function StarTodos({ p, todos, onToggle, onOpenTodo }: Props) {
  const [activeFilter, setActiveFilter] = React.useState<TodoFilter>('all');
  const filtered = activeFilter === 'all' ? todos : todos.filter((todo) => todo.type === activeFilter);
  const openCount = todos.filter((todo) => !todo.is_completed).length;
  const doneCount = todos.filter((todo) => todo.is_completed).length;
  const open = filtered.filter((todo) => !todo.is_completed);
  const done = filtered.filter((todo) => todo.is_completed);

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: p.subtle }]}>
          {openCount} open · {doneCount} done
        </Text>
        <Text style={[styles.title, { color: p.ink }]}>Wishlist</Text>
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
              testID={`starlight-todos-tab-${key}`}
              onPress={() => setActiveFilter(key)}
              style={[
                styles.tab,
                {
                  borderBottomColor: active ? p.accent : 'transparent',
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
      <ScrollView testID="starlight-todos" style={styles.list} contentContainerStyle={styles.listContent}>
        {open.length > 0 ? <Text testID="starlight-todos-open" style={[styles.section, { color: p.subtle }]}>Open</Text> : null}
        {open.map((todo) => (
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
        {done.length > 0 ? <Text testID="starlight-todos-done" style={[styles.section, styles.doneSection, { color: p.subtle }]}>Done</Text> : null}
        {done.map((todo) => (
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
        {open.length === 0 && done.length === 0 ? (
          <View style={[styles.emptyPanel, { borderColor: p.line }]}>
            <BlurView
              intensity={24}
              tint={p.dark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, { backgroundColor: p.panel }]}
            />
            <LinearGradient
              colors={[`${p.accent}1a`, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <Text style={[styles.emptyTitle, { color: p.ink }]}>Clear sky</Text>
            <Text style={[styles.emptyBody, { color: p.subtle }]}>—</Text>
          </View>
        ) : null}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 32, paddingHorizontal: 22, paddingBottom: 14 },
  kicker: { fontFamily: 'NotoSansSC-Medium', fontSize: 10, letterSpacing: 3, fontWeight: '500', textTransform: 'uppercase' },
  title: { marginTop: 6, fontFamily: 'NotoSerifSC-Regular', fontSize: 36, lineHeight: 42, letterSpacing: -0.8, fontStyle: 'italic' },
  tabRow: { flexDirection: 'row', paddingHorizontal: 22, borderBottomWidth: 1, gap: 16 },
  tab: { flexDirection: 'row', alignItems: 'baseline', gap: 6, paddingVertical: 10, borderBottomWidth: 1 },
  tabLabel: { fontFamily: 'NotoSansSC-Bold', fontSize: 10, letterSpacing: 1.8, fontWeight: '700', textTransform: 'uppercase' },
  tabCount: { fontFamily: 'NotoSansSC-Medium', fontSize: 11, fontVariant: ['tabular-nums'] },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 22, paddingBottom: 20 },
  section: { paddingTop: 12, paddingBottom: 4, fontFamily: 'NotoSansSC-SemiBold', fontSize: 10, letterSpacing: 2, fontWeight: '600', textTransform: 'uppercase' },
  doneSection: { paddingTop: 20 },
  emptyPanel: { marginTop: 18, borderWidth: 1, borderRadius: 14, padding: 18, overflow: 'hidden' },
  emptyTitle: { fontFamily: 'NotoSerifSC-SemiBold', fontSize: 22, lineHeight: 26, fontStyle: 'italic' },
  emptyBody: { marginTop: 6, fontFamily: 'NotoSansSC-Regular', fontSize: 12, lineHeight: 18 },
  bottomSpacer: { height: 40 },
});
