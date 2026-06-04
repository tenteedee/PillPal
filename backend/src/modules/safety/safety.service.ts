import { env } from "../../config/env.js";
import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { ERROR_MESSAGE } from "../../shared/constants/error/error-messages.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { CaregiverRepository } from "../caregiver/caregiver.repository.js";
import { DeviceRepository } from "../device/device.repository.js";
import { IntakeRepository } from "../intake/intake.repository.js";
import { MedicationRepository } from "../medication/medication.repository.js";
import { ExpoPushService } from "../notification/expo-push.service.js";
import { NotificationRepository } from "../notification/notification.repository.js";
import { NotificationService } from "../notification/notification.service.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import { ScheduleRepository } from "../schedule/schedule.repository.js";
import { evaluateSafetyRules } from "./safety.rules.js";
import type { SafetyCheckBody } from "./safety.schema.js";
import { SafetyRepository } from "./safety.repository.js";
import { mapSafetyCheckEventRowToDto } from "./safety.mapper.js";
import type { SafetyCheckDto } from "./safety.types.js";

export class SafetyService {
  private readonly notificationService = new NotificationService(
    new NotificationRepository(),
    new ProfileRepository(),
    new DeviceRepository(),
    new ExpoPushService(),
  );

  constructor(
    private readonly safetyRepository: SafetyRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly medicationRepository: MedicationRepository,
    private readonly scheduleRepository: ScheduleRepository,
    private readonly intakeRepository: IntakeRepository,
    private readonly caregiverRepository: CaregiverRepository,
  ) {}

  async check(
    userId: string,
    payload: SafetyCheckBody,
  ): Promise<SafetyCheckDto> {
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.PROFILE_NOT_FOUND,
        ERROR_MESSAGE.PROFILE_NOT_FOUND,
      );
    }

    const medication = await this.medicationRepository.findByIdAndProfileId(
      payload.userMedicationId,
      profile.id,
    );
    if (!medication) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.MEDICATION_NOT_FOUND,
        ERROR_MESSAGE.MEDICATION_NOT_FOUND,
      );
    }

    const scheduleId = payload.scheduleId ?? null;
    const schedule = scheduleId
      ? await this.scheduleRepository.findByIdAndProfileId(
          scheduleId,
          profile.id,
        )
      : null;

    const now = new Date();
    const range = getLocalDayUtcRange(now, env.APP_TIMEZONE);
    const [todayIntakes, lastIntake] = await Promise.all([
      this.intakeRepository.listTakenByMedicationAndTakenAtRange(
        profile.id,
        medication.id,
        range.start.toISOString(),
        range.end.toISOString(),
      ),
      this.intakeRepository.findLastTakenByMedication(
        profile.id,
        medication.id,
      ),
    ]);

    const ruleOutput = evaluateSafetyRules({
      now,
      timeZone: env.APP_TIMEZONE,
      profile,
      medication,
      schedule,
      scheduledTime: payload.scheduledTime ?? null,
      todayTakenCount: todayIntakes.length,
      lastTakenAt: lastIntake?.taken_at ?? null,
    });

    const event = await this.safetyRepository.createSafetyCheckEvent({
      profileId: profile.id,
      userMedicationId: medication.id,
      scheduleId,
      scheduledTime: payload.scheduledTime ?? null,
      result: ruleOutput.result,
      canConfirmIntake: ruleOutput.canConfirmIntake,
      reasons: ruleOutput.reasons,
      suggestedAction: ruleOutput.suggestedAction,
      source: payload.source,
      metadata: {
        medicationName: medication.name,
        activeIngredient: medication.active_ingredient,
        todayTakenCount: todayIntakes.length,
        lastTakenAt: lastIntake?.taken_at ?? null,
      },
    });

    await this.notifyCaregiversIfNeeded({
      patientProfileId: profile.id,
      medicationName: medication.name,
      eventId: event.id,
      result: event.result,
      reasons: event.reasons,
    });

    return mapSafetyCheckEventRowToDto(event);
  }

  private async notifyCaregiversIfNeeded(input: {
    patientProfileId: string;
    medicationName: string;
    eventId: string;
    result: "allowed" | "warning" | "blocked";
    reasons: unknown[];
  }): Promise<void> {
    if (input.result === "allowed") {
      return;
    }

    const permission =
      input.result === "blocked"
        ? "notifyBlockedAttempts"
        : "notifySafetyWarnings";
    const caregiverProfileIds =
      await this.caregiverRepository.listAcceptedNotificationCaregiverProfileIds(
        input.patientProfileId,
        permission,
      );

    await Promise.all(
      caregiverProfileIds.map(async (recipientProfileId) => {
        const notification =
          await this.notificationService.createNotificationEvent({
            patientProfileId: input.patientProfileId,
            recipientProfileId,
            eventType:
              input.result === "blocked" ? "safety_blocked" : "safety_warning",
            title:
              input.result === "blocked"
                ? "Blocked medication safety check"
                : "Medication safety warning",
            body: `${input.medicationName}: ${input.result} safety check.`,
            payload: {
              safetyCheckEventId: input.eventId,
              result: input.result,
              reasons: input.reasons,
            },
          });

        await this.notificationService.sendNotificationEventById(
          notification.id,
        );
      }),
    );
  }
}

function getLocalDayUtcRange(
  now: Date,
  timeZone: string,
): { start: Date; end: Date } {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const start = getUtcDateFromLocalDateTime(date, "00:00", timeZone);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { start, end };
}

function getUtcDateFromLocalDateTime(
  date: string,
  time: string,
  timeZone: string,
): Date {
  const [year = "1970", month = "01", day = "01"] = date.split("-");
  const [hour = "00", minute = "00"] = time.split(":");
  const utcGuess = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
    ),
  );
  const offsetMs = getTimeZoneOffsetMs(utcGuess, timeZone);

  return new Date(utcGuess.getTime() - offsetMs);
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  const hour = Number(parts.hour === "24" ? "0" : parts.hour);
  const localAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    hour,
    Number(parts.minute),
  );

  return localAsUtc - date.getTime();
}
