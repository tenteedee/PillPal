import type { IntakeEventRow } from "../intake/intake.types.js";
import type { UserMedicationRow } from "../medication/medication.types.js";
import type { ProfileRow } from "../profile/profile.types.js";
import type { MedicationScheduleRow } from "../schedule/schedule.types.js";

export type SafetyCheckSource = "manual" | "today_plan" | "scan";
export type SafetyResult = "allowed" | "warning" | "blocked";
export type SafetySeverity = "info" | "warning" | "blocked";

export type SafetyReasonCode =
  | "MEDICATION_INACTIVE"
  | "ALLERGY_MATCH"
  | "MIN_INTERVAL_VIOLATION"
  | "DAILY_DOSE_LIMIT_REACHED"
  | "SCHEDULE_NOT_FOUND"
  | "SCHEDULE_INACTIVE"
  | "SCHEDULE_MEDICATION_MISMATCH"
  | "NOT_SCHEDULED_TIME"
  | "TOO_EARLY"
  | "DOSE_TIME_PASSED"
  | "MISSING_ACTIVE_INGREDIENT"
  | "MEDICATION_NOT_VERIFIED_IN_CATALOG";

export type SafetyReason = {
  code: SafetyReasonCode;
  severity: SafetySeverity;
  message: string;
  metadata?: Record<string, unknown>;
};

export type SafetyRuleInput = {
  now: Date;
  timeZone: string;
  profile: ProfileRow;
  medication: UserMedicationRow;
  schedule: MedicationScheduleRow | null;
  scheduledTime: string | null;
  todayTakenCount: number;
  lastTakenAt: string | null;
  medicationVerifiedByExternalLookup: boolean;
};

export type SafetyRuleOutput = {
  result: SafetyResult;
  canConfirmIntake: boolean;
  reasons: SafetyReason[];
  suggestedAction: string | null;
};

export type SafetyCheckEventRow = {
  id: string;
  profile_id: string;
  user_medication_id: string;
  medication_schedule_id: string | null;
  scheduled_time: string | null;
  result: SafetyResult;
  can_confirm_intake: boolean;
  reasons: SafetyReason[];
  suggested_action: string | null;
  checked_at: string;
  source: SafetyCheckSource;
  metadata: Record<string, unknown>;
};

export type SafetyCheckDto = {
  id: string;
  profileId: string;
  userMedicationId: string;
  scheduleId: string | null;
  scheduledTime: string | null;
  result: SafetyResult;
  canConfirmIntake: boolean;
  reasons: SafetyReason[];
  suggestedAction: string | null;
  checkedAt: string;
  source: SafetyCheckSource;
};
