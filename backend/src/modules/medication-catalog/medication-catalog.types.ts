export type MedicationCatalogRow = {
  id: string;
  name: string;
  active_ingredient: string | null;
  strength: string | null;
  dosage_form: string | null;
  manufacturer: string | null;
  ingredients: unknown[];
  route: string | null;
  description: string | null;
  common_uses: unknown[];
  warnings: unknown[];
  contraindications: unknown[];
  side_effects: unknown[];
  interaction_notes: unknown[];
  created_at: string;
  updated_at: string;
};

export type MedicationCatalogDto = {
  id: string;
  name: string;
  activeIngredient: string | null;
  strength: string | null;
  dosageForm: string | null;
  manufacturer: string | null;
  ingredients: unknown[];
  route: string | null;
  description: string | null;
  commonUses: unknown[];
  warnings: unknown[];
  contraindications: unknown[];
  sideEffects: unknown[];
  interactionNotes: unknown[];
  createdAt: string;
  updatedAt: string;
};
