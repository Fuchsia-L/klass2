import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { addEvent, deleteEvent, updateEvent } from '../../../features/schedule/services/events.service';
import { CATEGORIES, type CategoryKey, type ScheduleEvent } from '../../../features/schedule/types';
import { StarlightSheetBtn } from './parts';
import type { StarlightPaletteColors } from './starlightTypes';

type Props = {
  p: StarlightPaletteColors;
  event: ScheduleEvent | null;
  isNew?: boolean;
  visible?: boolean;
  onClose: () => void;
  onSave?: (payload: StarEventSheetPayload) => void | Promise<void>;
};

export type StarEventSheetPayload = Omit<ScheduleEvent, 'id'> & { id?: string };

const CATEGORY_KEYS = Object.keys(CATEGORIES) as CategoryKey[];
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// Hard-coded hex that don't exist in palette — align to HTML prototype's glass gradient stops
// and the dark accent text color the HTML uses when primary button is pressed.
const GLASS_DARK_TOP = 'rgba(40,30,70,0.72)';
const GLASS_DARK_BOTTOM = 'rgba(20,14,42,0.80)';
const GLASS_LIGHT_TOP = 'rgba(255,255,255,0.78)';
const GLASS_LIGHT_BOTTOM = 'rgba(255,255,255,0.62)';
const GLINT_DARK = 'rgba(255,255,255,0.28)';
const GLINT_LIGHT = 'rgba(255,255,255,0.92)';
const SHADOW_DARK_OUTER = '#000000';
const SHADOW_LIGHT_OUTER = '#2c1f48';
const ACCENT_INK_DARK = '#06060f';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function defaultStart(): Date {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(Math.min(23, Math.max(6, date.getHours() + 1)));
  return date;
}

