import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Priority, TodoItem } from '../../../../features/todo/types';
import type { MinimalPaletteColors } from '../minimalTypes';
import { todoDueLabel } from '../minimalTypes';

type Props = {
  p: MinimalPaletteColors;
  todo: TodoItem;
  onToggle: () => void;
  onOpen: () => void;
};

const PRIORITY_GLYPH: Record<Priority, string> = {
  high: '●',
  medium: '◐',
  low: '○',
};

export function MinTodoRow({ p, todo, onToggle, onOpen }: Props) {
  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [
        styles.row,
        {
          borderBottomColor: p.line,
          opacity: todo.is_completed ? 0.45 : 1,
          backgroundColor: pressed ? p.panel : 'transparent',
        },
      ]}
    >
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        style={[styles.checkbox, { borderColor: p.ink, backgroundColor: todo.is_completed ? p.ink : 'transparent' }]}
      >
        <Text style={[styles.check, { color: p.bg }]}>{todo.is_completed ? '✓' : ''}</Text>
      </Pressable>
      <Text style={[styles.priority, { color: p.ink }]}>{PRIORITY_GLYPH[todo.priority]}</Text>
      <View style={styles.body}>
        <Text
          style={[
            styles.title,
            {
              color: todo.title ? p.ink : p.dim,
              fontStyle: todo.title ? 'normal' : 'italic',
              textDecorationLine: todo.is_completed ? 'line-through' : 'none',
            },
          ]}
          numberOfLines={1}
        >
          {todo.title || '无标题'}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.due, { color: p.subtle }]}>{todoDueLabel(todo)}</Text>
          {todo.notes ? (
            <>
              <Text style={[styles.sep, { color: p.subtle }]}>·</Text>
              <Text style={[styles.note, { color: p.subtle }]} numberOfLines={1}>
                {todo.notes}
              </Text>
            </>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 12,
    borderBottomWidth: 1,
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 16,
    height: 16,
    marginTop: 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
  },
  priority: {
    fontSize: 12,
    lineHeight: 18,
    width: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  due: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  sep: {
    opacity: 0.4,
    fontSize: 11,
  },
  note: {
    flex: 1,
    fontSize: 11,
    fontStyle: 'italic',
  },
});
