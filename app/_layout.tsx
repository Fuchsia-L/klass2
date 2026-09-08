import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Home, Grid3X3, Settings, Star } from 'lucide-react-native';
import { ThemeProvider, useTheme, useThemeSettings } from '../src/theme/ThemeContext';
import { RatingServiceProvider } from '../src/features/rating';
import { CloudSyncProvider } from '../src/features/settings';
import { resolvePalette } from '../src/themes';

function TabLayout() {
  const theme = useTheme();
  const { themeName } = useThemeSettings();
  const pkgId = resolvePalette(themeName)?.pkg.id;
  const hideOuterTabBar = pkgId === 'minimal' || pkgId === 'starlight';

  return (
    <>
      <StatusBar style="light" backgroundColor={theme.colors.bg} />
      <Tabs
        tabBar={hideOuterTabBar ? () => null : undefined}
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.colors.card,
            borderTopColor: theme.colors.divider,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSub,
          tabBarLabelStyle: {
            fontFamily: theme.fonts.heading,
            fontSize: 10,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'TODAY',
            tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="matrix"
          options={{
            title: 'MATRIX',
            tabBarIcon: ({ color, size }) => <Grid3X3 size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="rating"
          options={{
            title: 'RATING',
            tabBarIcon: ({ color, size }) => <Star size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'SETTINGS',
            tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
          }}
        />
      </Tabs>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Orbitron-Regular': require('../assets/fonts/Orbitron-Regular.ttf'),
    'Orbitron-Bold': require('../assets/fonts/Orbitron-Bold.ttf'),
    'Fraunces-Regular': require('../assets/fonts/Fraunces-Regular.ttf'),
    'Fraunces-Medium': require('../assets/fonts/Fraunces-Medium.ttf'),
    'Fraunces-SemiBold': require('../assets/fonts/Fraunces-SemiBold.ttf'),
    'Fraunces-Bold': require('../assets/fonts/Fraunces-Bold.ttf'),
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
    'NotoSerifSC-Regular': require('../assets/fonts/NotoSerifSC-400.ttf'),
    'NotoSerifSC-Medium': require('../assets/fonts/NotoSerifSC-500.ttf'),
    'NotoSerifSC-SemiBold': require('../assets/fonts/NotoSerifSC-600.ttf'),
    'NotoSerifSC-Bold': require('../assets/fonts/NotoSerifSC-700.ttf'),
    'NotoSansSC-Regular': require('../assets/fonts/NotoSansSC-400.ttf'),
    'NotoSansSC-Medium': require('../assets/fonts/NotoSansSC-500.ttf'),
    'NotoSansSC-SemiBold': require('../assets/fonts/NotoSansSC-600.ttf'),
    'NotoSansSC-Bold': require('../assets/fonts/NotoSansSC-700.ttf'),
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RatingServiceProvider>
          <CloudSyncProvider>
            <TabLayout />
          </CloudSyncProvider>
        </RatingServiceProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
