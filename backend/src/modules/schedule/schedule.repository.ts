import { getSupabaseClient } from "../../config/supabase.js";
import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { getPaginationRange } from "../../shared/utils/pagination.js";

import type {
  CreateScheduleBody,
  ScheduleGetListInput,
  UpdateScheduleBody,
} from "./schedule.schema.js";
import type { MedicationScheduleRow } from "./schedule.types.js";

export class ScheduleRepository {
  async listByProfileId(
    profileId: string,
    input: ScheduleGetListInput,
  ): Promise<MedicationScheduleRow[]> {
    const supabase = getSupabaseClient();
    const { from, to } = getPaginationRange(input);

    let query = supabase
      .from("medication_schedules")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (input.userMedicationId !== undefined) {
      query = query.eq("user_medication_id", input.userMedicationId);
    }

    if (input.active !== undefined) {
      query = query.eq("is_active", input.active);
    }

    const { data, error } = await query;

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.SCHEDULE_READ_FAILED,
        `Failed to list schedules for profile ${profileId}`,
        error,
      );
    }

    return (data as MedicationScheduleRow[]) ?? [];
  }

  async create(
    profileId: string,
    payload: CreateScheduleBody,
  ): Promise<MedicationScheduleRow> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("medication_schedules")
      .insert({
        profile_id: profileId,
        user_medication_id: payload.userMedicationId,
        dose_amount: payload.doseAmount,
        times: payload.times,
        times_per_day: payload.timesPerDay,
        min_interval_hours: payload.minIntervalHours ?? null,
        instruction: payload.instruction ?? null,
      })
      .select("*")
      .single<MedicationScheduleRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.SCHEDULE_CREATE_FAILED,
        `Failed to create schedule for profile ${profileId}`,
        error,
      );
    }

    return data;
  }

  async findByIdAndProfileId(
    scheduleId: string,
    profileId: string,
  ): Promise<MedicationScheduleRow | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("medication_schedules")
      .select("*")
      .eq("id", scheduleId)
      .eq("profile_id", profileId)
      .maybeSingle<MedicationScheduleRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.SCHEDULE_READ_FAILED,
        `Failed to read schedule ${scheduleId}`,
        error,
      );
    }

    return data;
  }

  async listActiveByMedicationId(
    profileId: string,
    userMedicationId: string,
  ): Promise<MedicationScheduleRow[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("medication_schedules")
      .select("*")
      .eq("profile_id", profileId)
      .eq("user_medication_id", userMedicationId)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.SCHEDULE_READ_FAILED,
        `Failed to list active schedules for medication ${userMedicationId}`,
        error,
      );
    }

    return (data as MedicationScheduleRow[]) ?? [];
  }

  async updateByIdAndProfileId(
    scheduleId: string,
    profileId: string,
    payload: UpdateScheduleBody,
  ): Promise<MedicationScheduleRow | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("medication_schedules")
      .update({
        user_medication_id: payload.userMedicationId,
        dose_amount: payload.doseAmount,
        times: payload.times,
        times_per_day: payload.timesPerDay,
        min_interval_hours: payload.minIntervalHours,
        instruction: payload.instruction,
        is_active: payload.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", scheduleId)
      .eq("profile_id", profileId)
      .select("*")
      .maybeSingle<MedicationScheduleRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.SCHEDULE_UPDATE_FAILED,
        `Failed to update schedule ${scheduleId}`,
        error,
      );
    }

    return data;
  }

  async pauseByIdAndProfileId(
    scheduleId: string,
    profileId: string,
  ): Promise<MedicationScheduleRow | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("medication_schedules")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", scheduleId)
      .eq("profile_id", profileId)
      .select("*")
      .maybeSingle<MedicationScheduleRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.SCHEDULE_UPDATE_FAILED,
        `Failed to pause schedule ${scheduleId}`,
        error,
      );
    }

    return data;
  }

  async deleteByIdAndProfileId(
    scheduleId: string,
    profileId: string,
  ): Promise<boolean> {
    const supabase = getSupabaseClient();

    const { error, count } = await supabase
      .from("medication_schedules")
      .delete({ count: "exact" })
      .eq("id", scheduleId)
      .eq("profile_id", profileId);

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.SCHEDULE_DELETE_FAILED,
        `Failed to delete schedule ${scheduleId}`,
        error,
      );
    }

    return (count ?? 0) > 0;
  }
}
