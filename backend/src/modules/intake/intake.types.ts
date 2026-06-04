export type IntakeStatus = "taken" | "missed" | "skipped" | "blocked_attempt";

export type IntakeEventRow = {
  id: string;
  profile_id: string;
  user_medication_id: string;
  medication_schedule_id: string | null;
  scheduled_time: string | null;
  dose_amount: string | null;
  taken_at: string;
  status: IntakeStatus;
  confirmed_by: string;
  safety_check_event_id: string | null;
  warning_snapshot: unknown;
  created_at: string;
};

export type IntakeEventDto = {
  id: string;
  profileId: string;
  userMedicationId: string;
  scheduleId: string | null;
  scheduledTime: string | null;
  doseAmount: string | null;
  takenAt: string;
  status: IntakeStatus;
  confirmedBy: string;
  safetyCheckEventId: string | null;
  warningSnapshot: unknown;
  confirmedAfterWarning: boolean;
  createdAt: string;
};
