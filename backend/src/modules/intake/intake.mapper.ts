import type { IntakeEventDto, IntakeEventRow } from "./intake.types.js";

export function mapIntakeEventRowToDto(row: IntakeEventRow): IntakeEventDto {
  return {
    id: row.id,
    profileId: row.profile_id,
    userMedicationId: row.user_medication_id,
    scheduleId: row.medication_schedule_id,
    scheduledTime: row.scheduled_time,
    doseAmount: row.dose_amount,
    takenAt: row.taken_at,
    status: row.status,
    confirmedBy: row.confirmed_by,
    safetyCheckEventId: row.safety_check_event_id,
    warningSnapshot: row.warning_snapshot,
    confirmedAfterWarning: hasWarningSnapshot(row.warning_snapshot),
    createdAt: row.created_at,
  };
}

function hasWarningSnapshot(value: unknown): boolean {
  return Array.isArray(value) ? value.length > 0 : Boolean(value);
}
