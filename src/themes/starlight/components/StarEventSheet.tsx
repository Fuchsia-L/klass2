import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CATEGORIES, type CategoryKey, type ScheduleEvent } from '../../../features/schedule/types';
import { StarlightSheetBtn } from './parts';
import type { StarlightPaletteColors } from './starlightTypes';

type Props = {
  p: StarlightPaletteColors;
  event: ScheduleEvent | null;
  visible: boolean;
  onClose: () => void;
  onSave: (payload: StarEventSheetPayload) => void | Promise<void>;
};

export type StarEventSheetPayload = Omit<ScheduleEvent, 'id'> & { id?: string };

const CATEGORY_KEYS = Object.keys(CATEGORIES) as CategoryKey[];
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

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

export function StarEventSheet({ p, event, visible, onClose, onSave }: Props) {
  const [draftTitle, setDraftTitle] = React.useState('');
  const [draftStart, setDraftStart] = React.useState(() => formatEditableDateTime(defaultStart()));
  const [draftEnd, setDraftEnd] = React.useState(() => formatEditableDateTime(new Date(defaultStart().getTime() + 60 * 60000)));
  const [draftCategory, setDraftCategory] = React.useState<CategoryKey>('其他');
  const [draftLocation, setDraftLocation] = React.useState('');
  const [draftNotes, setDraftNotes] = React.useState('');
  const [error, setError] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const isNew = visible && event === null;
  const categoryLabel = CATEGORIES[draftCategory]?.label ?? CATEGORIES['其他'].label;

  React.useEffect(() => {
    if (!visible) return;
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
  }, [visible, event?.id]);

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

    try {
      setSaving(true);
      await onSave({
        id: event?.id,
        title,
        category: draftCategory,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        repeat: event?.repeat ?? 'none',
        repeat_until: event?.repeat_until,
        location: draftLocation.trim() || undefined,
        reminder_minutes: event?.reminder_minutes,
        notes: draftNotes.trim() || undefined,
        source: event?.source ?? 'manual',
        is_completed: event?.is_completed ?? false,
      });
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View testID="starlight-event-sheet" style={styles.overlay}>
        <Pressable testID="starlight-event-sheet-scrim" onPress={onClose} style={[styles.scrim, { backgroundColor: p.sheetScrim }]} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: p.dark ? 'rgba(20,14,42,0.88)' : 'rgba(255,255,255,0.82)',
              borderColor: p.dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)',
              shadowColor: p.nowGlow,
            },
          ]}
        >
          <View style={[styles.glint, { backgroundColor: p.dark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.9)' }]} />
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.topline}>
              <Text style={[styles.kicker, { color: p.subtle }]}>{isNew ? 'New · 新建' : categoryLabel}</Text>
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
              placeholder={isNew ? 'Draft event' : 'Event title'}
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
                style={[styles.input, { color: p.ink, borderColor: p.line }]}
              />
              <Text style={[styles.fieldLabel, { color: p.subtle }]}>End</Text>
              <TextInput
                testID="starlight-event-sheet-end"
                value={draftEnd}
                onChangeText={setDraftEnd}
                placeholder="YYYY-MM-DD HH:mm"
                placeholderTextColor={p.dim}
                style={[styles.input, { color: p.ink, borderColor: p.line }]}
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
                        },
                      ]}
                    >
                      <Text style={[styles.choiceText, { color: selected ? (p.dark ? p.bg : '#ffffff') : p.ink }]}>
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
                  style={[styles.notesInput, { color: p.ink, borderColor: p.line }]}
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
    shadowOpacity: 0.5,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: -16 },
  },
  glint: {
    position: 'absolute',
    top: 0,
    left: '15%',
    right: '15%',
    height: 1,
    opacity: 0.8,
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
    marginTop: 8,
    fontSize: 10,
    letterSpacing: 1.8,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  titleInput: {
    marginTop: 8,
    fontFamily: 'Fraunces-Regular',
    fontSize: 32,
    lineHeight: 38,
    fontStyle: 'italic',
    borderBottomWidth: 1,
    paddingVertical: 6,
  },
  rows: {
    marginTop: 20,
    paddingTop: 2,
    borderTopWidth: 1,
  },
  fieldLabel: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 10,
    letterSpacing: 1.8,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 13,
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
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  rowInput: {
    flex: 1,
    minWidth: 0,
    padding: 0,
    fontSize: 14,
    fontWeight: '500',
  },
  rowValue: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: '500',
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  choiceBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  choiceText: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  noteBlock: {
    marginTop: 2,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 13,
    fontWeight: '500',
    minHeight: 72,
    textAlignVertical: 'top',
  },
  error: {
    marginTop: 14,
    fontSize: 12,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
});
