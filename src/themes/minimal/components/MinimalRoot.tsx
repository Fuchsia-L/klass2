import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import type { RouteName } from '../../types';
import { LegacySettings } from '../../legacy/components/LegacySettings';

export function MinimalRoot({ route }: { route: RouteName }) {
  const theme = useTheme();

  if (route === 'settings') {
    return <LegacySettings />;
  }

  const routeLabel: Record<Exclude<RouteName, 'settings'>, string> = {
    home: 'TODAY',
    matrix: 'MATRIX',
    rating: 'RATING',
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <View style={styles.center}>
        <Text style={[styles.route, { color: theme.colors.textSub, fontFamily: theme.fonts.heading }]}>
          {routeLabel[route]}
        </Text>
        <Text style={[styles.title, { color: theme.colors.textMain, fontFamily: theme.fonts.heading }]}>
          Minimal
        </Text>
        <Text style={[styles.body, { color: theme.colors.textSub }]}>建设中 (P2)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  route: { fontSize: 11, letterSpacing: 2 },
  title: { fontSize: 28, letterSpacing: 3 },
  body: { fontSize: 13 },
});
