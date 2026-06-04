import { getSupabaseClient } from "../../config/supabase.js";
import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import type {
  SafetyCheckEventRow,
  SafetyCheckSource,
  SafetyReason,
  SafetyResult,
} from "./safety.types.js";

export class SafetyRepository {
  async createSafetyCheckEvent(input: {
    profileId: string;
    userMedicationId: string;
    scheduleId: string | null;
    scheduledTime: string | null;
    result: SafetyResult;
    canConfirmIntake: boolean;
    reasons: SafetyReason[];
    suggestedAction: string | null;
    source: SafetyCheckSource;
    metadata?: Record<string, unknown>;
  }): Promise<SafetyCheckEventRow> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("safety_check_events")
      .insert({
        profile_id: input.profileId,
        user_medication_id: input.userMedicationId,
        medication_schedule_id: input.scheduleId,
        scheduled_time: input.scheduledTime,
        result: input.result,
        can_confirm_intake: input.canConfirmIntake,
        reasons: input.reasons,
        suggested_action: input.suggestedAction,
        source: input.source,
        metadata: input.metadata ?? {},
      })
      .select("*")
      .single<SafetyCheckEventRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.SAFETY_CHECK_CREATE_FAILED,
        "Failed to create safety check event",
        error,
      );
    }

    return data;
  }
}
