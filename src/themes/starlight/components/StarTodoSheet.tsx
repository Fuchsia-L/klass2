import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { addTodo, deleteTodo, updateTodo } from '../../../features/todo/services/todo.service';
import type { Priority, TodoItem, TodoType } from '../../../features/todo/types';
import { PRIORITY_LABELS, TODO_TYPE_LABELS } from '../../../features/todo/types';
import { StarlightSheetBtn } from './parts';
import type { StarlightPaletteColors } from './starlightTypes';

type Props = {
  p: StarlightPaletteColors;
  todo: TodoItem | null;
  isNew: boolean;
  onClose: () => void;
};

const TYPE_KEYS: TodoType[] = ['daily', 'weekly', 'longterm'];
const PRIORITY_KEYS: Priority[] = ['high', 'medium', 'low'];

const CONFIRM_TIMEOUT_MS = 3000;

export function StarTodoSheet({ p, todo, isNew, onClose }: Props) {
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

  // Glass-panel gradient for the sheet body, lifted from HTML reference.
  const sheetGradient = p.dark
    ? (['rgba(40,30,70,0.72)', 'rgba(20,14,42,0.80)'] as const)
    : (['rgba(255,255,255,0.75)', 'rgba(255,255,255,0.65)'] as const);
  const sheetBorder = p.dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)';
  const glintColor = p.dark ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.9)';

  return (
    <View testID="starlight-todo-sheet" pointerEvents={open ? 'auto' : 'none'} style={styles.overlay}>
      <Pressable
        testID="starlight-todo-sheet-scrim"
        onPress={onClose}
        style={[styles.scrim, { opacity: open ? 1 : 0 }]}
      >
        <BlurView intensity={12} tint={p.dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} pointerEvents="none" />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: p.sheetScrim }]} />
      </Pressable>
      <Animated.View
        style={[
          styles.sheet,
          {
            borderColor: sheetBorder,
            shadowColor: p.dark ? '#000000' : p.nowGlow,
            transform: [{ translateY: translateY.interpolate({ inputRange: [0, 1], outputRange: [0, 720] }) }],
          },
        ]}
      >
        {/* glass backdrop layers — keep the Min sheet shape, swap the flat fill for a nebula wash */}
        <BlurView
          intensity={52}
          tint={p.dark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, styles.sheetBackdrop]}
          pointerEvents="none"
        />
        <LinearGradient
          colors={sheetGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[StyleSheet.absoluteFill, styles.sheetBackdrop]}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['transparent', glintColor, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.glint}
          pointerEvents="none"
        />
        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={styles.sheetTop}>
            <Text style={[styles.kicker, { color: p.subtle }]}>{isExisting ? 'Edit Todo' : 'New Todo'}</Text>
            {isExisting ? (
              <Pressable onPress={() => void handleDelete()} testID="starlight-todo-sheet-delete">
                <Text style={[styles.kicker, styles.deleteText, { color: confirmingDelete ? p.accent : p.subtle }]}>
                  {confirmingDelete ? 'Tap again' : 'Delete'}
                </Text>
              </Pressable>
            ) : null}
          </View>
          <TextInput
            testID="starlight-todo-sheet-title"
            value={draftTitle}
            onChangeText={setDraftTitle}
            placeholder="Title"
            placeholderTextColor={p.dim}
            style={[styles.titleInput, { color: p.ink, borderBottomColor: p.line }]}
          />
          <View style={[styles.rows, { borderTopColor: p.line }]}>
            <Text style={[styles.fieldLabel, { color: p.subtle }]}>Type</Text>
            <View style={styles.choiceGrid}>
              {TYPE_KEYS.map((key) => {
                const selected = key === draftType;
                return (
                  <Pressable
                    key={key}
                    testID={`starlight-todo-type-${key}`}
                    onPress={() => setDraftType(key)}
                    style={({ pressed }) => [
                      styles.choiceBtn,
                      {
                        borderColor: selected ? p.accent : p.line,
                        backgroundColor: selected ? p.accent : 'transparent',
                        shadowColor: p.accent,
                        shadowOpacity: selected ? 0.7 : 0,
                        shadowRadius: selected ? 10 : 0,
                        shadowOffset: { width: 0, height: 0 },
                        elevation: selected ? 3 : 0,
                        opacity: pressed ? 0.85 : 1,
                        transform: [{ scale: pressed ? 0.97 : 1 }],
                      },
                    ]}
                  >
                    <Text style={[styles.choiceText, { color: selected ? (p.dark ? p.bg : '#ffffff') : p.ink }]}>{TODO_TYPE_LABELS[key]}</Text>
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
                    testID={`starlight-todo-priority-${key}`}
                    onPress={() => setDraftPriority(key)}
                    style={({ pressed }) => [
                      styles.choiceBtn,
                      {
                        borderColor: selected ? p.accent : p.line,
                        backgroundColor: selected ? p.accent : 'transparent',
                        shadowColor: p.accent,
                        shadowOpacity: selected ? 0.7 : 0,
                        shadowRadius: selected ? 10 : 0,
                        shadowOffset: { width: 0, height: 0 },
                        elevation: selected ? 3 : 0,
                        opacity: pressed ? 0.85 : 1,
                        transform: [{ scale: pressed ? 0.97 : 1 }],
                      },
                    ]}
                  >
                    <Text style={[styles.choiceText, { color: selected ? (p.dark ? p.bg : '#ffffff') : p.ink }]}>{PRIORITY_LABELS[key]}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[styles.fieldLabel, { color: p.subtle }]}>Notes</Text>
            <TextInput
              testID="starlight-todo-sheet-note"
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
            <StarlightSheetBtn p={p} label="Cancel" onPress={onClose} testID="starlight-todo-sheet-close" />
            <StarlightSheetBtn p={p} label={saving ? 'Saving' : 'Save'} primary flex={2} disabled={saving} testID="starlight-todo-sheet-save" onPress={() => void handleSave()} />
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 20 },
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  sheet: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 26,
    maxHeight: '88%',
    overflow: 'hidden',
    shadowOpacity: 0.55,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: -18 },
    elevation: 30,
  },
  sheetBackdrop: { borderRadius: 28 },
  glint: { position: 'absolute', top: 0, left: '15%', right: '15%', height: 1, opacity: 0.85 },
  sheetTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { fontFamily: 'NotoSansSC-SemiBold', fontSize: 10, letterSpacing: 2, fontWeight: '600', textTransform: 'uppercase' },
  deleteText: { letterSpacing: 1.8, opacity: 0.7 },
  titleInput: {
    marginTop: 14,
    paddingVertical: 6,
    fontFamily: 'NotoSerifSC-Regular',
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.7,
    fontStyle: 'italic',
    borderBottomWidth: 1,
  },
  rows: { marginTop: 26, borderTopWidth: 1 },
  fieldLabel: {
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'NotoSansSC-SemiBold',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choiceBtn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  choiceText: { fontFamily: 'NotoSansSC-Bold', fontSize: 10, letterSpacing: 1.5, fontWeight: '700', textTransform: 'uppercase' },
  notesInput: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontFamily: 'NotoSansSC-Medium',
    fontSize: 13,
    fontWeight: '500',
    minHeight: 72,
    textAlignVertical: 'top',
  },
  error: { marginTop: 14, fontFamily: 'NotoSansSC-Bold', fontSize: 12, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 22 },
});
