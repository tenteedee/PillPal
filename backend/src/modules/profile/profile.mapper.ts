import type { ProfileDto, ProfileRow } from "./profile.types.js";

export function mapProfileRowToDto(row: ProfileRow): ProfileDto {
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name,
    ageGroup: row.age_group,
    accessibilityMode: row.accessibility_mode,
    conditions: row.conditions,
    allergies: row.allergies,
    doctorNote: row.doctor_note,
    caregiverName: row.caregiver_name,
    caregiverPhone: row.caregiver_phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
