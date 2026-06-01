import type { UserMedicationDto, UserMedicationRow } from './medication.types.js';

export function mapUserMedicationRowToDto(
  row: UserMedicationRow,
): UserMedicationDto {
  return {
    id: row.id,
    profileId: row.profile_id,
    catalogId: row.catalog_id,
    name: row.name,
    activeIngredient: row.active_ingredient,
    strength: row.strength,
    dosageForm: row.dosage_form,
    note: row.note,
    imageUrl: row.image_url,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
