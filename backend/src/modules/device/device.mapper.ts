import type { PushTokenDto, PushTokenRow } from "./device.types.js";

export function mapPushTokenRowToDto(row: PushTokenRow): PushTokenDto {
  return {
    id: row.id,
    profileId: row.profile_id,
    expoPushToken: row.expo_push_token,
    deviceId: row.device_id,
    platform: row.platform,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastSeenAt: row.last_seen_at,
  };
}
