export type UserMedicationRow = {
  id: string;
  profile_id: string;
  catalog_id: string | null;
  name: string;
  active_ingredient: string | null;
  strength: string | null;
  dosage_form: string | null;
  note: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type UserMedicationDto = {
  id: string;
  profileId: string;
  catalogId: string | null;
  name: string;
  activeIngredient: string | null;
  strength: string | null;
  dosageForm: string | null;
  note: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
