export type MedicationCatalogRow = {
  id: string;
  name: string;
  active_ingredient: string | null;
  strength: string | null;
  dosage_form: string | null;
  manufacturer: string | null;
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
  createdAt: string;
  updatedAt: string;
};
