import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { addTodo, deleteTodo, updateTodo } from '../../../features/todo/services/todo.service';
import type { Priority, TodoItem, TodoType } from '../../../features/todo/types';
import { PRIORITY_LABELS, TODO_TYPE_LABELS } from '../../../features/todo/types';
import { StarlightSheetBtn } from './parts';
import type { StarlightPaletteColors } from './starlightTypes';
import { todoDueLabel } from './StarTodos';

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
  const visible = isNew || todo !== null;
  const [displayTodo, setDisplayTodo] = React.useState<TodoItem | null>(todo);
  const [draftTitle, setDraftTitle] = React.useState('');
  const [draftType, setDraftType] = React.useState<TodoType>('daily');
  const [draftPriority, setDraftPriority] = React.useState<Priority>('medium');
  const [draftNotes, setDraftNotes] = React.useState('');
  const [error, setError] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const confirmTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const isExisting = !isNew && displayTodo !== null;
  const cadence = displayTodo ? todoDueLabel(displayTodo) : 'Unset';

  const clearConfirmTimer = React.useCallback(() => {
    if (confirmTimerRef.current) {
      clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }
  }, []);

  React.useEffect(() => () => clearConfirmTimer(), [clearConfirmTimer]);

  React.useEffect(() => {
    if (!visible) return;
    setDisplayTodo(todo);
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
  }, [visible, todo?.id, clearConfirmTimer]);

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
      if (isExisting && displayTodo) {
        await updateTodo(displayTodo.id, input);
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
    if (!displayTodo) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      clearConfirmTimer();
      confirmTimerRef.current = setTimeout(() => setConfirmingDelete(false), CONFIRM_TIMEOUT_MS);
      return;
    }
    clearConfirmTimer();
    try {
      await deleteTodo(displayTodo.id);
      onClose();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Delete failed');
      setConfirmingDelete(false);
    }
  };

  // HTML reference uses:
  //   background: linear-gradient(180deg, rgba(40,30,70,0.72) 0%, rgba(20,14,42,0.80) 100%)
  //   backdrop-filter: blur(28px) saturate(160%)
  //   border: 1px solid rgba(255,255,255,0.08)  (dark)
  //   box-shadow: 0 -20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)
  const sheetGradient = p.dark
    ? (['rgba(40,30,70,0.72)', 'rgba(20,14,42,0.80)'] as const)
    : (['rgba(255,255,255,0.75)', 'rgba(255,255,255,0.65)'] as const);
  const sheetBorder = p.dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)';
  const glintColor = p.dark ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.9)';

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View testID="starlight-todo-sheet" style={styles.overlay}>
        <Pressable
          testID="starlight-todo-sheet-scrim"
          onPress={onClose}
          style={styles.scrim}
        >
          <BlurView
            intensity={12}
            tint={p.dark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { backgroundColor: p.sheetScrim }]}
          />
        </Pressable>
        <View
          style={[
            styles.sheet,
            {
              borderColor: sheetBorder,
              shadowColor: p.dark ? '#000000' : p.nowGlow,
            },
          ]}
        >
          {/* backdrop blur layer */}
          <BlurView
            intensity={56}
            tint={p.dark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, styles.sheetBackdrop]}
            pointerEvents="none"
          />
          {/* translucent gradient wash — matches HTML's linear-gradient(180deg,...) */}
          <LinearGradient
            colors={sheetGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[StyleSheet.absoluteFill, styles.sheetBackdrop]}
            pointerEvents="none"
          />
          {/* faint top-edge inner glint */}
          <LinearGradient
            colors={['transparent', glintColor, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.glint}
            pointerEvents="none"
          />
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.topline}>
              <Text style={[styles.kicker, { color: p.subtle }]}>
                {isExisting ? cadence : 'New · 新建'}
              </Text>
              {isExisting ? (
                <Pressable onPress={() => void handleDelete()} testID="starlight-todo-sheet-delete">
                  <Text
                    style={[
                      styles.status,
                      styles.deleteText,
                      { color: confirmingDelete ? p.accent : p.subtle },
                    ]}
                  >
                    {confirmingDelete ? 'Tap again' : 'Delete'}
                  </Text>
                </Pressable>
              ) : (
                <Text style={[styles.status, { color: p.subtle }]}>Draft</Text>
              )}
            </View>
            <TextInput
              testID="starlight-todo-sheet-title"
              value={draftTitle}
              onChangeText={setDraftTitle}
              placeholder="Draft todo"
              placeholderTextColor={p.dim}
              style={[styles.titleInput, { color: p.ink, borderBottomColor: p.line }]}
            />

            <View style={[styles.rows, { borderTopColor: p.line }]}>
              <View
                testID="starlight-todo-sheet-due"
                style={[styles.dueRow, { borderBottomColor: p.line }]}
              >
                <Text style={[styles.rowLabel, { color: p.subtle }]}>Due</Text>
                <Text style={[styles.dueValue, { color: p.ink }]}>{cadence}</Text>
              </View>
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
                      <Text
                        style={[
                          styles.choiceText,
                          { color: selected ? (p.dark ? p.bg : '#ffffff') : p.ink },
                        ]}
                      >
                        {TODO_TYPE_LABELS[key]}
                      </Text>
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
                      <Text
                        style={[
                          styles.choiceText,
                          { color: selected ? (p.dark ? p.bg : '#ffffff') : p.ink },
                        ]}
                      >
                        {PRIORITY_LABELS[key]}
                      </Text>
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
              <StarlightSheetBtn
                p={p}
                label="Close"
                onPress={onClose}
                testID="starlight-todo-sheet-close"
              />
              <StarlightSheetBtn
                p={p}
                label={saving ? 'Saving' : 'Save'}
                primary
                flex={2}
                disabled={saving}
                onPress={() => void handleSave()}
                testID="starlight-todo-sheet-save"
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    marginHorizontal: 8,
    marginBottom: 8,
    maxHeight: '88%',
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 26,
    overflow: 'hidden',
    // HTML: box-shadow: 0 -20px 60px rgba(0,0,0,0.5)
    shadowOpacity: 0.55,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: -18 },
    elevation: 24,
  },
  sheetBackdrop: {
    borderRadius: 28,
  },
  glint: {
    position: 'absolute',
    top: 0,
    left: '15%',
    right: '15%',
    height: 1,
    opacity: 0.85,
  },
  topline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  kicker: {
    flexShrink: 1,
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  status: {
    flexShrink: 0,
    fontFamily: 'Fraunces-SemiBold',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  deleteText: {
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  titleInput: {
    marginTop: 10,
    fontFamily: 'Fraunces-Regular',
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.7,
    fontStyle: 'italic',
    borderBottomWidth: 1,
    paddingVertical: 6,
  },
  rows: {
    marginTop: 20,
    paddingTop: 2,
    borderTopWidth: 1,
  },
  dueRow: {
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'baseline',
    borderBottomWidth: 1,
    gap: 12,
  },
  rowLabel: {
    width: 60,
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    letterSpacing: 1.8,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  fieldLabel: {
    marginTop: 16,
    marginBottom: 10,
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    letterSpacing: 1.8,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dueValue: {
    flex: 1,
    minWidth: 0,
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    fontWeight: '500',
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choiceBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  choiceText: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    fontWeight: '500',
    minHeight: 72,
    textAlignVertical: 'top',
  },
  error: {
    marginTop: 14,
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
});
