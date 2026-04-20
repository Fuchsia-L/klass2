import React from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { addEvent, deleteEvent, updateEvent } from '../../../features/schedule/services/events.service';
import { CATEGORIES, CategoryKey } from '../../../features/schedule/types';
import type { MinimalEvent, MinimalPaletteColors } from './minimalTypes';
import { MinSheetBtn } from './parts/MinSheetBtn';

type Props = {
  p: MinimalPaletteColors;
  event: MinimalEvent | null;
  isNew: boolean;
  onClose: () => void;
};

const CATEGORY_KEYS = Object.keys(CATEGORIES) as CategoryKey[];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function formatEditableDateTime(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultStart(): Date {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(Math.min(23, Math.max(6, date.getHours() + 1)));
  return date;
}

function parseEditableDateTime(value: string): Date | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), 0, 0);
  if (
    parsed.getFullYear() !== Number(year) ||
    parsed.getMonth() !== Number(month) - 1 ||
    parsed.getDate() !== Number(day) ||
    parsed.getHours() !== Number(hour) ||
    parsed.getMinutes() !== Number(minute)
  ) {
    return null;
  }
  return parsed;
}

const CONFIRM_TIMEOUT_MS = 3000;

export function MinEventSheet({ p, event, isNew, onClose }: Props) {
  const open = event !== null || isNew;
  const isExisting = !isNew && event !== null;
  const translateY = React.useRef(new Animated.Value(1)).current;
  const [draftTitle, setDraftTitle] = React.useState('');
  const [draftStart, setDraftStart] = React.useState(() => formatEditableDateTime(defaultStart()));
  const [draftEnd, setDraftEnd] = React.useState(() => formatEditableDateTime(new Date(defaultStart().getTime() + 60 * 60000)));
  const [draftCategory, setDraftCategory] = React.useState<CategoryKey>('其他');
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
    if (event) {
      setDraftTitle(event.title);
      setDraftStart(formatEditableDateTime(new Date(event.start_time)));
      setDraftEnd(formatEditableDateTime(new Date(event.end_time)));
      setDraftCategory(event.category);
    } else {
      const start = defaultStart();
      setDraftTitle('');
      setDraftStart(formatEditableDateTime(start));
      setDraftEnd(formatEditableDateTime(new Date(start.getTime() + 60 * 60000)));
      setDraftCategory('其他');
    }
    setError('');
    setSaving(false);
    setConfirmingDelete(false);
    clearConfirmTimer();
  }, [open, event?.id, clearConfirmTimer]);

  const handleSave = async () => {
    const start = parseEditableDateTime(draftStart);
    const end = parseEditableDateTime(draftEnd);
    const title = draftTitle.trim();

    if (!title) {
      setError('Title is required');
      return;
    }
    if (!start || !end) {
      setError('Use time format YYYY-MM-DD HH:mm');
      return;
    }
    if (end.getTime() <= start.getTime()) {
      setError('End must be after start');
      return;
    }

    try {
      setSaving(true);
      const result = isExisting && event
        ? await updateEvent({
            ...event,
            title,
            category: draftCategory,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
          })
        : await addEvent({
            title,
            category: draftCategory,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            repeat: 'none',
            source: 'manual',
          });

      if (!result.success) {
        setError(result.error ?? 'Save failed');
        return;
      }
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      clearConfirmTimer();
      confirmTimerRef.current = setTimeout(() => setConfirmingDelete(false), CONFIRM_TIMEOUT_MS);
      return;
    }
    clearConfirmTimer();
    try {
      await deleteEvent(event.id);
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
            <Text style={[styles.kicker, { color: p.subtle }]}>{isExisting ? 'Edit Event' : 'New Event'}</Text>
            {isExisting ? (
              <Pressable onPress={() => void handleDelete()} testID="min-event-delete">
                <Text style={[styles.kicker, styles.deleteText, { color: confirmingDelete ? p.ink : p.subtle }]}>
                  {confirmingDelete ? 'Tap again' : 'Delete'}
                </Text>
              </Pressable>
            ) : (
              <Text style={[styles.kicker, { color: p.subtle }]}>Manual</Text>
            )}
          </View>
          <TextInput
            testID="min-event-title-input"
            value={draftTitle}
            onChangeText={setDraftTitle}
            placeholder="Title"
            placeholderTextColor={p.dim}
            style={[styles.titleInput, { color: p.ink, borderBottomColor: p.ink }]}
          />
          <View style={[styles.rows, { borderTopColor: p.ink }]}>
            <Text style={[styles.fieldLabel, { color: p.subtle }]}>Start Time</Text>
            <TextInput
              testID="min-event-start-input"
              value={draftStart}
              onChangeText={setDraftStart}
              placeholder="YYYY-MM-DD HH:mm"
              placeholderTextColor={p.dim}
              style={[styles.input, { color: p.ink, borderColor: p.line }]}
            />
            <Text style={[styles.fieldLabel, { color: p.subtle }]}>End Time</Text>
            <TextInput
              testID="min-event-end-input"
              value={draftEnd}
              onChangeText={setDraftEnd}
              placeholder="YYYY-MM-DD HH:mm"
              placeholderTextColor={p.dim}
              style={[styles.input, { color: p.ink, borderColor: p.line }]}
            />
            <Text style={[styles.fieldLabel, { color: p.subtle }]}>Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORY_KEYS.map((key) => {
                const selected = key === draftCategory;
                return (
                  <Pressable
                    key={key}
                    testID={`min-event-category-${key}`}
                    onPress={() => setDraftCategory(key)}
                    style={[
                      styles.categoryBtn,
                      {
                        borderColor: selected ? p.ink : p.line,
                        backgroundColor: selected ? p.ink : 'transparent',
                      },
                    ]}
                  >
                    <Text style={[styles.categoryText, { color: selected ? p.bg : p.ink }]}>{CATEGORIES[key].label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          {error ? <Text style={[styles.error, { color: p.accent }]}>{error}</Text> : null}
          <View style={styles.actions}>
            <MinSheetBtn p={p} label="Cancel" onPress={onClose} />
            <MinSheetBtn p={p} label={saving ? 'Saving' : 'Save'} primary flex={2} disabled={saving} testID="min-event-save" onPress={() => void handleSave()} />
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
  input: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, fontWeight: '500', fontVariant: ['tabular-nums'] },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryBtn: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 9 },
  categoryText: { fontSize: 10, letterSpacing: 1.5, fontWeight: '700', textTransform: 'uppercase' },
  error: { marginTop: 14, fontSize: 12, fontWeight: '700' },
  actions: { flexDirection: 'row', marginTop: 22 },
});
