import { getSupabaseClient } from "../../config/supabase.js";
import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { getPaginationRange } from "../../shared/utils/pagination.js";
import type {
  MedicineDataSourceListInput,
  MedicineLookupListInput,
} from "./medicine-lookup.schema.js";
import type {
  ExternalMedicationCandidateRow,
  MedicineDataSourceRow,
  MedicineLookupAttemptRow,
  MedicineLookupEvidenceRow,
  MedicineLookupStatus,
} from "./medicine-lookup.types.js";

export class MedicineLookupRepository {
  async listMedicineDataSources(
    input: MedicineDataSourceListInput,
  ): Promise<MedicineDataSourceRow[]> {
    const supabase = getSupabaseClient();
    const { from, to } = getPaginationRange(input);

    let query = supabase
      .from("medicine_data_sources")
      .select("*")
      .order("name", { ascending: true })
      .range(from, to);

    if (input.sourceType !== undefined) {
      query = query.eq("source_type", input.sourceType);
    }

    if (input.active !== undefined) {
      query = query.eq("is_active", input.active);
    }

    const { data, error } = await query;

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.MEDICINE_DATA_SOURCE_READ_FAILED,
        "Failed to list medicine data sources",
        error,
      );
    }

    return (data as MedicineDataSourceRow[]) ?? [];
  }

  async listAttemptsByProfileId(
    profileId: string,
    input: MedicineLookupListInput,
  ): Promise<MedicineLookupAttemptRow[]> {
    const supabase = getSupabaseClient();
    const { from, to } = getPaginationRange(input);

    let query = supabase
      .from("medicine_lookup_attempts")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (input.status !== undefined) {
      query = query.eq("status", input.status);
    }

    if (input.queryName !== undefined) {
      query = query.ilike("query_name", `%${input.queryName}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.MEDICINE_LOOKUP_READ_FAILED,
        `Failed to list medicine lookups for profile ${profileId}`,
        error,
      );
    }

    return (data as MedicineLookupAttemptRow[]) ?? [];
  }

  async findAttemptByIdAndProfileId(
    lookupAttemptId: string,
    profileId: string,
  ): Promise<MedicineLookupAttemptRow | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("medicine_lookup_attempts")
      .select("*")
      .eq("id", lookupAttemptId)
      .eq("profile_id", profileId)
      .maybeSingle<MedicineLookupAttemptRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.MEDICINE_LOOKUP_READ_FAILED,
        `Failed to read medicine lookup ${lookupAttemptId}`,
        error,
      );
    }

    return data;
  }

  async findAttemptByScanAttemptId(
    scanAttemptId: string,
    profileId: string,
  ): Promise<MedicineLookupAttemptRow | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("medicine_lookup_attempts")
      .select("*")
      .eq("scan_attempt_id", scanAttemptId)
      .eq("profile_id", profileId)
      .maybeSingle<MedicineLookupAttemptRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.MEDICINE_LOOKUP_READ_FAILED,
        `Failed to read medicine lookup for scan ${scanAttemptId}`,
        error,
      );
    }

    return data;
  }

  async createAttempt(input: {
    profileId: string;
    scanAttemptId: string | null;
    staticId: string | null;
    userMedicationId: string | null;
    status: MedicineLookupStatus;
    queryName: string | null;
    queryActiveIngredient: string | null;
    queryManufacturer: string | null;
    extractedData: unknown;
  }): Promise<MedicineLookupAttemptRow> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("medicine_lookup_attempts")
      .insert({
        profile_id: input.profileId,
        scan_attempt_id: input.scanAttemptId,
        static_id: input.staticId,
        user_medication_id: input.userMedicationId,
        status: input.status,
        query_name: input.queryName,
        query_active_ingredient: input.queryActiveIngredient,
        query_manufacturer: input.queryManufacturer,
        extracted_data: input.extractedData,
      })
      .select("*")
      .single<MedicineLookupAttemptRow>();

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

  async updateAttemptForManualConfirmation(input: {
    lookupAttemptId: string;
    profileId: string;
    userMedicationId: string;
    queryName: string | null;
    queryActiveIngredient: string | null;
    queryManufacturer: string | null;
    extractedData: unknown;
  }): Promise<MedicineLookupAttemptRow | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("medicine_lookup_attempts")
      .update({
        user_medication_id: input.userMedicationId,
        status: "needs_admin_review",
        query_name: input.queryName,
        query_active_ingredient: input.queryActiveIngredient,
        query_manufacturer: input.queryManufacturer,
        extracted_data: input.extractedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.lookupAttemptId)
      .eq("profile_id", input.profileId)
      .select("*")
      .maybeSingle<MedicineLookupAttemptRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.MEDICINE_LOOKUP_UPDATE_FAILED,
        `Failed to update medicine lookup ${input.lookupAttemptId}`,
        error,
      );
    }

    return data;
  }

  async listEvidenceByAttemptId(
    lookupAttemptId: string,
  ): Promise<MedicineLookupEvidenceRow[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("medicine_lookup_evidence")
      .select("*")
      .eq("lookup_attempt_id", lookupAttemptId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.MEDICINE_LOOKUP_READ_FAILED,
        `Failed to list medicine lookup evidence ${lookupAttemptId}`,
        error,
      );
    }

    return (data as MedicineLookupEvidenceRow[]) ?? [];
  }

  async listExternalCandidatesByAttemptId(
    lookupAttemptId: string,
  ): Promise<ExternalMedicationCandidateRow[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("external_medication_candidates")
      .select("*")
      .eq("lookup_attempt_id", lookupAttemptId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.MEDICINE_LOOKUP_READ_FAILED,
        `Failed to list external medication candidates ${lookupAttemptId}`,
        error,
      );
    }

    return (data as ExternalMedicationCandidateRow[]) ?? [];
  }
}