function formatEditableDateTime(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
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

function formatTime(dateTime: string): string {
  const parsed = parseEditableDateTime(dateTime);
  if (!parsed) return '--:--';
  return `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}

function isoWeek(date: Date): number {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  return Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function badgeFor(dateTime: string): string {
  const parsed = parseEditableDateTime(dateTime);
  if (!parsed) return 'WEEK -- · DAY --';
  return `WEEK ${isoWeek(parsed)} · ${WEEKDAYS[parsed.getDay()]}`;
}

export function StarEventSheet({ p, event, isNew, visible, onClose, onSave }: Props) {
  const effectiveVisible = visible ?? (isNew === true || event !== null);
  const effectiveIsNew = isNew ?? (visible === true && event === null);
  const [draftTitle, setDraftTitle] = React.useState('');
  const [draftStart, setDraftStart] = React.useState(() => formatEditableDateTime(defaultStart()));
  const [draftEnd, setDraftEnd] = React.useState(() => formatEditableDateTime(new Date(defaultStart().getTime() + 60 * 60000)));
  const [draftCategory, setDraftCategory] = React.useState<CategoryKey>('其他');
  const [draftLocation, setDraftLocation] = React.useState('');
  const [draftNotes, setDraftNotes] = React.useState('');
  const [error, setError] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const categoryLabel = CATEGORIES[draftCategory]?.label ?? CATEGORIES['其他'].label;

  React.useEffect(() => {
    if (!effectiveVisible) return;
    if (event) {
      setDraftTitle(event.title);
      setDraftStart(formatEditableDateTime(new Date(event.start_time)));
      setDraftEnd(formatEditableDateTime(new Date(event.end_time)));
      setDraftCategory(event.category);
      setDraftLocation(event.location ?? '');
      setDraftNotes(event.notes ?? '');
    } else {
      const start = defaultStart();
      setDraftTitle('');
      setDraftStart(formatEditableDateTime(start));
      setDraftEnd(formatEditableDateTime(new Date(start.getTime() + 60 * 60000)));
      setDraftCategory('工作');
      setDraftLocation('');
      setDraftNotes('');
    }
    setError('');
    setSaving(false);
  }, [effectiveVisible, event?.id]);

  const handleSave = async () => {
    const title = draftTitle.trim();
    const start = parseEditableDateTime(draftStart);
    const end = parseEditableDateTime(draftEnd);

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
    const notes = draftNotes.trim() || undefined;

    try {
      setSaving(true);
      if (onSave) {
        await onSave({
          id: event?.id,
          title,
          category: draftCategory,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          repeat: event?.repeat ?? 'none',
          repeat_until: event?.repeat_until,
          location,
          reminder_minutes: event?.reminder_minutes,
          notes,
          source: event?.source ?? 'manual',
          is_completed: event?.is_completed ?? false,
        });
      } else {
        const result = event && !effectiveIsNew
          ? await updateEvent({
              ...event,
              title,
              category: draftCategory,
              start_time: start.toISOString(),
              end_time: end.toISOString(),
              location,
              notes,
            })
          : await addEvent({
              title,
              category: draftCategory,
              start_time: start.toISOString(),
              end_time: end.toISOString(),
              location,
              notes,
              repeat: 'none',
              source: 'manual',
            });
        if (!result.success) {
          setError(result.error ?? 'Save failed');
          return;
        }
      }
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const glassTop = p.dark ? GLASS_DARK_TOP : GLASS_LIGHT_TOP;
  const glassBottom = p.dark ? GLASS_DARK_BOTTOM : GLASS_LIGHT_BOTTOM;
  const glintColor = p.dark ? GLINT_DARK : GLINT_LIGHT;
  const borderColor = p.dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)';
  const outerShadowColor = p.dark ? SHADOW_DARK_OUTER : SHADOW_LIGHT_OUTER;

  return (
    <Modal transparent visible={effectiveVisible} animationType="fade" onRequestClose={onClose}>
      <View testID="starlight-event-sheet" style={styles.overlay}>
        {/* Scrim — blurred behind, tinted */}
        <Pressable testID="starlight-event-sheet-scrim" onPress={onClose} style={styles.scrimPressable}>
          <BlurView intensity={12} tint={p.dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={[styles.scrimTint, { backgroundColor: p.sheetScrim }]} />
        </Pressable>

        {/* Glass sheet container — shadow layer */}
        <View
          style={[
            styles.sheetShadow,
            {
              shadowColor: outerShadowColor,
              shadowOpacity: p.dark ? 0.5 : 0.28,
            },
          ]}
        >
          <View
            style={[
              styles.sheet,
              {
                borderColor,
              },
            ]}
          >
            {/* Frosted glass backdrop */}
            <BlurView
              intensity={Platform.OS === 'ios' ? 56 : 72}
              tint={p.dark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
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
            {/* Inner hairline highlight bottom-up to fake inset shadow */}
            <View pointerEvents="none" style={[styles.innerHairline, { backgroundColor: p.dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.75)' }]} />

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheetContent}>
              <View style={styles.topline}>
                <Text style={[styles.kicker, { color: p.subtle }]}>{effectiveIsNew ? 'New · 新建' : categoryLabel}</Text>
                <Text testID="starlight-event-sheet-time-range" style={[styles.status, { color: p.subtle }]}>
                  {formatTime(draftStart)} - {formatTime(draftEnd)}
                </Text>
              </View>
              <Text testID="starlight-event-sheet-badge" style={[styles.badge, { color: p.accent }]}>
                {badgeFor(draftStart)}
              </Text>
              <TextInput
                testID="starlight-event-sheet-title"
                value={draftTitle}
                onChangeText={setDraftTitle}
                placeholder={effectiveIsNew ? 'Draft event' : 'Event title'}
                placeholderTextColor={p.dim}
                style={[styles.titleInput, { color: p.ink, borderBottomColor: p.line }]}
              />

              <View style={[styles.rows, { borderTopColor: p.line }]}>
                <Text style={[styles.fieldLabel, { color: p.subtle }]}>Start</Text>
                <TextInput
                  testID="starlight-event-sheet-start"
                  value={draftStart}
                  onChangeText={setDraftStart}
                  placeholder="YYYY-MM-DD HH:mm"
                  placeholderTextColor={p.dim}
                  style={[styles.input, { color: p.ink, borderColor: p.line, backgroundColor: p.dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.55)' }]}
                />
                <Text style={[styles.fieldLabel, { color: p.subtle }]}>End</Text>
                <TextInput
                  testID="starlight-event-sheet-end"
                  value={draftEnd}
                  onChangeText={setDraftEnd}
                  placeholder="YYYY-MM-DD HH:mm"
                  placeholderTextColor={p.dim}
                  style={[styles.input, { color: p.ink, borderColor: p.line, backgroundColor: p.dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.55)' }]}
                />
                <View testID="starlight-event-sheet-location-row" style={[styles.detailRow, { borderBottomColor: p.line }]}>
                  <Text style={[styles.rowLabel, { color: p.subtle }]}>Location</Text>
                  <TextInput
                    testID="starlight-event-sheet-location"
                    value={draftLocation}
                    onChangeText={setDraftLocation}
                    placeholder="—"
                    placeholderTextColor={p.dim}
                    style={[styles.rowInput, { color: p.ink }]}
                  />
                </View>
                <View testID="starlight-event-sheet-category-row" style={[styles.detailRow, { borderBottomColor: p.line }]}>
                  <Text style={[styles.rowLabel, { color: p.subtle }]}>Category</Text>
                  <Text style={[styles.rowValue, { color: p.ink }]}>{categoryLabel}</Text>
                </View>
                <View style={styles.choiceGrid}>
                  {CATEGORY_KEYS.map((key) => {
                    const selected = key === draftCategory;
                    return (
                      <Pressable
                        key={key}
                        testID={`starlight-event-category-${key}`}
                        onPress={() => setDraftCategory(key)}
                        style={[
                          styles.choiceBtn,
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
                        <Text style={[styles.choiceText, { color: selected ? (p.dark ? ACCENT_INK_DARK : '#ffffff') : p.ink }]}>
                          {CATEGORIES[key].label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View testID="starlight-event-sheet-note-row" style={styles.noteBlock}>
                  <Text style={[styles.fieldLabel, { color: p.subtle }]}>Note</Text>
                  <TextInput
                    testID="starlight-event-sheet-note"
                    value={draftNotes}
                    onChangeText={setDraftNotes}
                    placeholder="—"
                    placeholderTextColor={p.dim}
                    multiline
                    numberOfLines={3}
                    style={[styles.notesInput, { color: p.ink, borderColor: p.line, backgroundColor: p.dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.55)' }]}
                  />
                </View>
              </View>

              {error ? <Text style={[styles.error, { color: p.accent }]}>{error}</Text> : null}
              <View style={styles.actions}>
                <StarlightSheetBtn p={p} label="Close" onPress={onClose} testID="starlight-event-sheet-close" />
                <StarlightSheetBtn
                  p={p}
                  label={saving ? 'Saving' : 'Save'}
                  primary
                  flex={2}
                  disabled={saving}
                  onPress={() => void handleSave()}
                  testID="starlight-event-sheet-save"
                />
              </View>
            </ScrollView>
          </View>
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
  scrimPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  scrimTint: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetShadow: {
    marginHorizontal: 8,
    marginBottom: 8,
    borderRadius: 28,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -20 },
    elevation: 24,
  },
  sheet: {
    maxHeight: '88%',
    borderWidth: 1,
    borderRadius: 28,
    overflow: 'hidden',
  },
  sheetContent: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 26,
  },
  glint: {
    position: 'absolute',
    top: 0,
    left: '15%',
    right: '15%',
    height: 1,
  },
  innerHairline: {
    position: 'absolute',
    top: 1,
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.5,
  },
  topline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  kicker: {
    flexShrink: 1,
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  status: {
    flexShrink: 0,
    fontFamily: 'Fraunces-SemiBold',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  badge: {
    marginTop: 10,
    fontSize: 10,
    letterSpacing: 1.8,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
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
    marginTop: 22,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  fieldLabel: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 10,
    letterSpacing: 1.8,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  detailRow: {
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'baseline',
    borderBottomWidth: 1,
    gap: 12,
  },
  rowLabel: {
    width: 74,
    fontSize: 10,
    letterSpacing: 1.8,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  rowInput: {
    flex: 1,
    minWidth: 0,
    padding: 0,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
  rowValue: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  choiceBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  choiceText: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  noteBlock: {
    marginTop: 4,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 13,
    fontFamily: 'Fraunces-Regular',
    fontStyle: 'italic',
    fontWeight: '500',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  error: {
    marginTop: 14,
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
});
