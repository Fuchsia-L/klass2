import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { TimeSlotRating } from '../../../features/rating/types';
import { CATEGORIES, type ScheduleEvent } from '../../../features/schedule/types';
import { StarlightSheetBtn } from './parts';
import type { StarlightPaletteColors } from './starlightTypes';

export type StarRatingSavePayload = {
  efficiency: 1 | 2 | 3 | 4 | 5;
  moodIndex: 1 | 2 | 3 | 4 | 5;
  reflection: string;
};

type Props = {
  p: StarlightPaletteColors;
  event: ScheduleEvent | null;
  existing?: TimeSlotRating;
  onClose: () => void;
  onSave: (payload: StarRatingSavePayload) => void;
};

export const STARLIGHT_MOOD_LABELS = ['困', '躁', '平', '好', '极'] as const;
const MOOD_FACES = ['(1-_-1)', '(>_<)', '( ._.)', '( ´ ▽ ` )', '(^_^)'] as const;

function moodToIndex(mood: string | undefined): number {
  if (!mood) return 0;
  const index = STARLIGHT_MOOD_LABELS.indexOf(mood as (typeof STARLIGHT_MOOD_LABELS)[number]);
  return index === -1 ? 0 : index + 1;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function formatTime(value: string | undefined): string {
  if (!value) return '--:--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function categoryLabel(event: ScheduleEvent | null): string {
  if (!event) return '';
  return CATEGORIES[event.category]?.label ?? CATEGORIES['其他'].label;
}

export function StarRatingSheet({ p, event, existing, onClose, onSave }: Props) {
  const visible = event !== null;
  const [efficiency, setEfficiency] = React.useState(0);
  const [mood, setMood] = React.useState(0);
  const [reflection, setReflection] = React.useState('');

  React.useEffect(() => {
    if (!visible) return;
    setEfficiency(existing?.efficiency ?? 0);
    setMood(moodToIndex(existing?.mood));
    setReflection(existing?.reflection ?? '');
  }, [visible, event?.id, existing?.id]);

  const canSave = efficiency > 0 && mood > 0;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View testID="starlight-rating-sheet" style={styles.overlay}>
        <Pressable testID="starlight-rating-sheet-scrim" onPress={onClose} style={[styles.scrim, { backgroundColor: p.sheetScrim }]} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: p.dark ? 'rgba(20,14,42,0.9)' : 'rgba(255,255,255,0.86)',
              borderColor: p.dark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.7)',
              shadowColor: p.nowGlow,
            },
          ]}
        >
          <View style={[styles.glint, { backgroundColor: p.dark ? 'rgba(255,255,255,0.24)' : 'rgba(255,255,255,0.9)' }]} />
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.topline}>
              <Text testID="starlight-rating-sheet-category" style={[styles.kicker, { color: p.subtle }]}>
                Rate - {categoryLabel(event)}
              </Text>
              <Text testID="starlight-rating-sheet-time" style={[styles.time, { color: p.subtle }]}>
                {formatTime(event?.start_time)} - {formatTime(event?.end_time)}
              </Text>
            </View>
            <Text testID="starlight-rating-sheet-title" style={[styles.title, { color: p.ink }]}>
              {event?.title ?? ''}
            </Text>
            {event?.location ? (
              <Text testID="starlight-rating-sheet-location" style={[styles.meta, { color: p.dim }]}>
                {event.location}
              </Text>
            ) : null}

            <View style={[styles.section, { borderTopColor: p.line }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.kicker, { color: p.subtle }]}>Efficiency - 效率</Text>
                <Text testID="starlight-rating-efficiency-value" style={[styles.value, { color: efficiency > 0 ? p.accent : p.dim }]}>
                  {efficiency || '-'}/5
                </Text>
              </View>
              <View style={styles.efficiencyBars}>
                {[1, 2, 3, 4, 5].map((value) => {
                  const selected = efficiency >= value;
                  return (
                    <Pressable
                      key={value}
                      testID={`starlight-rating-efficiency-${value}`}
                      onPress={() => setEfficiency(value)}
                      style={styles.efficiencyTap}
                    >
                      <View
                        style={[
                          styles.efficiencyBar,
                          {
                            height: `${22 + value * 14}%`,
                            backgroundColor: selected ? p.accent : 'transparent',
                            borderColor: selected ? p.accent : p.line,
                          },
                        ]}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={[styles.section, { borderTopColor: p.line }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.kicker, { color: p.subtle }]}>Mood - 心情</Text>
                <Text testID="starlight-rating-mood-value" style={[styles.value, { color: mood > 0 ? p.accent : p.dim }]}>
                  {mood > 0 ? STARLIGHT_MOOD_LABELS[mood - 1] : '-'}
                </Text>
              </View>
              <View style={styles.moodGrid}>
                {STARLIGHT_MOOD_LABELS.map((label, index) => {
                  const value = index + 1;
                  const selected = mood === value;
                  return (
                    <Pressable
                      key={label}
                      testID={`starlight-rating-mood-${value}`}
                      onPress={() => setMood(value)}
                      style={[
                        styles.moodCell,
                        {
                          backgroundColor: selected ? p.accent : 'transparent',
                          borderColor: selected ? p.accent : p.line,
                        },
                      ]}
                    >
                      <Text style={[styles.moodFace, { color: selected ? (p.dark ? p.bg : '#ffffff') : p.ink }]}>
                        {selected ? MOOD_FACES[index] : label}
                      </Text>
                      {selected ? (
                        <Text style={[styles.moodLabel, { color: p.dark ? p.bg : '#ffffff' }]}>{label}</Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={[styles.section, { borderTopColor: p.line }]}>
              <Text style={[styles.kicker, styles.reflectionLabel, { color: p.subtle }]}>Reflection - 反思</Text>
              <TextInput
                testID="starlight-rating-reflection"
                value={reflection}
                onChangeText={setReflection}
                placeholder="一两行就够..."
                placeholderTextColor={p.dim}
                multiline
                numberOfLines={4}
                style={[styles.reflection, { color: p.ink, borderColor: p.line }]}
              />
            </View>

            <View style={styles.actions}>
              <StarlightSheetBtn p={p} label="Skip" onPress={onClose} testID="starlight-rating-skip" />
              <StarlightSheetBtn
                p={p}
                label="Save"
                primary
                flex={2}
                disabled={!canSave}
                onPress={() => {
                  if (!canSave) return;
                  onSave({
                    efficiency: efficiency as StarRatingSavePayload['efficiency'],
                    moodIndex: mood as StarRatingSavePayload['moodIndex'],
                    reflection,
                  });
                }}
                testID="starlight-rating-save"
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
    maxHeight: '86%',
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
  time: {
    flexShrink: 0,
    fontFamily: 'Fraunces-SemiBold',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  title: {
    marginTop: 8,
    fontFamily: 'Fraunces-Regular',
    fontSize: 32,
    lineHeight: 38,
    fontStyle: 'italic',
  },
  meta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  value: {
    fontFamily: 'Fraunces-SemiBold',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  efficiencyBars: {
    flexDirection: 'row',
    gap: 6,
    height: 42,
    marginTop: 12,
  },
  efficiencyTap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  efficiencyBar: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 10,
  },
  moodGrid: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },
  moodCell: {
    flex: 1,
    height: 60,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 2,
    overflow: 'hidden',
  },
  moodFace: {
    fontFamily: 'Fraunces-Regular',
    fontSize: 12,
    fontStyle: 'italic',
    fontWeight: '500',
    textAlign: 'center',
  },
  moodLabel: {
    fontSize: 9,
    letterSpacing: 1.8,
    fontWeight: '600',
    opacity: 0.8,
    textTransform: 'uppercase',
  },
  reflectionLabel: {
    marginBottom: 8,
  },
  reflection: {
    minHeight: 72,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 13,
    fontWeight: '500',
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
});
