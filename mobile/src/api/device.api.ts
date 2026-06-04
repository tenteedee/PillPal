import { apiFetch } from './client';

export type DevicePlatform = 'ios' | 'android' | 'web';

export type PushToken = {
  id: string;
  profileId: string;
  expoPushToken: string;
  deviceId: string | null;
  platform: DevicePlatform;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string;
};

export type RegisterPushTokenRequest = {
  expoPushToken: string;
  deviceId?: string | null;
  platform: DevicePlatform;
};

export async function registerPushToken(payload: RegisterPushTokenRequest): Promise<PushToken> {
  return apiFetch<PushToken>('/devices/push-token', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listPushTokens(): Promise<PushToken[]> {
  return apiFetch<PushToken[]>('/devices/push-tokens');
}
