import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { addEvent, deleteEvent, updateEvent } from '../../../features/schedule/services/events.service';
import { CATEGORIES, CategoryKey } from '../../../features/schedule/types';
import { StarlightSheetBtn } from './parts';
import type { StarlightEvent, StarlightPaletteColors } from './starlightTypes';

type Props = {
  p: StarlightPaletteColors;
  event: StarlightEvent | null;
  isNew: boolean;
  onClose: () => void;
};

const CATEGORY_KEYS = Object.keys(CATEGORIES) as CategoryKey[];

// Hard-coded rgba that aren't in the palette — HTML prototype glass tokens.
const GLASS_DARK_TOP = 'rgba(40,30,70,0.72)';
const GLASS_DARK_BOTTOM = 'rgba(20,14,42,0.80)';
const GLASS_LIGHT_TOP = 'rgba(255,255,255,0.75)';
const GLASS_LIGHT_BOTTOM = 'rgba(255,255,255,0.65)';
const GLINT_DARK = 'rgba(255,255,255,0.28)';
const GLINT_LIGHT = 'rgba(255,255,255,0.92)';
const SHADOW_DARK_OUTER = '#000000';
const SHADOW_LIGHT_OUTER = '#2c1f48';
const ACCENT_INK_DARK = '#06060f';
const BORDER_DARK = 'rgba(255,255,255,0.08)';
const BORDER_LIGHT = 'rgba(255,255,255,0.6)';
const INNER_HAIRLINE_DARK = 'rgba(255,255,255,0.06)';
const INNER_HAIRLINE_LIGHT = 'rgba(255,255,255,0.75)';
const INPUT_TINT_DARK = 'rgba(255,255,255,0.03)';
const INPUT_TINT_LIGHT = 'rgba(255,255,255,0.55)';

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

