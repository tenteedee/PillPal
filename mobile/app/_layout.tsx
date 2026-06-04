import { ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import 'react-native-reanimated';

import { palette } from '@/src/theme/pillpal';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        value={{
          dark: false,
          colors: {
            primary: palette.primary,
            background: palette.canvas,
            card: palette.surface,
            text: palette.ink,
            border: palette.mutedLight,
            notification: palette.rose,
          },
          fonts: {
            regular: { fontFamily: 'System', fontWeight: '400' },
            medium: { fontFamily: 'System', fontWeight: '500' },
            bold: { fontFamily: 'System', fontWeight: '700' },
            heavy: { fontFamily: 'System', fontWeight: '900' },
          },
        }}>
        <Stack screenOptions={{ contentStyle: { backgroundColor: palette.canvas } }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
