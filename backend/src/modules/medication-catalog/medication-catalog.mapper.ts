import type {
  MedicationCatalogDto,
  MedicationCatalogRow,
} from './medication-catalog.types.js';

export function mapMedicationCatalogRowToDto(
  row: MedicationCatalogRow,
): MedicationCatalogDto {
  return {
    id: row.id,
    name: row.name,
    activeIngredient: row.active_ingredient,
    strength: row.strength,
    dosageForm: row.dosage_form,
    manufacturer: row.manufacturer,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
