import type {
  MedicationScheduleDto,
  MedicationScheduleRow,
} from "./schedule.types.js";

export function mapMedicationScheduleRowToDto(
  row: MedicationScheduleRow,
): MedicationScheduleDto {
  return {
    id: row.id,
    profileId: row.profile_id,
    userMedicationId: row.user_medication_id,
    doseAmount: row.dose_amount,
    times: row.times,
    timesPerDay: row.times_per_day,
    minIntervalHours: row.min_interval_hours,
    instruction: row.instruction,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
