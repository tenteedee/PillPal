export type DevicePlatform = "ios" | "android" | "web";

export type PushTokenRow = {
  id: string;
  profile_id: string;
  expo_push_token: string;
  device_id: string | null;
  platform: DevicePlatform;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_seen_at: string;
};

export type PushTokenDto = {
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
