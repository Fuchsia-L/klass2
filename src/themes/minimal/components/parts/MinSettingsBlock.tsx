import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { MinimalPaletteColors } from '../minimalTypes';

type Props = {
  p: MinimalPaletteColors;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function MinSettingsBlock({ p, title, subtitle, children }: Props) {
  return (
    <View style={[styles.block, { borderBottomColor: p.line }]}>
      <Text style={[styles.title, { color: p.subtle, marginBottom: subtitle ? 4 : 10 }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: p.subtle }]}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 6,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 10,
  },
});
