import { env } from "../../config/env.js";
import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { ERROR_MESSAGE } from "../../shared/constants/error/error-messages.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { getTodayDateString } from "../../shared/utils/date-time.js";
import { MedicationRepository } from "../medication/medication.repository.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import { SafetyRepository } from "../safety/safety.repository.js";
import { ScheduleRepository } from "../schedule/schedule.repository.js";
import { mapIntakeEventRowToDto } from "./intake.mapper.js";
import { IntakeRepository } from "./intake.repository.js";
import type { CreateIntakeBody, IntakeListInput } from "./intake.schema.js";
import type { IntakeEventDto } from "./intake.types.js";

export class IntakeService {
  constructor(
    private readonly intakeRepository: IntakeRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly medicationRepository: MedicationRepository,
    private readonly scheduleRepository: ScheduleRepository,
    private readonly safetyRepository: SafetyRepository,
  ) {}

  async list(userId: string, input: IntakeListInput): Promise<IntakeEventDto[]> {
    const profileId = await this.getProfileIdByUserId(userId);
    const rows = await this.intakeRepository.listByProfileId(profileId, input);
    return rows.map(mapIntakeEventRowToDto);
  }

  async listToday(userId: string): Promise<IntakeEventDto[]> {
    const profileId = await this.getProfileIdByUserId(userId);
    const today = getTodayDateString(env.APP_TIMEZONE);
    const range = getLocalDateUtcRange(today, env.APP_TIMEZONE);
    const rows = await this.intakeRepository.listByProfileIdAndTakenAtRange(
      profileId,
      range.start.toISOString(),
      range.end.toISOString(),
    );

    return rows.map(mapIntakeEventRowToDto);
  }

  async create(
    userId: string,
    payload: CreateIntakeBody,
  ): Promise<IntakeEventDto> {
    const profileId = await this.getProfileIdByUserId(userId);

    const medication = await this.medicationRepository.findByIdAndProfileId(
      payload.userMedicationId,
      profileId,
    );
    if (!medication) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.MEDICATION_NOT_FOUND,
        ERROR_MESSAGE.MEDICATION_NOT_FOUND,
      );
    }

    if (payload.scheduleId) {
      const schedule = await this.scheduleRepository.findByIdAndProfileId(
        payload.scheduleId,
        profileId,
      );

      if (!schedule) {
        throw new HttpError(
          HTTP_STATUS.NOT_FOUND,
          ERROR_CODE.SCHEDULE_NOT_FOUND,
          ERROR_MESSAGE.SCHEDULE_NOT_FOUND,
        );
      }

      if (schedule.user_medication_id !== medication.id) {
        throw new HttpError(
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODE.VALIDATION_ERROR,
          "Schedule does not belong to the selected medication",
        );
      }
    }

    const safetyCheck = await this.safetyRepository.findByIdAndProfileId(
      payload.safetyCheckEventId,
      profileId,
    );
    if (!safetyCheck) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.SAFETY_CHECK_NOT_FOUND,
        ERROR_MESSAGE.SAFETY_CHECK_NOT_FOUND,
      );
    }

    if (safetyCheck.user_medication_id !== medication.id) {
      throw new HttpError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODE.VALIDATION_ERROR,
        "Safety check does not belong to the selected medication",
      );
    }

    if ((safetyCheck.medication_schedule_id ?? null) !== (payload.scheduleId ?? null)) {
      throw new HttpError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODE.VALIDATION_ERROR,
        "Safety check does not belong to the selected schedule",
      );
    }

    if ((safetyCheck.scheduled_time ?? null) !== (payload.scheduledTime ?? null)) {
      throw new HttpError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODE.VALIDATION_ERROR,
        "Safety check does not belong to the selected scheduled time",
      );
    }

    if (!safetyCheck.can_confirm_intake || safetyCheck.result === "blocked") {
      throw new HttpError(
        HTTP_STATUS.CONFLICT,
        ERROR_CODE.INTAKE_NOT_ALLOWED,
        ERROR_MESSAGE.INTAKE_NOT_ALLOWED,
      );
    }

    const duplicateSafetyCheckIntake =
      await this.intakeRepository.findTakenBySafetyCheckEventId(
        profileId,
        payload.safetyCheckEventId,
      );
    if (duplicateSafetyCheckIntake) {
      throw new HttpError(
        HTTP_STATUS.CONFLICT,
        ERROR_CODE.INTAKE_NOT_ALLOWED,
        "This safety check has already been used to confirm an intake",
      );
    }

    if (payload.scheduleId && payload.scheduledTime) {
      const effectiveTakenAt = payload.takenAt
        ? new Date(payload.takenAt)
        : new Date();
      const localDate = getLocalDateString(effectiveTakenAt, env.APP_TIMEZONE);
      const range = getLocalDateUtcRange(localDate, env.APP_TIMEZONE);
      const duplicateScheduledIntake =
        await this.intakeRepository.findTakenByScheduleTimeAndTakenAtRange({
          profileId,
          scheduleId: payload.scheduleId,
          scheduledTime: payload.scheduledTime,
          startIso: range.start.toISOString(),
          endIso: range.end.toISOString(),
        });

      if (duplicateScheduledIntake) {
        throw new HttpError(
          HTTP_STATUS.CONFLICT,
          ERROR_CODE.INTAKE_NOT_ALLOWED,
          "This scheduled dose has already been confirmed for this day",
        );
      }
    }

    const warningSnapshot =
      safetyCheck.result === "warning" ? safetyCheck.reasons : [];

    const row = await this.intakeRepository.create({
      profileId,
      payload,
      warningSnapshot,
    });

    return mapIntakeEventRowToDto(row);
  }

  private async getProfileIdByUserId(userId: string): Promise<string> {
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.PROFILE_NOT_FOUND,
        ERROR_MESSAGE.PROFILE_NOT_FOUND,
      );
    }

    return profile.id;
  }
}

function getLocalDateUtcRange(
  date: string,
  timeZone: string,
): { start: Date; end: Date } {
  const start = getUtcDateFromLocalDateTime(date, "00:00", timeZone);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { start, end };
}

function getLocalDateString(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
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
