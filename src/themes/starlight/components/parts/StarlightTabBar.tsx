import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { StarlightPaletteColors } from '../starlightTypes';

export type StarlightTab = 'today' | 'week' | 'todos' | 'settings';

type Props = {
  p: StarlightPaletteColors;
  tab: StarlightTab;
  setTab: (tab: StarlightTab) => void;
  onAdd: () => void;
  testID?: string;
};

const TABS: Array<{ key: StarlightTab; label: string; testID: string }> = [
  { key: 'today', label: 'TODAY', testID: 'starlight-tab-today' },
  { key: 'week', label: 'WEEK', testID: 'starlight-tab-week' },
  { key: 'todos', label: 'TODOS', testID: 'starlight-tab-todos' },
  { key: 'settings', label: 'SET', testID: 'starlight-tab-settings' },
];

export function StarlightTabBar({ p, tab, setTab, onAdd, testID = 'starlight-tab-bar' }: Props) {
  return (
    <View
      testID={testID}
      style={[
        styles.bar,
        {
          borderTopColor: p.line,
          backgroundColor: p.dark ? 'rgba(10,6,32,0.60)' : 'rgba(255,255,255,0.55)',
        },
      ]}
    >
      <View style={styles.tabs}>
        {TABS.map((item) => {
          const active = tab === item.key;
          return (
            <Pressable key={item.key} testID={item.testID} onPress={() => setTab(item.key)} style={styles.tabButton}>
              <Text
                style={[
                  styles.tabText,
                  {
                    color: active ? p.accent : p.dim,
                    borderBottomColor: active ? p.accent : 'transparent',
                  },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        testID="starlight-tab-add"
        onPress={onAdd}
        style={({ pressed }) => [
          styles.add,
          {
            backgroundColor: p.accent,
            shadowColor: p.nowGlow,
            transform: [{ scale: pressed ? 0.92 : 1 }],
          },
        ]}
      >
        <Text style={[styles.addText, { color: p.dark ? p.bg : '#ffffff' }]}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 60,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 3,
  },
  tabs: {
    flex: 1,
    flexDirection: 'row',
    gap: 14,
  },
  tabButton: {
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 10,
    letterSpacing: 1.8,
    fontWeight: '600',
    paddingBottom: 4,
    borderBottomWidth: 1,
  },
  add: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.8,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  addText: {
    fontFamily: 'Fraunces-Regular',
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 24,
  },
});
