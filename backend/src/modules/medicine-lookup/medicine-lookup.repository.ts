import { getSupabaseClient } from "../../config/supabase.js";
import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import type {
  ExternalMedicineCandidate,
  MedicineLookupEvidence,
  MedicineLookupRow,
  MedicineLookupStatus,
} from "./medicine-lookup.types.js";

export class MedicineLookupRepository {
  async createPending(input: {
    profileId: string;
    scanAttemptId: string;
    staticId: string;
    imageUrl: string | null;
    query: string | null;
    extractedData: unknown;
  }): Promise<MedicineLookupRow> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("medicine_lookups")
      .insert({
        profile_id: input.profileId,
        scan_attempt_id: input.scanAttemptId,
        static_id: input.staticId,
        image_url: input.imageUrl,
        query: input.query,
        extracted_data: input.extractedData,
        status: "pending",
      })
      .select("*")
      .single<MedicineLookupRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.MEDICINE_LOOKUP_CREATE_FAILED,
        `Failed to create medicine lookup for profile ${input.profileId}`,
        error,
      );
    }

    return data;
  }

  async findByIdAndProfileId(
    lookupId: string,
    profileId: string,
  ): Promise<MedicineLookupRow | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("medicine_lookups")
      .select("*")
      .eq("id", lookupId)
      .eq("profile_id", profileId)
      .maybeSingle<MedicineLookupRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.MEDICINE_LOOKUP_READ_FAILED,
        `Failed to read medicine lookup ${lookupId}`,
        error,
      );
    }

    return data;
  }

  async findVerifiedByUserMedicationId(
    profileId: string,
    userMedicationId: string,
  ): Promise<MedicineLookupRow | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("medicine_lookups")
      .select("*")
      .eq("profile_id", profileId)
      .eq("user_medication_id", userMedicationId)
      .eq("status", "saved")
      .maybeSingle<MedicineLookupRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.MEDICINE_LOOKUP_READ_FAILED,
        `Failed to read saved medicine lookup for medication ${userMedicationId}`,
        error,
      );
    }

    return data;
  }

  async updateVerification(input: {
    lookupId: string;
    profileId: string;
    status: MedicineLookupStatus;
    evidence: MedicineLookupEvidence;
    externalCandidates: ExternalMedicineCandidate[];
  }): Promise<MedicineLookupRow | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("medicine_lookups")
      .update({
        status: input.status,
        evidence: input.evidence,
        external_candidates: input.externalCandidates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.lookupId)
      .eq("profile_id", input.profileId)
      .select("*")
      .maybeSingle<MedicineLookupRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.MEDICINE_LOOKUP_UPDATE_FAILED,
        `Failed to verify medicine lookup ${input.lookupId}`,
        error,
      );
    }

    return data;
  }

  async markSaved(input: {
    lookupId: string;
    profileId: string;
    userMedicationId: string;
  }): Promise<MedicineLookupRow | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("medicine_lookups")
      .update({
        status: "saved",
        user_medication_id: input.userMedicationId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.lookupId)
      .eq("profile_id", input.profileId)
      .select("*")
      .maybeSingle<MedicineLookupRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.MEDICINE_LOOKUP_UPDATE_FAILED,
        `Failed to save medicine lookup ${input.lookupId}`,
        error,
      );
    }

    return data;
  }
}
