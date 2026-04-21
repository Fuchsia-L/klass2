import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
const MONO_FONT = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

// Same hard-coded palette stops as StarEventSheet — HTML prototype tokens that don't exist in nebula palette.
const GLASS_DARK_TOP = 'rgba(40,30,70,0.72)';
const GLASS_DARK_BOTTOM = 'rgba(20,14,42,0.80)';
const GLASS_LIGHT_TOP = 'rgba(255,255,255,0.78)';
const GLASS_LIGHT_BOTTOM = 'rgba(255,255,255,0.62)';
const GLINT_DARK = 'rgba(255,255,255,0.28)';
const GLINT_LIGHT = 'rgba(255,255,255,0.92)';
const SHADOW_DARK_OUTER = '#000000';
const SHADOW_LIGHT_OUTER = '#2c1f48';
const ACCENT_INK_DARK = '#06060f';

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

  const glassTop = p.dark ? GLASS_DARK_TOP : GLASS_LIGHT_TOP;
  const glassBottom = p.dark ? GLASS_DARK_BOTTOM : GLASS_LIGHT_BOTTOM;
  const glintColor = p.dark ? GLINT_DARK : GLINT_LIGHT;
  const borderColor = p.dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)';
  const outerShadowColor = p.dark ? SHADOW_DARK_OUTER : SHADOW_LIGHT_OUTER;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View testID="starlight-rating-sheet" style={styles.overlay}>
        {/* Scrim */}
        <Pressable testID="starlight-rating-sheet-scrim" onPress={onClose} style={styles.scrimPressable}>
          <BlurView intensity={12} tint={p.dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={[styles.scrimTint, { backgroundColor: p.sheetScrim }]} />
        </Pressable>

        {/* Glass sheet — outer shadow wrapper */}
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
            <BlurView
              intensity={Platform.OS === 'ios' ? 56 : 72}
              tint={p.dark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={[glassTop, glassBottom]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <LinearGradient
              colors={['transparent', glintColor, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.glint}
              pointerEvents="none"
            />
            <View pointerEvents="none" style={[styles.innerHairline, { backgroundColor: p.dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.75)' }]} />

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheetContent}>
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

              {/* Efficiency */}
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
                              height: `${20 + value * 16}%`,
                              backgroundColor: selected ? p.accent : 'transparent',
                              borderColor: selected ? p.accent : p.line,
                              shadowColor: p.nowGlow,
                              shadowOpacity: selected ? 0.9 : 0,
                              shadowRadius: 8,
                              shadowOffset: { width: 0, height: 0 },
                              elevation: selected ? 3 : 0,
                            },
                          ]}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Mood */}
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
                            shadowColor: p.nowGlow,
                            shadowOpacity: selected ? 0.95 : 0,
                            shadowRadius: 12,
                            shadowOffset: { width: 0, height: 0 },
                            elevation: selected ? 4 : 0,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.moodFace,
                            selected
                              ? {
                                  fontFamily: MONO_FONT,
                                  fontSize: 12,
                                  fontStyle: 'normal',
                                  color: p.dark ? ACCENT_INK_DARK : '#ffffff',
                                }
                              : {
                                  fontFamily: 'Fraunces-Regular',
                                  fontSize: 16,
                                  fontStyle: 'italic',
                                  color: p.ink,
                                },
                          ]}
                        >
                          {selected ? MOOD_FACES[index] : label}
                        </Text>
                        {selected ? (
                          <Text style={[styles.moodLabel, { color: p.dark ? ACCENT_INK_DARK : '#ffffff' }]}>{label}</Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Reflection */}
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
                  style={[
                    styles.reflection,
                    {
                      color: p.ink,
                      borderColor: p.line,
                      backgroundColor: p.dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.55)',
                    },
                  ]}
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
    maxHeight: '86%',
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
  time: {
    flexShrink: 0,
    fontFamily: 'Fraunces-SemiBold',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  title: {
    marginTop: 10,
    fontFamily: 'Fraunces-Regular',
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.7,
    fontStyle: 'italic',
  },
  meta: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
  section: {
    marginTop: 22,
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
    fontSize: 12,
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
    borderRadius: 6,
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
    gap: 2,
    paddingHorizontal: 2,
    overflow: 'hidden',
  },
  moodFace: {
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
  moodLabel: {
    fontSize: 9,
    letterSpacing: 1.8,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    opacity: 0.9,
    textTransform: 'uppercase',
    lineHeight: 11,
  },
  reflectionLabel: {
    marginBottom: 10,
  },
  reflection: {
    minHeight: 80,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Fraunces-Regular',
    fontStyle: 'italic',
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
});
