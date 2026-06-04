import type { SafetyCheckDto, SafetyCheckEventRow } from "./safety.types.js";

export function mapSafetyCheckEventRowToDto(
  row: SafetyCheckEventRow,
): SafetyCheckDto {
  return {
    id: row.id,
    profileId: row.profile_id,
    userMedicationId: row.user_medication_id,
    scheduleId: row.medication_schedule_id,
    scheduledTime: row.scheduled_time,
    result: row.result,
    canConfirmIntake: row.can_confirm_intake,
    reasons: row.reasons,
    suggestedAction: row.suggested_action,
    checkedAt: row.checked_at,
    source: row.source,
  };
}
