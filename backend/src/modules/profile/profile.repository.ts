import { getSupabaseClient } from "../../config/supabase.js";
import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";

import type { CreateProfileBody, UpdateProfileBody } from "./profile.schema.js";
import type { ProfileRow } from "./profile.types.js";

export class ProfileRepository {
  async findByUserId(userId: string): Promise<ProfileRow | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle<ProfileRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.PROFILE_READ_FAILED,
        `Failed to load profile for user ${userId}`,
        error,
      );
    }

    return data;
  }

  async create(
    userId: string,
    payload: CreateProfileBody,
  ): Promise<ProfileRow> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        user_id: userId,
        full_name: payload.fullName,
        age_group: payload.ageGroup ?? null,
        accessibility_mode: payload.accessibilityMode,
        conditions: payload.conditions,
        allergies: payload.allergies,
        doctor_note: payload.doctorNote ?? null,
        caregiver_name: payload.caregiverName ?? null,
        caregiver_phone: payload.caregiverPhone ?? null,
      })
      .select("*")
      .single<ProfileRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.PROFILE_CREATE_FAILED,
        `Failed to create profile for user ${userId}`,
        error,
      );
    }

    return data;
  }

  async updateByUserId(
    userId: string,
    payload: UpdateProfileBody,
  ): Promise<ProfileRow | null> {
    const supabase = getSupabaseClient();
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (payload.fullName !== undefined) updateData.full_name = payload.fullName;
    if (payload.ageGroup !== undefined) updateData.age_group = payload.ageGroup;
    if (payload.accessibilityMode !== undefined)
      updateData.accessibility_mode = payload.accessibilityMode;
    if (payload.conditions !== undefined)
      updateData.conditions = payload.conditions;
    if (payload.allergies !== undefined)
      updateData.allergies = payload.allergies;
    if (payload.doctorNote !== undefined)
      updateData.doctor_note = payload.doctorNote;
    if (payload.caregiverName !== undefined)
      updateData.caregiver_name = payload.caregiverName;
    if (payload.caregiverPhone !== undefined)
      updateData.caregiver_phone = payload.caregiverPhone;

    const { data, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("user_id", userId)
      .select("*")
      .maybeSingle<ProfileRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.PROFILE_UPDATE_FAILED,
        `Failed to update profile for user ${userId}`,
        error,
      );
    }

    return data;
  }
}
