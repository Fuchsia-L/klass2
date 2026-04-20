import React from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { addTodo, deleteTodo, updateTodo } from '../../../features/todo/services/todo.service';
import type { Priority, TodoItem, TodoType } from '../../../features/todo/types';
import { PRIORITY_LABELS, TODO_TYPE_LABELS } from '../../../features/todo/types';
import type { MinimalPaletteColors } from './minimalTypes';
import { MinSheetBtn } from './parts/MinSheetBtn';

type Props = {
  p: MinimalPaletteColors;
  todo: TodoItem | null;
  isNew: boolean;
  onClose: () => void;
};

const TYPE_KEYS: TodoType[] = ['daily', 'weekly', 'longterm'];
const PRIORITY_KEYS: Priority[] = ['high', 'medium', 'low'];

const CONFIRM_TIMEOUT_MS = 3000;

export function MinTodoSheet({ p, todo, isNew, onClose }: Props) {
  const open = todo !== null || isNew;
  const isExisting = !isNew && todo !== null;
  const translateY = React.useRef(new Animated.Value(1)).current;
  const [draftTitle, setDraftTitle] = React.useState('');
  const [draftType, setDraftType] = React.useState<TodoType>('daily');
  const [draftPriority, setDraftPriority] = React.useState<Priority>('medium');
  const [draftNotes, setDraftNotes] = React.useState('');
  const [error, setError] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const confirmTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearConfirmTimer = React.useCallback(() => {
    if (confirmTimerRef.current) {
      clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }
  }, []);

  React.useEffect(() => () => clearConfirmTimer(), [clearConfirmTimer]);

  React.useEffect(() => {
    Animated.timing(translateY, {
      toValue: open ? 0 : 1,
      duration: 260,
      easing: Easing.bezier(0.22, 0.9, 0.3, 1),
      useNativeDriver: true,
    }).start();
  }, [open, translateY]);

  React.useEffect(() => {
    if (!open) return;
    if (todo) {
      setDraftTitle(todo.title);
      setDraftType(todo.type);
      setDraftPriority(todo.priority);
      setDraftNotes(todo.notes ?? '');
    } else {
      setDraftTitle('');
      setDraftType('daily');
      setDraftPriority('medium');
      setDraftNotes('');
    }
    setError('');
    setSaving(false);
    setConfirmingDelete(false);
    clearConfirmTimer();
  }, [open, todo?.id, clearConfirmTimer]);

  const handleSave = async () => {
    const title = draftTitle.trim();
    if (!title) {
      setError('Title is required');
      return;
    }
    try {
      setSaving(true);
      const input = {
        title,
        type: draftType,
        priority: draftPriority,
        notes: draftNotes.trim() || undefined,
      };
      if (isExisting && todo) {
        await updateTodo(todo.id, input);
      } else {
        await addTodo(input);
      }
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!todo) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      clearConfirmTimer();
      confirmTimerRef.current = setTimeout(() => setConfirmingDelete(false), CONFIRM_TIMEOUT_MS);
      return;
    }
    clearConfirmTimer();
    try {
      await deleteTodo(todo.id);
      onClose();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Delete failed');
      setConfirmingDelete(false);
    }
  };

  return (
    <View pointerEvents={open ? 'auto' : 'none'} style={styles.overlay}>
      <Pressable onPress={onClose} style={[styles.scrim, { backgroundColor: p.sheetScrim, opacity: open ? 1 : 0 }]} />
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: p.bg,
            borderTopColor: p.ink,
            transform: [{ translateY: translateY.interpolate({ inputRange: [0, 1], outputRange: [0, 720] }) }],
          },
        ]}
      >
        <ScrollView>
          <View style={styles.sheetTop}>
            <Text style={[styles.kicker, { color: p.subtle }]}>{isExisting ? 'Edit Todo' : 'New Todo'}</Text>
            {isExisting ? (
              <Pressable onPress={() => void handleDelete()} testID="min-todo-delete">
                <Text style={[styles.kicker, styles.deleteText, { color: confirmingDelete ? p.ink : p.subtle }]}>
                  {confirmingDelete ? 'Tap again' : 'Delete'}
                </Text>
              </Pressable>
            ) : null}
          </View>
          <TextInput
            testID="min-todo-title-input"
            value={draftTitle}
            onChangeText={setDraftTitle}
            placeholder="Title"
            placeholderTextColor={p.dim}
            style={[styles.titleInput, { color: p.ink, borderBottomColor: p.ink }]}
          />
          <View style={[styles.rows, { borderTopColor: p.ink }]}>
            <Text style={[styles.fieldLabel, { color: p.subtle }]}>Type</Text>
            <View style={styles.choiceGrid}>
              {TYPE_KEYS.map((key) => {
                const selected = key === draftType;
                return (
                  <Pressable
                    key={key}
                    testID={`min-todo-type-${key}`}
                    onPress={() => setDraftType(key)}
                    style={[
                      styles.choiceBtn,
                      {
                        borderColor: selected ? p.ink : p.line,
                        backgroundColor: selected ? p.ink : 'transparent',
                      },
                    ]}
                  >
                    <Text style={[styles.choiceText, { color: selected ? p.bg : p.ink }]}>{TODO_TYPE_LABELS[key]}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[styles.fieldLabel, { color: p.subtle }]}>Priority</Text>
            <View style={styles.choiceGrid}>
              {PRIORITY_KEYS.map((key) => {
                const selected = key === draftPriority;
                return (
                  <Pressable
                    key={key}
                    testID={`min-todo-priority-${key}`}
                    onPress={() => setDraftPriority(key)}
                    style={[
                      styles.choiceBtn,
                      {
                        borderColor: selected ? p.ink : p.line,
                        backgroundColor: selected ? p.ink : 'transparent',
                      },
                    ]}
                  >
                    <Text style={[styles.choiceText, { color: selected ? p.bg : p.ink }]}>{PRIORITY_LABELS[key]}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[styles.fieldLabel, { color: p.subtle }]}>Notes</Text>
            <TextInput
              testID="min-todo-notes-input"
              value={draftNotes}
              onChangeText={setDraftNotes}
              placeholder="Optional"
              placeholderTextColor={p.dim}
              multiline
              numberOfLines={3}
              style={[styles.notesInput, { color: p.ink, borderColor: p.line }]}
            />
          </View>
          {error ? <Text style={[styles.error, { color: p.accent }]}>{error}</Text> : null}
          <View style={styles.actions}>
            <MinSheetBtn p={p} label="Cancel" onPress={onClose} />
            <MinSheetBtn p={p} label={saving ? 'Saving' : 'Save'} primary flex={2} disabled={saving} testID="min-todo-save" onPress={() => void handleSave()} />
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 20 },
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: 2, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28, maxHeight: '82%' },
  sheetTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { fontSize: 10, letterSpacing: 2, fontWeight: '600', textTransform: 'uppercase' },
  deleteText: { letterSpacing: 1.8, opacity: 0.7 },
  titleInput: { fontSize: 34, fontWeight: '600', marginTop: 14, lineHeight: 39, borderBottomWidth: 1, paddingVertical: 6 },
  rows: { marginTop: 26, borderTopWidth: 1 },
  fieldLabel: { fontSize: 10, letterSpacing: 2, fontWeight: '600', textTransform: 'uppercase', marginTop: 16, marginBottom: 8 },
  choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choiceBtn: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  choiceText: { fontSize: 10, letterSpacing: 1.5, fontWeight: '700', textTransform: 'uppercase' },
  notesInput: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 11, fontSize: 13, fontWeight: '500', minHeight: 72, textAlignVertical: 'top' },
  error: { marginTop: 14, fontSize: 12, fontWeight: '700' },
  actions: { flexDirection: 'row', marginTop: 22 },
});
