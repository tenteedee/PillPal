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

const ALLOWED_EARLY_MINUTES = 30;
const ALLOWED_LATE_MINUTES = 120;

export function evaluateSafetyRules(input: SafetyRuleInput): SafetyRuleOutput {
  const reasons: SafetyReason[] = [];

  if (!input.medication.is_active) {
    reasons.push(reason("MEDICATION_INACTIVE", "blocked"));
  }

  if (!input.medication.catalog_id && !input.hasVerifiedExternalLookup) {
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
  evaluateScheduledTimeRules(input, reasons);
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

function evaluateScheduledTimeRules(
  input: SafetyRuleInput,
  reasons: SafetyReason[],
): void {
  if (!input.scheduledTime) {
    return;
  }

  const selectedSchedule = input.selectedSchedule;
  const activeSchedules = input.activeMedicationSchedules.filter(
    (schedule) => schedule.user_medication_id === input.medication.id,
  );
  const schedulesToCheck = selectedSchedule
    ? [selectedSchedule]
    : activeSchedules;
  const scheduledTimeExists = schedulesToCheck.some((schedule) =>
    schedule.times.includes(input.scheduledTime as string),
  );

  if (!scheduledTimeExists) {
    reasons.push(
      reason("NOT_SCHEDULED_TIME", "warning", {
        scheduledTime: input.scheduledTime,
        scheduleIds: schedulesToCheck.map((schedule) => schedule.id),
      }),
    );
    return;
  }

  const nowMinutes = getLocalMinutes(input.now, input.timeZone);
  const scheduledMinutes = parseTimeToMinutes(input.scheduledTime);

  if (nowMinutes < scheduledMinutes - ALLOWED_EARLY_MINUTES) {
    reasons.push(
      reason("TOO_EARLY", "warning", {
        scheduledTime: input.scheduledTime,
        allowedEarlyMinutes: ALLOWED_EARLY_MINUTES,
      }),
    );
    return;
  }

  if (nowMinutes > scheduledMinutes + ALLOWED_LATE_MINUTES) {
    reasons.push(
      reason("DOSE_TIME_PASSED", "warning", {
        scheduledTime: input.scheduledTime,
        allowedLateMinutes: ALLOWED_LATE_MINUTES,
      }),
    );
  }
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

function parseTimeToMinutes(time: string): number {
  const [hour = "0", minute = "0"] = time.split(":");
  return Number(hour) * 60 + Number(minute);
}

function getLocalMinutes(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  const hour = Number(parts.hour === "24" ? "0" : parts.hour);

  return hour * 60 + Number(parts.minute);
}
