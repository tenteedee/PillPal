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
    ingredients: row.ingredients,
    route: row.route,
    description: row.description,
    commonUses: row.common_uses,
    warnings: row.warnings,
    contraindications: row.contraindications,
    sideEffects: row.side_effects,
    interactionNotes: row.interaction_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
