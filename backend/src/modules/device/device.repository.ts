import { getSupabaseClient } from "../../config/supabase.js";
import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import type { RegisterPushTokenBody } from "./device.schema.js";
import type { PushTokenRow } from "./device.types.js";

export class DeviceRepository {
  async findExistingToken(
    profileId: string,
    payload: RegisterPushTokenBody,
  ): Promise<PushTokenRow | null> {
    const supabase = getSupabaseClient();
    let query = supabase.from("push_tokens").select("*").eq("profile_id", profileId);

    if (payload.deviceId) {
      query = query.eq("device_id", payload.deviceId);
    } else {
      query = query.eq("expo_push_token", payload.expoPushToken);
    }

    const { data, error } = await query.maybeSingle<PushTokenRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.PUSH_TOKEN_READ_FAILED,
        `Failed to read push token for profile ${profileId}`,
        error,
      );
    }

    return data;
  }

  async listActiveByProfileId(profileId: string): Promise<PushTokenRow[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("push_tokens")
      .select("*")
      .eq("profile_id", profileId)
      .eq("is_active", true)
      .order("last_seen_at", { ascending: false });

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.PUSH_TOKEN_READ_FAILED,
        `Failed to list push tokens for profile ${profileId}`,
        error,
      );
    }

    return (data as PushTokenRow[]) ?? [];
  }

  async create(
    profileId: string,
    payload: RegisterPushTokenBody,
  ): Promise<PushTokenRow> {
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("push_tokens")
      .insert({
        profile_id: profileId,
        expo_push_token: payload.expoPushToken,
        device_id: payload.deviceId ?? null,
        platform: payload.platform,
        is_active: true,
        last_seen_at: now,
        updated_at: now,
      })
      .select("*")
      .single<PushTokenRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.PUSH_TOKEN_CREATE_FAILED,
        `Failed to create push token for profile ${profileId}`,
        error,
      );
    }

    return data;
  }

  async updateById(
    id: string,
    profileId: string,
    payload: RegisterPushTokenBody,
  ): Promise<PushTokenRow | null> {
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("push_tokens")
      .update({
        expo_push_token: payload.expoPushToken,
        device_id: payload.deviceId ?? null,
        platform: payload.platform,
        is_active: true,
        last_seen_at: now,
        updated_at: now,
      })
      .eq("id", id)
      .eq("profile_id", profileId)
      .select("*")
      .maybeSingle<PushTokenRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.PUSH_TOKEN_UPDATE_FAILED,
        `Failed to update push token ${id}`,
        error,
      );
    }

    return data;
  }

  async deactivateById(id: string, profileId: string): Promise<PushTokenRow | null> {
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("push_tokens")
      .update({
        is_active: false,
        updated_at: now,
      })
      .eq("id", id)
      .eq("profile_id", profileId)
      .eq("is_active", true)
      .select("*")
      .maybeSingle<PushTokenRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.PUSH_TOKEN_UPDATE_FAILED,
        `Failed to deactivate push token ${id}`,
        error,
      );
    }

    return data;
  }
}
