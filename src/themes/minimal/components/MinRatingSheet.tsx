import React from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { TimeSlotRating } from '../../../features/rating/types';
import type { MinimalEvent, MinimalPaletteColors } from './minimalTypes';
import { MOOD_FACES, MOOD_LABELS, categoryLabel, formatTime, moodToIndex } from './minimalTypes';
import { MinSheetBtn } from './parts/MinSheetBtn';

type SavePayload = {
  efficiency: 1 | 2 | 3 | 4 | 5;
  moodIndex: 1 | 2 | 3 | 4 | 5;
  reflection: string;
};

type Props = {
  p: MinimalPaletteColors;
  event: MinimalEvent | null;
  existing?: TimeSlotRating;
  onClose: () => void;
  onSave: (payload: SavePayload) => void;
};

export function MinRatingSheet({ p, event, existing, onClose, onSave }: Props) {
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

  return (
    <View pointerEvents={open ? 'auto' : 'none'} style={styles.overlay}>
      <Pressable onPress={onClose} style={[styles.scrim, { backgroundColor: p.sheetScrim, opacity: open ? 1 : 0 }]} />
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: p.bg,
            borderTopColor: p.ink,
            transform: [{ translateY: translateY.interpolate({ inputRange: [0, 1], outputRange: [0, 760] }) }],
          },
        ]}
      >
        <ScrollView>
          <View style={styles.topRow}>
            <Text style={[styles.kicker, { color: p.subtle }]}>Rate · {event ? categoryLabel(event) : ''}</Text>
            <Text style={[styles.kicker, styles.timeRange, { color: p.subtle }]}>
              {event ? `${formatTime(event.start_time)} – ${formatTime(event.end_time)}` : '—'}
            </Text>
          </View>
          <Text style={[styles.title, { color: p.ink }]}>{event?.title ?? ''}</Text>

          <View style={[styles.section, { borderTopColor: p.line }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.kicker, { color: p.subtle }]}>Efficiency · 效率</Text>
              <Text style={[styles.kicker, { color: efficiency > 0 ? p.ink : p.dim }]}>{efficiency || '—'}/5</Text>
            </View>
            <View style={styles.effBars}>
              {[1, 2, 3, 4, 5].map((value) => (
                <Pressable
                  key={value}
                  onPress={() => setEfficiency(value)}
                  style={styles.effTap}
                  testID={`min-rating-efficiency-${value}`}
                >
                  <View
                    style={[
                      styles.effBar,
                      {
                        height: `${20 + value * 16}%`,
                        backgroundColor: efficiency >= value ? p.ink : 'transparent',
                        borderColor: efficiency >= value ? p.ink : p.line,
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
              <Text style={[styles.kicker, { color: mood > 0 ? p.ink : p.dim }]}>{mood > 0 ? MOOD_LABELS[mood - 1] : '—'}</Text>
            </View>
            <View style={styles.moodGrid}>
              {MOOD_LABELS.map((label, index) => {
                const value = index + 1;
                const selected = mood === value;
                return (
                  <Pressable
                    key={label}
                    onPress={() => setMood(value)}
                    testID={`min-rating-mood-${value}`}
                    style={[
                      styles.moodCell,
                      {
                        backgroundColor: selected ? p.ink : 'transparent',
                        borderColor: selected ? p.ink : p.line,
                      },
                    ]}
                  >
                    <Text style={[styles.moodFace, { color: selected ? p.bg : p.ink, fontSize: selected ? 12 : 16 }]}>
                      {selected ? MOOD_FACES[index] : label}
                    </Text>
                    {selected ? <Text style={[styles.moodLabel, { color: p.bg }]}>{label}</Text> : null}
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
              testID="min-rating-reflection"
              value={reflection}
              onChangeText={setReflection}
              placeholder="一两行就够..."
              placeholderTextColor={p.dim}
              style={[styles.reflection, { color: p.ink, borderColor: p.line }]}
            />
          </View>

          <View style={styles.actions}>
            <MinSheetBtn p={p} label="Skip" onPress={onClose} />
            <MinSheetBtn
              p={p}
              label="Save"
              primary
              flex={2}
              disabled={!canSave}
              onPress={() => {
                if (!canSave) return;
                onSave({
                  efficiency: efficiency as SavePayload['efficiency'],
                  moodIndex: mood as SavePayload['moodIndex'],
                  reflection,
                });
              }}
            />
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 25 },
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 26, borderTopWidth: 2, maxHeight: '86%' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between' },
  kicker: { fontSize: 10, letterSpacing: 2, fontWeight: '700', textTransform: 'uppercase' },
  timeRange: { fontVariant: ['tabular-nums'] },
  title: { fontSize: 28, fontWeight: '600', marginTop: 10 },
  section: { marginTop: 20, paddingTop: 16, borderTopWidth: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  effBars: { flexDirection: 'row', gap: 6, marginTop: 12, height: 38 },
  effTap: { flex: 1, justifyContent: 'flex-end' },
  effBar: { width: '100%', borderWidth: 1 },
  moodGrid: { flexDirection: 'row', gap: 6, marginTop: 12 },
  moodCell: { flex: 1, height: 56, paddingHorizontal: 2, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 2, overflow: 'hidden' },
  moodFace: { fontWeight: '500', lineHeight: 16 },
  moodLabel: { fontSize: 9, letterSpacing: 1.8, fontWeight: '700', opacity: 0.7, textTransform: 'uppercase', lineHeight: 11 },
  reflectionLabel: { marginBottom: 10 },
  reflection: { minHeight: 72, borderWidth: 1, padding: 12, fontSize: 14, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', marginTop: 22 },
});