export function StarEventSheet({ p, event, isNew, onClose }: Props) {
  const open = event !== null || isNew;
  const isExisting = !isNew && event !== null;
  const translateY = React.useRef(new Animated.Value(1)).current;
  const [draftTitle, setDraftTitle] = React.useState('');
  const [draftStart, setDraftStart] = React.useState(() => formatEditableDateTime(defaultStart()));
  const [draftEnd, setDraftEnd] = React.useState(() => formatEditableDateTime(new Date(defaultStart().getTime() + 60 * 60000)));
  const [draftCategory, setDraftCategory] = React.useState<CategoryKey>('其他');
  const [draftLocation, setDraftLocation] = React.useState('');
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
      setDraftLocation(event.location ?? '');
    } else {
      const start = defaultStart();
      setDraftTitle('');
      setDraftStart(formatEditableDateTime(start));
      setDraftEnd(formatEditableDateTime(new Date(start.getTime() + 60 * 60000)));
      setDraftCategory('其他');
      setDraftLocation('');
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

    const location = draftLocation.trim() || undefined;
    try {
      setSaving(true);
      const result = isExisting && event
        ? await updateEvent({
            ...event,
            title,
            category: draftCategory,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            location,
          })
        : await addEvent({
            title,
            category: draftCategory,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            location,
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

  const glassTop = p.dark ? GLASS_DARK_TOP : GLASS_LIGHT_TOP;
  const glassBottom = p.dark ? GLASS_DARK_BOTTOM : GLASS_LIGHT_BOTTOM;
  const glintColor = p.dark ? GLINT_DARK : GLINT_LIGHT;
  const borderColor = p.dark ? BORDER_DARK : BORDER_LIGHT;
  const outerShadowColor = p.dark ? SHADOW_DARK_OUTER : SHADOW_LIGHT_OUTER;
  const innerHairlineColor = p.dark ? INNER_HAIRLINE_DARK : INNER_HAIRLINE_LIGHT;
  const inputTint = p.dark ? INPUT_TINT_DARK : INPUT_TINT_LIGHT;

  return (
    <View testID="starlight-event-sheet" pointerEvents={open ? 'auto' : 'none'} style={styles.overlay}>
      <Pressable testID="starlight-event-sheet-scrim" onPress={onClose} style={[styles.scrim, { opacity: open ? 1 : 0 }]}>
        <BlurView intensity={12} tint={p.dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} pointerEvents="none" />
        <View style={[styles.scrimTint, { backgroundColor: p.sheetScrim }]} />
      </Pressable>
      <Animated.View
        style={[
          styles.sheet,
          {
            borderColor,
            shadowColor: outerShadowColor,
            shadowOpacity: p.dark ? 0.5 : 0.28,
            transform: [{ translateY: translateY.interpolate({ inputRange: [0, 1], outputRange: [0, 720] }) }],
          },
        ]}
      >
        {/* Frosted glass backdrop */}
        <BlurView
          intensity={52}
          tint={p.dark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {/* Vertical gradient tint on top of blur */}
        <LinearGradient
          colors={[glassTop, glassBottom]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {/* Top edge glint */}
        <LinearGradient
          colors={['transparent', glintColor, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.glint}
          pointerEvents="none"
        />
        {/* Inner hairline highlight */}
        <View pointerEvents="none" style={[styles.innerHairline, { backgroundColor: innerHairlineColor }]} />

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheetContent}>
          <View style={styles.sheetTop}>
            <Text style={[styles.kicker, { color: p.subtle }]}>{isExisting ? 'Edit Event' : 'New Event'}</Text>
            {isExisting ? (
              <Pressable onPress={() => void handleDelete()} testID="starlight-event-delete">
                <Text style={[styles.kicker, styles.deleteText, { color: confirmingDelete ? p.accent : p.subtle }]}>
                  {confirmingDelete ? 'Tap again' : 'Delete'}
                </Text>
              </Pressable>
            ) : (
              <Text style={[styles.kicker, { color: p.subtle }]}>Manual</Text>
            )}
          </View>
          <TextInput
            testID="starlight-event-title-input"
            value={draftTitle}
            onChangeText={setDraftTitle}
            placeholder="Title"
            placeholderTextColor={p.dim}
            style={[styles.titleInput, { color: p.ink, borderBottomColor: p.line }]}
          />
          <View style={[styles.rows, { borderTopColor: p.line }]}>
            <Text style={[styles.fieldLabel, { color: p.subtle }]}>Start Time</Text>
            <TextInput
              testID="starlight-event-start-input"
              value={draftStart}
              onChangeText={setDraftStart}
              placeholder="YYYY-MM-DD HH:mm"
              placeholderTextColor={p.dim}
              style={[styles.input, { color: p.ink, borderColor: p.line, backgroundColor: inputTint }]}
            />
            <Text style={[styles.fieldLabel, { color: p.subtle }]}>End Time</Text>
            <TextInput
              testID="starlight-event-end-input"
              value={draftEnd}
              onChangeText={setDraftEnd}
              placeholder="YYYY-MM-DD HH:mm"
              placeholderTextColor={p.dim}
              style={[styles.input, { color: p.ink, borderColor: p.line, backgroundColor: inputTint }]}
            />
            <Text style={[styles.fieldLabel, { color: p.subtle }]}>Location</Text>
            <TextInput
              testID="starlight-event-location-input"
              value={draftLocation}
              onChangeText={setDraftLocation}
              placeholder="Optional"
              placeholderTextColor={p.dim}
              style={[styles.input, { color: p.ink, borderColor: p.line, backgroundColor: inputTint }]}
            />
            <Text style={[styles.fieldLabel, { color: p.subtle }]}>Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORY_KEYS.map((key) => {
                const selected = key === draftCategory;
                return (
                  <Pressable
                    key={key}
                    testID={`starlight-event-category-${key}`}
                    onPress={() => setDraftCategory(key)}
                    style={[
                      styles.categoryBtn,
                      {
                        borderColor: selected ? p.accent : p.line,
                        backgroundColor: selected ? p.accent : 'transparent',
                        shadowColor: p.nowGlow,
                        shadowOpacity: selected ? 0.9 : 0,
                        shadowRadius: 10,
                        shadowOffset: { width: 0, height: 0 },
                        elevation: selected ? 4 : 0,
                      },
                    ]}
                  >
                    <Text style={[styles.categoryText, { color: selected ? (p.dark ? ACCENT_INK_DARK : '#ffffff') : p.ink }]}>
                      {CATEGORIES[key].label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          {error ? <Text style={[styles.error, { color: p.accent }]}>{error}</Text> : null}
          <View style={styles.actions}>
            <StarlightSheetBtn p={p} label="Cancel" onPress={onClose} />
            <StarlightSheetBtn
              p={p}
              label={saving ? 'Saving' : 'Save'}
              primary
              flex={2}
              disabled={saving}
              testID="starlight-event-save"
              onPress={() => void handleSave()}
            />
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 20 },
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  scrimTint: { ...StyleSheet.absoluteFillObject },
  sheet: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    borderWidth: 1,
    borderRadius: 28,
    paddingBottom: 0,
    maxHeight: '88%',
    overflow: 'hidden',
    shadowRadius: 60,
    shadowOffset: { width: 0, height: -20 },
    elevation: 30,
  },
  sheetContent: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 28,
  },
  glint: { position: 'absolute', top: 0, left: '15%', right: '15%', height: 1 },
  innerHairline: { position: 'absolute', top: 1, left: 0, right: 0, height: 1, opacity: 0.5 },
  sheetTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: {
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: 'NotoSansSC-SemiBold',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  deleteText: { letterSpacing: 1.8, opacity: 0.8 },
  titleInput: {
    fontSize: 32,
    marginTop: 14,
    lineHeight: 38,
    letterSpacing: -0.7,
    fontFamily: 'NotoSerifSC-Regular',
    fontStyle: 'italic',
    borderBottomWidth: 1,
    paddingVertical: 6,
  },
  rows: { marginTop: 22, paddingTop: 14, borderTopWidth: 1 },
  fieldLabel: {
    fontSize: 10,
    letterSpacing: 1.8,
    fontFamily: 'NotoSansSC-SemiBold',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 13,
    fontFamily: 'NotoSansSC-Medium',
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  categoryBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  categoryText: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontFamily: 'NotoSansSC-Bold',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  error: {
    marginTop: 14,
    fontSize: 12,
    fontFamily: 'NotoSansSC-Bold',
    fontWeight: '700',
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 22 },
});
