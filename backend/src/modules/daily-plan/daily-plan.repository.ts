import { getSupabaseClient } from "../../config/supabase.js";
import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import type { UserMedicationRow } from "../medication/medication.types.js";
import type { MedicationScheduleRow } from "../schedule/schedule.types.js";
import type { DailyPlanScheduleMedicationRow } from "./daily-plan.types.js";

export class DailyPlanRepository {
  async listActiveScheduleMedicationsByProfileId(
    profileId: string,
  ): Promise<DailyPlanScheduleMedicationRow[]> {
    const supabase = getSupabaseClient();

    const { data: scheduleData, error: scheduleError } = await supabase
      .from("medication_schedules")
      .select("*")
      .eq("profile_id", profileId)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (scheduleError) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.DAILY_PLAN_READ_FAILED,
        `Failed to list active schedules for profile ${profileId}`,
        scheduleError,
      );
    }

    const schedules = (scheduleData as MedicationScheduleRow[]) ?? [];
    const medicationIds = Array.from(
      new Set(schedules.map((schedule) => schedule.user_medication_id)),
    );

    if (medicationIds.length === 0) {
      return [];
    }

    const { data: medicationData, error: medicationError } = await supabase
      .from("user_medications")
      .select("*")
      .eq("profile_id", profileId)
      .eq("is_active", true)
      .in("id", medicationIds);

    if (medicationError) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.DAILY_PLAN_READ_FAILED,
        `Failed to list medications for daily plan profile ${profileId}`,
        medicationError,
      );
    }

    const medicationsById = new Map(
      ((medicationData as UserMedicationRow[]) ?? []).map((medication) => [
        medication.id,
        medication,
      ]),
    );

    return schedules.flatMap((schedule) => {
      const medication = medicationsById.get(schedule.user_medication_id);
      if (!medication) {
        return [];
      }

      return {
        scheduleId: schedule.id,
        profileId: schedule.profile_id,
        userMedicationId: schedule.user_medication_id,
        medicationName: medication.name,
        activeIngredient: medication.active_ingredient,
        strength: medication.strength,
        dosageForm: medication.dosage_form,
        imageUrl: medication.image_url,
        doseAmount: schedule.dose_amount,
        times: schedule.times,
        instruction: schedule.instruction,
      };
    });
  }
}
