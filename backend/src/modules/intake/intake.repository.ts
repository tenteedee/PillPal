import { getSupabaseClient } from "../../config/supabase.js";
import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { getPaginationRange } from "../../shared/utils/pagination.js";

import type { CreateIntakeBody, IntakeListInput } from "./intake.schema.js";
import type { IntakeEventRow } from "./intake.types.js";

export class IntakeRepository {
  async listByProfileId(
    profileId: string,
    input: IntakeListInput,
  ): Promise<IntakeEventRow[]> {
    const supabase = getSupabaseClient();
    const { from, to } = getPaginationRange(input);

    let query = supabase
      .from("intake_events")
      .select("*")
      .eq("profile_id", profileId)
      .order("taken_at", { ascending: false })
      .range(from, to);

    if (input.userMedicationId !== undefined) {
      query = query.eq("user_medication_id", input.userMedicationId);
    }

    if (input.scheduleId !== undefined) {
      query = query.eq("medication_schedule_id", input.scheduleId);
    }

    if (input.status !== undefined) {
      query = query.eq("status", input.status);
    }

    if (input.takenFrom !== undefined) {
      query = query.gte("taken_at", input.takenFrom);
    }

    if (input.takenTo !== undefined) {
      query = query.lt("taken_at", input.takenTo);
    }

    const { data, error } = await query;

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.INTAKE_READ_FAILED,
        `Failed to list intake events for profile ${profileId}`,
        error,
      );
    }

    return (data as IntakeEventRow[]) ?? [];
  }

  async create(input: {
    profileId: string;
    payload: CreateIntakeBody;
    warningSnapshot: unknown;
  }): Promise<IntakeEventRow> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("intake_events")
      .insert({
        profile_id: input.profileId,
        user_medication_id: input.payload.userMedicationId,
        medication_schedule_id: input.payload.scheduleId ?? null,
        scheduled_time: input.payload.scheduledTime ?? null,
        dose_amount: input.payload.doseAmount ?? null,
        taken_at: input.payload.takenAt ?? new Date().toISOString(),
        status: "taken",
        confirmed_by: "user",
        safety_check_event_id: input.payload.safetyCheckEventId,
        warning_snapshot: input.warningSnapshot,
      })
      .select("*")
      .single<IntakeEventRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.INTAKE_CREATE_FAILED,
        "Failed to create intake event",
        error,
      );
    }

    return data;
  }

  async listByProfileIdAndTakenAtRange(
    profileId: string,
    startIso: string,
    endIso: string,
  ): Promise<IntakeEventRow[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("intake_events")
      .select("*")
      .eq("profile_id", profileId)
      .gte("taken_at", startIso)
      .lt("taken_at", endIso)
      .order("taken_at", { ascending: false });

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.INTAKE_READ_FAILED,
        `Failed to list intake events for profile ${profileId}`,
        error,
      );
    }

    return (data as IntakeEventRow[]) ?? [];
  }

  async listTakenByMedicationAndTakenAtRange(
    profileId: string,
    medicationId: string,
    startIso: string,
    endIso: string,
  ): Promise<IntakeEventRow[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("intake_events")
      .select("*")
      .eq("profile_id", profileId)
      .eq("user_medication_id", medicationId)
      .eq("status", "taken")
      .gte("taken_at", startIso)
      .lt("taken_at", endIso)
      .order("taken_at", { ascending: false });

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.INTAKE_READ_FAILED,
        `Failed to list medication intake events ${medicationId}`,
        error,
      );
    }

    return (data as IntakeEventRow[]) ?? [];
  }

  async findLastTakenByMedication(
    profileId: string,
    medicationId: string,
  ): Promise<IntakeEventRow | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("intake_events")
      .select("*")
      .eq("profile_id", profileId)
      .eq("user_medication_id", medicationId)
      .eq("status", "taken")
      .order("taken_at", { ascending: false })
      .limit(1)
      .maybeSingle<IntakeEventRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.INTAKE_READ_FAILED,
        `Failed to read last medication intake ${medicationId}`,
        error,
      );
    }

    return data;
  }
}
