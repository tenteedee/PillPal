import { getSupabaseClient } from "../../config/supabase.js";
import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { getPaginationRange } from "../../shared/utils/pagination.js";

import type {
  CreateMedicationBody,
  MedicationGetListInput,
  UpdateMedicationBody,
} from "./medication.schema.js";
import type { UserMedicationRow } from "./medication.types.js";

export class MedicationRepository {
  async listByProfileId(
    profileId: string,
    input: MedicationGetListInput,
  ): Promise<UserMedicationRow[]> {
    const supabase = getSupabaseClient();
    const { from, to } = getPaginationRange(input);

    let query = supabase
      .from("user_medications")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (input.name !== undefined) {
      query = query.ilike("name", `%${input.name}%`);
    }

    if (input.activeIngredient !== undefined) {
      query = query.ilike("active_ingredient", `%${input.activeIngredient}%`);
    }

    if (input.strength !== undefined) {
      query = query.ilike("strength", `%${input.strength}%`);
    }

    if (input.dosageForm !== undefined) {
      query = query.ilike("dosage_form", `%${input.dosageForm}%`);
    }

    if (input.active !== undefined) {
      query = query.eq("is_active", input.active);
    }

    const { data, error } = await query;

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.MEDICATION_READ_FAILED,
        `Failed to list medications for profile ${profileId}`,
        error,
      );
    }

    return (data as UserMedicationRow[]) ?? [];
  }

  async create(
    profileId: string,
    payload: CreateMedicationBody,
  ): Promise<UserMedicationRow> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("user_medications")
      .insert({
        profile_id: profileId,
        catalog_id: payload.catalogId ?? null,
        name: payload.name,
        active_ingredient: payload.activeIngredient ?? null,
        strength: payload.strength ?? null,
        dosage_form: payload.dosageForm ?? null,
        note: payload.note ?? null,
        image_url: payload.imageUrl ?? null,
      })
      .select("*")
      .single<UserMedicationRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.MEDICATION_CREATE_FAILED,
        `Failed to create medication for profile ${profileId}`,
        error,
      );
    }

    return data;
  }

  async findByIdAndProfileId(
    medicationId: string,
    profileId: string,
  ): Promise<UserMedicationRow | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("user_medications")
      .select("*")
      .eq("id", medicationId)
      .eq("profile_id", profileId)
      .maybeSingle<UserMedicationRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.MEDICATION_READ_FAILED,
        `Failed to read medication ${medicationId}`,
        error,
      );
    }

    return data;
  }

  async updateByIdAndProfileId(
    medicationId: string,
    profileId: string,
    payload: UpdateMedicationBody,
  ): Promise<UserMedicationRow | null> {
    const supabase = getSupabaseClient();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (payload.catalogId !== undefined) updateData.catalog_id = payload.catalogId;
    updateData.name = payload.name;
    if (payload.activeIngredient !== undefined)
      updateData.active_ingredient = payload.activeIngredient;
    if (payload.strength !== undefined) updateData.strength = payload.strength;
    if (payload.dosageForm !== undefined) updateData.dosage_form = payload.dosageForm;
    if (payload.note !== undefined) updateData.note = payload.note;
    if (payload.imageUrl !== undefined) updateData.image_url = payload.imageUrl;
    if (payload.isActive !== undefined) updateData.is_active = payload.isActive;

    const { data, error } = await supabase
      .from("user_medications")
      .update(updateData)
      .eq("id", medicationId)
      .eq("profile_id", profileId)
      .select("*")
      .maybeSingle<UserMedicationRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.MEDICATION_UPDATE_FAILED,
        `Failed to update medication ${medicationId}`,
        error,
      );
    }

    return data;
  }

  async stopByIdAndProfileId(
    medicationId: string,
    profileId: string,
  ): Promise<UserMedicationRow | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("user_medications")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", medicationId)
      .eq("profile_id", profileId)
      .select("*")
      .maybeSingle<UserMedicationRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.MEDICATION_UPDATE_FAILED,
        `Failed to stop medication ${medicationId}`,
        error,
      );
    }

    return data;
  }

  async deleteByIdAndProfileId(
    medicationId: string,
    profileId: string,
  ): Promise<boolean> {
    const supabase = getSupabaseClient();

    const { error, count } = await supabase
      .from("user_medications")
      .delete({ count: "exact" })
      .eq("id", medicationId)
      .eq("profile_id", profileId);

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.MEDICATION_DELETE_FAILED,
        `Failed to delete medication ${medicationId}`,
        error,
      );
    }

    return (count ?? 0) > 0;
  }
}
