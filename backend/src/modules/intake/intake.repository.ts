import { getSupabaseClient } from "../../config/supabase.js";
import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";

import type { IntakeEventRow } from "./intake.types.js";

export class IntakeRepository {
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
}
