import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { TodoItem } from '../../../features/todo/types';
import type { StarlightPaletteColors } from './starlightTypes';

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
        <TodoSection
          p={p}
          title="Open"
          todos={open}
          onToggle={onToggle}
          onOpenTodo={onOpenTodo}
          testID="starlight-todos-open"
          spacingTop={0}
        />
        <TodoSection
          p={p}
          title="Done"
          todos={done}
          onToggle={onToggle}
          onOpenTodo={onOpenTodo}
          testID="starlight-todos-done"
          spacingTop={22}
        />
        {todos.length === 0 ? (
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
            <Text style={[styles.emptyBody, { color: p.subtle }]}>
              No tasks are waiting tonight.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

type SectionProps = {
  p: StarlightPaletteColors;
  title: string;
  todos: TodoItem[];
  onToggle: (id: string) => void;
  onOpenTodo: (todo: TodoItem) => void;
  testID: string;
  spacingTop: number;
};

function TodoSection({ p, title, todos, onToggle, onOpenTodo, testID, spacingTop }: SectionProps) {
  if (todos.length === 0) return null;

  return (
    <View testID={testID} style={[styles.section, { marginTop: spacingTop }]}>
      <Text style={[styles.sectionTitle, { color: p.subtle }]}>{title}</Text>
      <View style={styles.rows}>
        {todos.map((todo, index) => (
          <TodoLine
            key={todo.id}
            p={p}
            todo={todo}
            onToggle={() => onToggle(todo.id)}
            onOpen={() => onOpenTodo(todo)}
            testID={`starlight-todo-${todo.id}`}
            isLast={index === todos.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

type LineProps = {
  p: StarlightPaletteColors;
  todo: TodoItem;
  onToggle: () => void;
  onOpen: () => void;
  testID: string;
  isLast: boolean;
};

function TodoLine({ p, todo, onToggle, onOpen, testID, isLast }: LineProps) {
  const dueLabel = todoDueLabel(todo);
  const hasNote = !!(todo.notes && todo.notes.trim().length > 0);

  return (
    <Pressable
      testID={testID}
      onPress={onOpen}
      style={({ pressed }) => [
        styles.row,
        {
          borderBottomColor: p.line,
          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth > 0 ? 1 : 1,
          backgroundColor: pressed ? p.panel : 'transparent',
        },
      ]}
    >
      <Pressable
        testID="starlight-todo-toggle"
        onPress={(e) => {
          e?.stopPropagation?.();
          onToggle();
        }}
        hitSlop={8}
        style={[
          styles.check,
          {
            borderColor: p.accent,
            backgroundColor: todo.is_completed ? p.accent : 'transparent',
            shadowColor: p.accent,
            shadowOpacity: todo.is_completed ? 0.75 : 0,
            shadowRadius: todo.is_completed ? 6 : 0,
            shadowOffset: { width: 0, height: 0 },
            elevation: todo.is_completed ? 3 : 0,
          },
        ]}
      >
        <Text style={[styles.checkText, { color: p.dark ? '#06060f' : '#ffffff' }]}>
          {todo.is_completed ? '✓' : ''}
        </Text>
      </Pressable>
      <View style={styles.body}>
        <Text
          style={[
            styles.titleText,
            {
              color: todo.is_completed ? p.dim : p.ink,
              textDecorationLine: todo.is_completed ? 'line-through' : 'none',
              textDecorationColor: p.dim,
            },
          ]}
          numberOfLines={1}
        >
          {todo.title || '无标题'}
        </Text>
        {hasNote ? (
          <Text style={[styles.note, { color: p.subtle }]} numberOfLines={1}>
            {todo.notes}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.due, { color: p.subtle }]}>{dueLabel}</Text>
    </Pressable>
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
    fontFamily: 'Inter-Medium',
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
    letterSpacing: -0.8,
    fontStyle: 'italic',
  },
  counts: {
    marginTop: 6,
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  list: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 40,
  },
  section: {
    // spacingTop applied inline for top separation between Open and Done
  },
  sectionTitle: {
    marginBottom: 6,
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  rows: {
    // flat list — rows carry their own bottom hairline
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  check: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkText: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  titleText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    fontWeight: '500',
  },
  note: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    marginTop: 2,
  },
  due: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    letterSpacing: 1.2,
    flexShrink: 0,
    textTransform: 'uppercase',
  },
  emptyPanel: {
    marginTop: 18,
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    overflow: 'hidden',
  },
  emptyTitle: {
    fontFamily: 'Fraunces-SemiBold',
    fontSize: 22,
    lineHeight: 26,
    fontStyle: 'italic',
  },
  emptyBody: {
    marginTop: 6,
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 18,
  },
});
