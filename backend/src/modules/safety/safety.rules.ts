import {
  SAFETY_REASON_MESSAGES,
  SAFETY_SUGGESTED_ACTION,
} from "./safety.messages.js";
import type {
  SafetyReason,
  SafetyReasonCode,
  SafetyRuleInput,
  SafetyRuleOutput,
  SafetySeverity,
} from "./safety.types.js";

export function evaluateSafetyRules(input: SafetyRuleInput): SafetyRuleOutput {
  const reasons: SafetyReason[] = [];

  if (!input.medication.is_active) {
    reasons.push(reason("MEDICATION_INACTIVE", "blocked"));
  }

  if (!input.medication.catalog_id) {
    reasons.push(reason("MEDICATION_NOT_VERIFIED_IN_CATALOG", "warning"));
  }

  if (!input.medication.active_ingredient) {
    reasons.push(reason("MISSING_ACTIVE_INGREDIENT", "warning"));
  }

  const allergyMatch = findAllergyMatch(input);
  if (allergyMatch) {
    reasons.push(
      reason("ALLERGY_MATCH", "blocked", {
        allergy: allergyMatch,
      }),
    );
  }

  evaluateSelectedScheduleRules(input, reasons);
  evaluateActivePlanRules(input, reasons);

  const result = reasons.some((item) => item.severity === "blocked")
    ? "blocked"
    : reasons.some((item) => item.severity === "warning")
      ? "warning"
      : "allowed";

  return {
    result,
    canConfirmIntake: result !== "blocked",
    reasons,
    suggestedAction: SAFETY_SUGGESTED_ACTION[result],
  };
}

function evaluateSelectedScheduleRules(
  input: SafetyRuleInput,
  reasons: SafetyReason[],
): void {
  const schedule = input.selectedSchedule;
  if (!schedule) {
    return;
  }

  if (!schedule.is_active) {
    reasons.push(reason("SCHEDULE_INACTIVE", "warning"));
  }

  if (schedule.user_medication_id !== input.medication.id) {
    reasons.push(reason("SCHEDULE_MEDICATION_MISMATCH", "blocked"));
  }
}

function evaluateActivePlanRules(
  input: SafetyRuleInput,
  reasons: SafetyReason[],
): void {
  const activeSchedules = input.activeMedicationSchedules.filter(
    (schedule) => schedule.user_medication_id === input.medication.id,
  );

  if (activeSchedules.length === 0) {
    reasons.push(reason("SCHEDULE_NOT_FOUND", "warning"));
    return;
  }

  const minIntervalHours = getMostConservativeMinIntervalHours(activeSchedules);
  if (minIntervalHours && input.lastTakenAt) {
    const lastTakenAt = new Date(input.lastTakenAt);
    const hoursSinceLastTaken =
      (input.now.getTime() - lastTakenAt.getTime()) / (60 * 60 * 1000);

    if (hoursSinceLastTaken < minIntervalHours) {
      reasons.push(
        reason("MIN_INTERVAL_VIOLATION", "warning", {
          minIntervalHours,
          hoursSinceLastTaken: Number(hoursSinceLastTaken.toFixed(2)),
          lastTakenAt: input.lastTakenAt,
          scheduleIds: activeSchedules.map((schedule) => schedule.id),
        }),
      );
    }
  }

  const dailyDoseLimit = activeSchedules.reduce(
    (total, schedule) => total + schedule.times_per_day,
    0,
  );

  if (input.todayTakenCount >= dailyDoseLimit) {
    reasons.push(
      reason("DAILY_DOSE_LIMIT_REACHED", "blocked", {
        todayTakenCount: input.todayTakenCount,
        dailyDoseLimit,
        scheduleIds: activeSchedules.map((schedule) => schedule.id),
      }),
    );
  }
}

function getMostConservativeMinIntervalHours(
  schedules: SafetyRuleInput["activeMedicationSchedules"],
): number | null {
  const intervals = schedules
    .map((schedule) => schedule.min_interval_hours)
    .filter((value): value is number => typeof value === "number");

  return intervals.length > 0 ? Math.max(...intervals) : null;
}

function findAllergyMatch(input: SafetyRuleInput): unknown | null {
  const medicationTerms = [
    input.medication.name,
    input.medication.active_ingredient,
  ]
    .filter((value): value is string => Boolean(value))
    .map(normalizeText);

  for (const allergy of input.profile.allergies) {
    if (!isAllergyObject(allergy)) {
      continue;
    }

    const allergyName = normalizeText(allergy.name);
    const isMatch = medicationTerms.some(
      (term) => term.includes(allergyName) || allergyName.includes(term),
    );

    if (isMatch) {
      return allergy;
    }
  }

  return null;
}

function isAllergyObject(value: unknown): value is { name: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    typeof value.name === "string"
  );
}

function reason(
  code: SafetyReasonCode,
  severity: SafetySeverity,
  metadata?: Record<string, unknown>,
): SafetyReason {
  return {
    code,
    severity,
    message: SAFETY_REASON_MESSAGES[code],
    ...(metadata ? { metadata } : {}),
  };
}

function normalizeText(value: string): string {
  return value.toLowerCase().trim();
}
