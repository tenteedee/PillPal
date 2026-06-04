import type { SafetyReasonCode, SafetyResult } from "./safety.types.js";

export const SAFETY_REASON_MESSAGES: Record<SafetyReasonCode, string> = {
  MEDICATION_INACTIVE: "This medication is inactive or has been stopped.",
  ALLERGY_MATCH: "This medication may match an allergy in the user's profile.",
  MIN_INTERVAL_VIOLATION: "This medication was taken too recently.",
  DAILY_DOSE_LIMIT_REACHED: "The scheduled daily dose count has already been reached.",
  SCHEDULE_NOT_FOUND: "No active schedule was found for this medication check.",
  SCHEDULE_INACTIVE: "The selected schedule is inactive.",
  SCHEDULE_MEDICATION_MISMATCH:
    "The selected schedule does not belong to this medication.",
  NOT_SCHEDULED_TIME: "This time is not listed in the medication schedule.",
  TOO_EARLY: "It is too early to take this scheduled dose.",
  DOSE_TIME_PASSED: "The scheduled dose time has already passed.",
  MISSING_ACTIVE_INGREDIENT:
    "The active ingredient is missing, so allergy checking may be incomplete.",
  MEDICATION_NOT_VERIFIED_IN_CATALOG:
    "This medication is not linked to the verified catalog.",
};

export const SAFETY_SUGGESTED_ACTION: Record<SafetyResult, string | null> = {
  allowed: null,
  warning:
    "Please confirm the information carefully. If unsure, ask a caregiver, pharmacist, or doctor.",
  blocked:
    "Do not confirm this intake directly. Please contact a caregiver, pharmacist, or doctor.",
};
