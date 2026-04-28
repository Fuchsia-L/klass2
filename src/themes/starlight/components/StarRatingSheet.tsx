import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
const MOOD_FACES = ['(๑-_-๑)', '(>﹏<)', '( ･_･)', '( ´ ▽ ` )', '(๑>ᴗ<๑)'] as const;
const MONO_FONT_FAMILY = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
const MOOD_FADE_MS = 160;

// HTML prototype glass tokens — not in palette.
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
const REFLECTION_TINT_DARK = 'rgba(255,255,255,0.03)';
const REFLECTION_TINT_LIGHT = 'rgba(255,255,255,0.55)';

function moodToIndex(mood: string | undefined): number {
  if (!mood) return 0;
  const index = STARLIGHT_MOOD_LABELS.indexOf(mood as (typeof STARLIGHT_MOOD_LABELS)[number]);
  return index === -1 ? 0 : index + 1;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '--:--';
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function categoryLabel(event: ScheduleEvent | null): string {
  if (!event) return '';
  return CATEGORIES[event.category]?.label ?? CATEGORIES['其他'].label;
}

export function StarRatingSheet({ p, event, existing, onClose, onSave }: Props) {
  const open = event !== null;
  const translateY = React.useRef(new Animated.Value(1)).current;
  const [efficiency, setEfficiency] = React.useState(0);
  const [mood, setMood] = React.useState(0);
  const [reflection, setReflection] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setEfficiency(existing?.efficiency ?? 0);
      setMood(moodToIndex(existing?.mood));
      setReflection(existing?.reflection ?? '');
    }
  }, [open, event?.id]);

  React.useEffect(() => {
    Animated.timing(translateY, {
      toValue: open ? 0 : 1,
      duration: 260,
      easing: Easing.bezier(0.22, 0.9, 0.3, 1),
      useNativeDriver: true,
    }).start();
  }, [open, translateY]);

  const canSave = efficiency > 0 && mood > 0;

  const glassTop = p.dark ? GLASS_DARK_TOP : GLASS_LIGHT_TOP;
  const glassBottom = p.dark ? GLASS_DARK_BOTTOM : GLASS_LIGHT_BOTTOM;
  const glintColor = p.dark ? GLINT_DARK : GLINT_LIGHT;
  const borderColor = p.dark ? BORDER_DARK : BORDER_LIGHT;
  const outerShadowColor = p.dark ? SHADOW_DARK_OUTER : SHADOW_LIGHT_OUTER;
  const innerHairlineColor = p.dark ? INNER_HAIRLINE_DARK : INNER_HAIRLINE_LIGHT;
  const reflectionTint = p.dark ? REFLECTION_TINT_DARK : REFLECTION_TINT_LIGHT;

  return (
    <View testID="starlight-rating-sheet" pointerEvents={open ? 'auto' : 'none'} style={styles.overlay}>
      <Pressable testID="starlight-rating-sheet-scrim" onPress={onClose} style={[styles.scrim, { opacity: open ? 1 : 0 }]}>
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
            transform: [{ translateY: translateY.interpolate({ inputRange: [0, 1], outputRange: [0, 760] }) }],
          },
        ]}
      >
        <BlurView
          intensity={52}
          tint={p.dark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
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
        <View pointerEvents="none" style={[styles.innerHairline, { backgroundColor: innerHairlineColor }]} />

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheetContent}>
          <View style={styles.topRow}>
            <Text testID="starlight-rating-sheet-category" style={[styles.kicker, { color: p.subtle }]}>
              Rate - {categoryLabel(event)}
            </Text>
            <Text testID="starlight-rating-sheet-time" style={[styles.kicker, styles.timeRange, { color: p.subtle }]}>
              {event ? `${formatTime(event.start_time)} – ${formatTime(event.end_time)}` : '—'}
            </Text>
          </View>
          <Text testID="starlight-rating-sheet-title" style={[styles.title, { color: p.ink }]}>{event?.title ?? ''}</Text>

          <View style={[styles.section, { borderTopColor: p.line }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.kicker, { color: p.subtle }]}>Efficiency · 效率</Text>
              <Text testID="starlight-rating-efficiency-value" style={[styles.value, { color: efficiency > 0 ? p.accent : p.dim }]}>
                {efficiency || '—'}/5
              </Text>
            </View>
            <View style={styles.effBars}>
              {[1, 2, 3, 4, 5].map((value) => (
                <Pressable
                  key={value}
                  onPress={() => setEfficiency(value)}
                  style={styles.effTap}
                  testID={`starlight-rating-efficiency-${value}`}
                >
                  <View
                    style={[
                      styles.effBar,
                      {
                        height: `${20 + value * 16}%`,
                        backgroundColor: efficiency >= value ? p.accent : 'transparent',
                        borderColor: efficiency >= value ? p.accent : p.line,
                        shadowColor: p.nowGlow,
                        shadowOpacity: efficiency >= value ? 0.9 : 0,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 0 },
                        elevation: efficiency >= value ? 3 : 0,
                      },
                    ]}
                  />
                </Pressable>
              ))}
            </View>
          </View>

          <View style={[styles.section, { borderTopColor: p.line }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.kicker, { color: p.subtle }]}>Mood · 心情</Text>
              <Text testID="starlight-rating-mood-value" style={[styles.value, { color: mood > 0 ? p.accent : p.dim }]}>
                {mood > 0 ? STARLIGHT_MOOD_LABELS[mood - 1] : '—'}
              </Text>
            </View>
            <View style={styles.moodGrid}>
              {STARLIGHT_MOOD_LABELS.map((label, index) => {
                const value = index + 1;
                const selected = mood === value;
                return (
                  <Pressable
                    key={label}
                    onPress={() => setMood(value)}
                    testID={`starlight-rating-mood-${value}`}
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
                    <MoodFaceLayer label={label} face={MOOD_FACES[index]} selected={selected} value={value} p={p} />
                    {selected ? (
                      <Text style={[styles.moodLabel, { color: p.dark ? ACCENT_INK_DARK : '#ffffff' }]}>{label}</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={[styles.section, { borderTopColor: p.line }]}>
            <Text style={[styles.kicker, styles.reflectionLabel, { color: p.subtle }]}>Reflection · 反思</Text>
            <TextInput
              multiline
              numberOfLines={4}
              testID="starlight-rating-reflection"
              value={reflection}
              onChangeText={setReflection}
              placeholder="一两行就够..."
              placeholderTextColor={p.dim}
              style={[styles.reflection, { color: p.ink, borderColor: p.line, backgroundColor: reflectionTint }]}
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
      </Animated.View>
    </View>
  );
}

function MoodFaceLayer({
  label,
  face,
  selected,
  value,
  p,
}: {
  label: string;
  face: string;
  selected: boolean;
  value: number;
  p: StarlightPaletteColors;
}) {
  const characterOpacity = React.useRef(new Animated.Value(selected ? 0 : 1)).current;
  const faceOpacity = React.useRef(new Animated.Value(selected ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(characterOpacity, {
        toValue: selected ? 0 : 1,
        duration: MOOD_FADE_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(faceOpacity, {
        toValue: selected ? 1 : 0,
        duration: MOOD_FADE_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [characterOpacity, faceOpacity, selected]);

  const selectedColor = p.dark ? ACCENT_INK_DARK : '#ffffff';

  return (
    <View style={styles.moodFaceStack}>
      <Animated.Text
        testID={`starlight-rating-mood-${value}-character`}
        numberOfLines={1}
        style={[
          styles.moodFace,
          styles.moodFaceLayer,
          {
            color: selected ? selectedColor : p.ink,
            fontFamily: 'NotoSerifSC-Regular',
            fontStyle: 'italic',
            fontSize: 16,
            opacity: characterOpacity,
          },
        ]}
      >
        {label}
      </Animated.Text>
      <Animated.Text
        testID={`starlight-rating-mood-${value}-face`}
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[
          styles.moodFace,
          styles.moodFaceLayer,
          {
            color: selected ? selectedColor : p.ink,
            fontFamily: MONO_FONT_FAMILY,
            fontSize: 12,
            opacity: faceOpacity,
          },
        ]}
      >
        {face}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 25 },
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  scrimTint: { ...StyleSheet.absoluteFillObject },
  sheet: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    borderWidth: 1,
    borderRadius: 28,
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
  topRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  kicker: {
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: 'NotoSansSC-SemiBold',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  timeRange: {
    fontFamily: 'NotoSerifSC-SemiBold',
    fontVariant: ['tabular-nums'],
  },
  title: {
    fontSize: 30,
    marginTop: 10,
    lineHeight: 36,
    letterSpacing: -0.7,
    fontFamily: 'NotoSerifSC-Regular',
    fontStyle: 'italic',
  },
  section: { marginTop: 22, paddingTop: 14, borderTopWidth: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  value: {
    fontFamily: 'NotoSerifSC-SemiBold',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  effBars: { flexDirection: 'row', gap: 6, marginTop: 12, height: 42 },
  effTap: { flex: 1, justifyContent: 'flex-end' },
  effBar: { width: '100%', borderWidth: 1, borderRadius: 6 },
  moodGrid: { flexDirection: 'row', gap: 6, marginTop: 12 },
  moodCell: {
    flex: 1,
    height: 60,
    paddingHorizontal: 2,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    overflow: 'hidden',
  },
  moodFaceStack: { width: '100%', height: 18, alignItems: 'center', justifyContent: 'center' },
  moodFace: { fontWeight: '500', lineHeight: 18 },
  moodFaceLayer: { position: 'absolute', textAlign: 'center' },
  moodLabel: {
    fontSize: 9,
    letterSpacing: 1.8,
    fontFamily: 'NotoSansSC-SemiBold',
    fontWeight: '600',
    opacity: 0.9,
    textTransform: 'uppercase',
    lineHeight: 11,
  },
  reflectionLabel: { marginBottom: 10 },
  reflection: {
    minHeight: 80,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'NotoSerifSC-Regular',
    fontStyle: 'italic',
    textAlignVertical: 'top',
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 22 },
});
