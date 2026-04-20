import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MinimalPaletteColors, MinimalTab } from '../minimalTypes';

type Props = {
  p: MinimalPaletteColors;
  tab: MinimalTab;
  setTab: (tab: MinimalTab) => void;
  onAdd: () => void;
};

const TABS: Array<{ key: MinimalTab; label: string }> = [
  { key: 'today', label: 'TODAY' },
  { key: 'week', label: 'WEEK' },
  { key: 'todos', label: 'TODOS' },
  { key: 'settings', label: 'SETTINGS' },
];

export function MinTabBar({ p, tab, setTab, onAdd }: Props) {
  return (
    <View style={[styles.bar, { borderTopColor: p.line, backgroundColor: p.bg }]}>
      <View style={styles.tabs}>
        {TABS.map((item) => (
          <Pressable key={item.key} onPress={() => setTab(item.key)} style={styles.tabButton}>
            <Text
              style={[
                styles.tabText,
                {
                  color: tab === item.key ? p.ink : p.dim,
                  borderBottomColor: tab === item.key ? p.ink : 'transparent',
                },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        onPress={onAdd}
        style={({ pressed }) => [
          styles.add,
          { backgroundColor: p.ink, transform: [{ scale: pressed ? 0.9 : 1 }] },
        ]}
      >
        <Text style={[styles.addText, { color: p.bg }]}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 56,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 3,
  },
  tabs: {
    flex: 1,
    flexDirection: 'row',
    gap: 16,
  },
  tabButton: {
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 10,
    letterSpacing: 1.8,
    fontWeight: '700',
    paddingBottom: 4,
    borderBottomWidth: 1,
  },
  add: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 24,
  },
});
