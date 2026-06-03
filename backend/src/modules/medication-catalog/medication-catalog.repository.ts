import { getSupabaseClient } from '../../config/supabase.js';
import { ERROR_CODE } from '../../shared/constants/error/error-codes.js';
import { HTTP_STATUS } from '../../shared/constants/http/http-status.js';
import { HttpError } from '../../shared/errors/http-error.js';
import { getPaginationRange } from '../../shared/utils/pagination.js';

import type {
  CreateMedicationCatalogBody,
  MedicationCatalogGetListInput,
  UpdateMedicationCatalogBody,
} from './medication-catalog.schema.js';
import type { MedicationCatalogRow } from './medication-catalog.types.js';

export class MedicationCatalogRepository {
  async list(
    input: MedicationCatalogGetListInput,
  ): Promise<MedicationCatalogRow[]> {
    const supabase = getSupabaseClient();
    const { from, to } = getPaginationRange(input);

    let query = supabase
      .from('medication_catalogs')
      .select('*')
      .order('name', { ascending: true });

    if (input.name !== undefined) {
      query = query.ilike('name', `%${input.name}%`);
    }

    if (input.activeIngredient !== undefined) {
      query = query.ilike('active_ingredient', `%${input.activeIngredient}%`);
    }

    if (input.dosageForm !== undefined) {
      query = query.ilike('dosage_form', `%${input.dosageForm}%`);
    }

    if (input.manufacturer !== undefined) {
      query = query.ilike('manufacturer', `%${input.manufacturer}%`);
    }

    const { data, error } = await query.range(from, to);

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.MEDICATION_CATALOG_READ_FAILED,
        'Failed to list medication catalogs',
        error,
      );
    }

    return (data as MedicationCatalogRow[]) ?? [];
  }

  async create(
    payload: CreateMedicationCatalogBody,
  ): Promise<MedicationCatalogRow> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('medication_catalogs')
      .insert({
        name: payload.name,
        active_ingredient: payload.activeIngredient ?? null,
        strength: payload.strength ?? null,
        dosage_form: payload.dosageForm ?? null,
        manufacturer: payload.manufacturer ?? null,
        ingredients: payload.ingredients ?? [],
        route: payload.route ?? null,
        description: payload.description ?? null,
        common_uses: payload.commonUses ?? [],
        warnings: payload.warnings ?? [],
        contraindications: payload.contraindications ?? [],
        side_effects: payload.sideEffects ?? [],
        interaction_notes: payload.interactionNotes ?? [],
      })
      .select('*')
      .single<MedicationCatalogRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.MEDICATION_CATALOG_CREATE_FAILED,
        `Failed to create medication catalog ${payload.name}`,
        error,
      );
    }

    return data;
  }

  async findById(id: string): Promise<MedicationCatalogRow | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('medication_catalogs')
      .select('*')
      .eq('id', id)
      .maybeSingle<MedicationCatalogRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.MEDICATION_CATALOG_READ_FAILED,
        `Failed to read medication catalog ${id}`,
        error,
      );
    }

    return data;
  }

  async updateById(
    id: string,
    payload: UpdateMedicationCatalogBody,
  ): Promise<MedicationCatalogRow | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('medication_catalogs')
      .update({
        name: payload.name,
        active_ingredient: payload.activeIngredient ?? null,
        strength: payload.strength ?? null,
        dosage_form: payload.dosageForm ?? null,
        manufacturer: payload.manufacturer ?? null,
        ingredients: payload.ingredients ?? [],
        route: payload.route ?? null,
        description: payload.description ?? null,
        common_uses: payload.commonUses ?? [],
        warnings: payload.warnings ?? [],
        contraindications: payload.contraindications ?? [],
        side_effects: payload.sideEffects ?? [],
        interaction_notes: payload.interactionNotes ?? [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .maybeSingle<MedicationCatalogRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.MEDICATION_CATALOG_UPDATE_FAILED,
        `Failed to update medication catalog ${id}`,
        error,
      );
    }

    return data;
  }

  async deleteById(id: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    const { error, count } = await supabase
      .from('medication_catalogs')
      .delete({ count: 'exact' })
      .eq('id', id);

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.MEDICATION_CATALOG_DELETE_FAILED,
        `Failed to delete medication catalog ${id}`,
        error,
      );
    }

    return (count ?? 0) > 0;
  }
}
