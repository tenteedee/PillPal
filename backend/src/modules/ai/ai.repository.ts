import { getSupabaseClient } from "../../config/supabase.js";
import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import type { MedicationCatalogRow } from "../medication-catalog/medication-catalog.types.js";
import type { UserMedicationRow } from "../medication/medication.types.js";
import type {
  MedicationScanCandidateDto,
  MedicationScanExtraction,
  ScanAttemptRow,
} from "./ai.types.js";

export class AiRepository {
  async findCatalogCandidates(
    extraction: MedicationScanExtraction,
  ): Promise<MedicationCatalogRow[]> {
    const supabase = getSupabaseClient();
    const searchTerm = extraction.name ?? extraction.activeIngredient;

    if (!searchTerm) {
      return [];
    }

    let query = supabase
      .from("medication_catalogs")
      .select("*")
      .limit(10);

    query = query.or(
      `name.ilike.%${escapeIlikeValue(searchTerm)}%,active_ingredient.ilike.%${escapeIlikeValue(searchTerm)}%`,
    );

    const { data, error } = await query;

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.MEDICATION_CATALOG_READ_FAILED,
        "Failed to match medication catalog for scan",
        error,
      );
    }

    return (data as MedicationCatalogRow[]) ?? [];
  }

  async findActiveUserMedicationsByCatalogIds(
    profileId: string,
    catalogIds: string[],
  ): Promise<UserMedicationRow[]> {
    if (catalogIds.length === 0) {
      return [];
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("user_medications")
      .select("*")
      .eq("profile_id", profileId)
      .eq("is_active", true)
      .in("catalog_id", catalogIds);

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.MEDICATION_READ_FAILED,
        `Failed to match user medications for profile ${profileId}`,
        error,
      );
    }

    return (data as UserMedicationRow[]) ?? [];
  }

  async createScanAttempt(input: {
    profileId: string;
    staticId: string;
    imageUrl: string;
    extractedData: MedicationScanExtraction;
    aiResult: unknown;
    candidates: MedicationScanCandidateDto[];
  }): Promise<ScanAttemptRow> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("scan_attempts")
      .insert({
        profile_id: input.profileId,
        static_id: input.staticId,
        image_url: input.imageUrl,
        extracted_data: input.extractedData,
        ai_result: input.aiResult,
        candidates: input.candidates,
      })
      .select("*")
      .single<ScanAttemptRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.AI_SCAN_ATTEMPT_CREATE_FAILED,
        `Failed to save scan attempt for profile ${input.profileId}`,
        error,
      );
    }

    return data;
  }
}

function escapeIlikeValue(value: string): string {
  return value.replaceAll("%", "\\%").replaceAll("_", "\\_").replaceAll(",", " ");
}
