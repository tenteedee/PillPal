import { ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import 'react-native-reanimated';

import { palette } from '@/src/theme/pillpal';
import { useAuthStore } from '@/src/store/auth';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AuthGuard() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Check if the current segment is the login screen
    const isLoginScreen = segments[0] === 'login';

    if (!isAuthenticated && !isLoginScreen) {
      // Redirect to the login screen if not authenticated
      router.replace('/login');
    } else if (isAuthenticated && isLoginScreen) {
      // Redirect to the home screen if authenticated and trying to access login
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, router]);

  return null;
}

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
        <AuthGuard />
        <Stack screenOptions={{ contentStyle: { backgroundColor: palette.canvas } }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false, gestureEnabled: false }} />
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

