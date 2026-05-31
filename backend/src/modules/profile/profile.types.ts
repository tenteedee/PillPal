export type ProfileRow = {
  id: string;
  user_id: string;
  full_name: string;
  age_group: string | null;
  accessibility_mode: string;
  conditions: unknown[];
  allergies: unknown[];
  doctor_note: string | null;
  caregiver_name: string | null;
  caregiver_phone: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileDto = {
  id: string;
  userId: string;
  fullName: string;
  ageGroup: string | null;
  accessibilityMode: string;
  conditions: unknown[];
  allergies: unknown[];
  doctorNote: string | null;
  caregiverName: string | null;
  caregiverPhone: string | null;
  createdAt: string;
  updatedAt: string;
};
