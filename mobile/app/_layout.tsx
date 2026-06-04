import { ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import 'react-native-reanimated';

import { apiFetch } from '@/src/api/client';
import { usePushTokenRegistration } from '@/src/hooks/usePushTokenRegistration';
import { useAuthStore } from '@/src/store/auth';
import { palette } from '@/src/theme/pillpal';

export const unstable_settings = {
  anchor: '(tabs)',
};

type AuthMeResponse = {
  id: string;
  email: string | null;
};

function AuthGuard() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasCheckedSession = useAuthStore((state) => state.hasCheckedSession);
  const setCookieSession = useAuthStore((state) => state.setCookieSession);
  const markSessionChecked = useAuthStore((state) => state.markSessionChecked);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (hasCheckedSession) return;

    let cancelled = false;

    apiFetch<AuthMeResponse>('/auth/me')
      .then((user) => {
        if (!cancelled) {
          setCookieSession({ id: user.id, email: user.email });
        }
      })
      .catch(() => {
        if (!cancelled) {
          markSessionChecked();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hasCheckedSession, markSessionChecked, setCookieSession]);

  useEffect(() => {
    if (!hasCheckedSession) return;

    const isLoginScreen = segments[0] === 'login';

    if (!isAuthenticated && !isLoginScreen) {
      router.replace('/login');
    } else if (isAuthenticated && isLoginScreen) {
      router.replace('/(tabs)');
    }
  }, [hasCheckedSession, isAuthenticated, segments, router]);

  return null;
}

export default function RootLayout() {
  const queryClient = useMemo(() => new QueryClient(), []);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  usePushTokenRegistration(isAuthenticated);

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
