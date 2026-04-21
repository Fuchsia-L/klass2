import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { StarlightPaletteColors } from '../starlightTypes';

export type StarlightTodoItem = {
  id: string;
  title: string;
  dueLabel: string;
  note?: string;
  done: boolean;
};

type Props = {
  p: StarlightPaletteColors;
  todo: StarlightTodoItem;
  onToggle: () => void;
  onOpen: () => void;
  testID?: string;
};

export function StarlightTodoRow({ p, todo, onToggle, onOpen, testID }: Props) {
  return (
    <Pressable
      testID={testID}
      onPress={onOpen}
      style={({ pressed }) => [
        styles.row,
        {
          borderBottomColor: p.line,
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
        style={[
          styles.check,
          {
            borderColor: p.accent,
            backgroundColor: todo.done ? p.accent : 'transparent',
          },
        ]}
      >
        <Text style={[styles.checkText, { color: p.dark ? p.bg : '#ffffff' }]}>{todo.done ? '✓' : ''}</Text>
      </Pressable>
      <View style={styles.body}>
        <Text
          style={[
            styles.title,
            {
              color: todo.done ? p.dim : p.ink,
              textDecorationLine: todo.done ? 'line-through' : 'none',
              textDecorationColor: p.dim,
            },
          ]}
          numberOfLines={1}
        >
          {todo.title || '无标题'}
        </Text>
        {todo.note ? (
          <Text style={[styles.note, { color: p.subtle }]} numberOfLines={1}>
            {todo.note}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.due, { color: p.subtle }]}>{todo.dueLabel}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  title: {
    fontSize: 14,
    fontWeight: '500',
  },
  note: {
    fontSize: 11,
    marginTop: 2,
  },
  due: {
    fontSize: 10,
    letterSpacing: 0.5,
    flexShrink: 0,
  },
});
