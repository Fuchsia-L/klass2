import React from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { MinimalEvent, MinimalPaletteColors } from './minimalTypes';
import { categoryLabel, durationMinutes, formatDateDots, formatTime } from './minimalTypes';
import { MinSheetBtn } from './parts/MinSheetBtn';
import { MinSheetRow } from './parts/MinSheetRow';

type Props = {
  p: MinimalPaletteColors;
  event: MinimalEvent | null;
  isNew: boolean;
  onClose: () => void;
};

export function MinEventSheet({ p, event, isNew, onClose }: Props) {
  const open = event !== null || isNew;
  const translateY = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.timing(translateY, {
      toValue: open ? 0 : 1,
      duration: 260,
      easing: Easing.bezier(0.22, 0.9, 0.3, 1),
      useNativeDriver: true,
    }).start();
  }, [open, translateY]);

  const title = event?.title ?? '新建事件';
  const tag = event ? categoryLabel(event) : 'WORK';
  const start = event ? formatTime(event.start_time) : '—';
  const end = event ? formatTime(event.end_time) : '—';

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
            <Text style={[styles.kicker, { color: p.subtle }]}>{isNew ? 'New Event' : `${event?.id.slice(0, 2) ?? '—'} · ${tag}`}</Text>
            <Text style={[styles.kicker, styles.timeRange, { color: p.subtle }]}>{start} – {end}</Text>
          </View>
          <Text style={[styles.title, { color: p.ink }]}>{title}</Text>
          <Text style={[styles.location, { color: p.subtle }]}>— {event?.location || '—'}</Text>
          <View style={[styles.rows, { borderTopColor: p.ink }]}>
            <MinSheetRow p={p} label="Date" value={event ? formatDateDots(event.start_time) : formatDateDots(new Date().toISOString())} />
            <MinSheetRow p={p} label="Duration" value={`${event ? durationMinutes(event) : 60} min`} />
            <MinSheetRow p={p} label="Category" value={tag} />
            <MinSheetRow p={p} label="Repeat" value={event?.repeat === 'daily' ? 'Daily' : event?.repeat === 'weekly' ? 'Weekly' : 'Once'} />
          </View>
          <View style={styles.actions}>
            <MinSheetBtn p={p} label="Cancel" onPress={onClose} />
            <MinSheetBtn p={p} label="Save" primary flex={2} onPress={onClose} />
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
  sheetTop: { flexDirection: 'row', justifyContent: 'space-between' },
  kicker: { fontSize: 10, letterSpacing: 2, fontWeight: '600', textTransform: 'uppercase' },
  timeRange: { letterSpacing: 0.5, fontVariant: ['tabular-nums'] },
  title: { fontSize: 34, fontWeight: '600', marginTop: 14, lineHeight: 39 },
  location: { fontSize: 12, marginTop: 6, fontStyle: 'italic' },
  rows: { marginTop: 26, borderTopWidth: 1 },
  actions: { flexDirection: 'row', marginTop: 22 },
});
