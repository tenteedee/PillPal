export type MedicationScheduleRow = {
  id: string;
  profile_id: string;
  user_medication_id: string;
  dose_amount: string;
  times: string[];
  times_per_day: number;
  min_interval_hours: number | null;
  instruction: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MedicationScheduleDto = {
  id: string;
  profileId: string;
  userMedicationId: string;
  doseAmount: string;
  times: string[];
  timesPerDay: number;
  minIntervalHours: number | null;
  instruction: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MedicationScheduleWithMedicationRow = MedicationScheduleRow & {
  medication_name: string;
};
