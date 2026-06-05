import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { registerPushToken, type DevicePlatform } from '@/src/api/device.api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const DEVICE_ID_STORAGE_KEY = 'pillpal.deviceId';
let nativeRuntimeDeviceId: string | null = null;

function getDevicePlatform(): DevicePlatform | null {
  if (Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web') {
    return Platform.OS;
  }

  return null;
}

function getProjectId(): string | null {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
    null
  );
}

function createDeviceId(): string {
  const randomPart = Math.random().toString(36).slice(2, 12);
  return 'pillpal-' + Date.now().toString(36) + '-' + randomPart;
}

function getConstantsInstallationId(): string | null {
  const constants = Constants as typeof Constants & {
    installationId?: string;
    sessionId?: string;
  };

  return constants.installationId ?? constants.sessionId ?? null;
}

function getStableDeviceId(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const existing = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (existing) return existing;

    const next = createDeviceId();
    window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, next);
    return next;
  }

  const constantsInstallationId = getConstantsInstallationId();
  if (constantsInstallationId) return constantsInstallationId;

  if (!nativeRuntimeDeviceId) {
    nativeRuntimeDeviceId = createDeviceId();
  }

  return nativeRuntimeDeviceId;
}

async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('pillpal-caregiver-alerts', {
      name: 'PillPal caregiver alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1769E0',
    });
  }

  const existingPermission = await Notifications.getPermissionsAsync();
  let finalStatus = existingPermission.status;

  if (finalStatus !== 'granted') {
    const requestedPermission = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermission.status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId = getProjectId();
  if (!projectId) {
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

async function registerExpoPushToken(expoPushToken: string): Promise<void> {
  const platform = getDevicePlatform();
  if (!platform) return;

  await registerPushToken({
    expoPushToken,
    deviceId: getStableDeviceId(),
    platform,
  });
}

function getTokenData(token: unknown): string | null {
  if (typeof token === 'string') return token;
  if (token && typeof token === 'object' && 'data' in token) {
    const data = (token as { data?: unknown }).data;
    return typeof data === 'string' ? data : null;
  }

  return null;
}

export function usePushTokenRegistration(isAuthenticated: boolean): void {
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    getExpoPushToken()
      .then(async (expoPushToken) => {
        if (!expoPushToken || cancelled) return;
        await registerExpoPushToken(expoPushToken);
      })
      .catch((error) => {
        console.warn('Push token registration skipped:', error);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const subscription = Notifications.addPushTokenListener((token) => {
      const expoPushToken = getTokenData(token);
      if (!expoPushToken) return;

      registerExpoPushToken(expoPushToken).catch((error) => {
        console.warn('Push token refresh registration skipped:', error);
      });
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated]);
}
