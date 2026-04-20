import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { TodoItem } from '../../../../features/todo/types';
import type { MinimalPaletteColors, MinimalTodoPatch } from '../minimalTypes';
import { todoDueLabel } from '../minimalTypes';

type Props = {
  p: MinimalPaletteColors;
  todo: TodoItem;
  editing: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onCommit: () => void;
  onChange: (patch: MinimalTodoPatch) => void;
  onDelete: () => void;
};

export function MinTodoRow({ p, todo, editing, onToggle, onEdit, onCommit, onChange, onDelete }: Props) {
  return (
    <View style={[styles.row, { borderBottomColor: p.line, opacity: todo.is_completed ? 0.45 : 1 }]}>
      <Pressable
        onPress={onToggle}
        style={[styles.checkbox, { borderColor: p.ink, backgroundColor: todo.is_completed ? p.ink : 'transparent' }]}
      >
        <Text style={[styles.check, { color: p.bg }]}>{todo.is_completed ? '✓' : ''}</Text>
      </Pressable>
      <Pressable style={styles.body} onPress={editing ? undefined : onEdit}>
        {editing ? (
          <TextInput
            autoFocus
            value={todo.title}
            onBlur={onCommit}
            onChangeText={(title) => onChange({ title })}
            onSubmitEditing={onCommit}
            placeholder="新待办..."
            placeholderTextColor={p.dim}
            style={[styles.input, { color: p.ink, borderBottomColor: p.ink }]}
          />
        ) : (
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
        )}
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
      </Pressable>
      <Pressable onPress={onDelete} style={styles.delete}>
        <Text style={[styles.deleteText, { color: p.dim }]}>×</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 12,
    borderBottomWidth: 1,
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
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
  },
  input: {
    fontSize: 15,
    fontWeight: '500',
    width: '100%',
    borderBottomWidth: 1,
    paddingBottom: 3,
    paddingTop: 0,
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
  delete: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  deleteText: {
    fontSize: 12,
  },
});
