import { env } from "../../config/env.js";
import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { ERROR_MESSAGE } from "../../shared/constants/error/error-messages.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { getTodayDateString } from "../../shared/utils/date-time.js";
import { IntakeRepository } from "../intake/intake.repository.js";
import type { IntakeEventRow } from "../intake/intake.types.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import { mapDailyPlanItemsToDto } from "./daily-plan.mapper.js";
import { DailyPlanRepository } from "./daily-plan.repository.js";
import type { DailyPlanQuery } from "./daily-plan.schema.js";
import type {
  DailyPlanDto,
  DailyPlanItemDto,
  DailyPlanStatus,
} from "./daily-plan.types.js";

const DUE_WINDOW_MINUTES = 120;

type DateRelation = "past" | "today" | "future";

type LocalDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

export class DailyPlanService {
  constructor(
    private readonly dailyPlanRepository: DailyPlanRepository,
    private readonly intakeRepository: IntakeRepository,
    private readonly profileRepository: ProfileRepository,
  ) {}

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

  async getToday(userId: string, query: DailyPlanQuery): Promise<DailyPlanDto> {
    const profileId = await this.getProfileIdByUserId(userId);
    const date = query.date ?? getTodayDateString(env.APP_TIMEZONE);
    const range = getLocalDateUtcRange(date, env.APP_TIMEZONE);

    const [scheduleMedications, intakeEvents] = await Promise.all([
      this.dailyPlanRepository.listActiveScheduleMedicationsByProfileId(
        profileId,
      ),
      this.intakeRepository.listByProfileIdAndTakenAtRange(
        profileId,
        range.start.toISOString(),
        range.end.toISOString(),
      ),
    ]);

    const takenKeys = buildTakenKeys(intakeEvents);
    const dateRelation = getDateRelation(date, env.APP_TIMEZONE);
    const nowMinutes =
      dateRelation === "today" ? getNowMinutes(env.APP_TIMEZONE) : null;

    const items: DailyPlanItemDto[] = scheduleMedications.flatMap((schedule) =>
      schedule.times.map((scheduledTime) => ({
        userMedicationId: schedule.userMedicationId,
        scheduleId: schedule.scheduleId,
        name: schedule.medicationName,
        activeIngredient: schedule.activeIngredient,
        strength: schedule.strength,
        dosageForm: schedule.dosageForm,
        imageUrl: schedule.imageUrl,
        doseAmount: schedule.doseAmount,
        instruction: schedule.instruction,
        scheduledTime,
        status: resolveDailyPlanStatus({
          scheduledTime,
          scheduleId: schedule.scheduleId,
          takenKeys,
          dateRelation,
          nowMinutes,
        }),
      })),
    );

    return mapDailyPlanItemsToDto(date, items);
  }
}

function buildTakenKeys(intakeEvents: IntakeEventRow[]): Set<string> {
  return new Set(
    intakeEvents
      .filter((event) => event.status === "taken")
      .flatMap((event) => {
        if (!event.medication_schedule_id || !event.scheduled_time) {
          return [];
        }

        return [
          getTakenKey(event.medication_schedule_id, event.scheduled_time),
        ];
      }),
  );
}

function resolveDailyPlanStatus(input: {
  scheduledTime: string;
  scheduleId: string;
  takenKeys: Set<string>;
  dateRelation: DateRelation;
  nowMinutes: number | null;
}): DailyPlanStatus {
  if (input.takenKeys.has(getTakenKey(input.scheduleId, input.scheduledTime))) {
    return "taken";
  }

  if (input.dateRelation === "past") {
    return "missed";
  }

  if (input.dateRelation === "future") {
    return "not_yet";
  }

  if (input.nowMinutes === null) {
    return "not_yet";
  }

  const scheduledMinutes = parseTimeToMinutes(input.scheduledTime);

  if (input.nowMinutes < scheduledMinutes) {
    return "not_yet";
  }

  if (input.nowMinutes <= scheduledMinutes + DUE_WINDOW_MINUTES) {
    return "due";
  }

  return "missed";
}

function getTakenKey(scheduleId: string, scheduledTime: string): string {
  return `${scheduleId}:${scheduledTime}`;
}

function parseTimeToMinutes(time: string): number {
  const [hour = "0", minute = "0"] = time.split(":");
  return Number(hour) * 60 + Number(minute);
}

function getNowMinutes(timeZone: string): number {
  const parts = getLocalDateParts(new Date(), timeZone);
  return parts.hour * 60 + parts.minute;
}

function getDateRelation(date: string, timeZone: string): DateRelation {
  const today = getTodayDateString(timeZone);

  if (date < today) {
    return "past";
  }

  if (date > today) {
    return "future";
  }

  return "today";
}

function getLocalDateUtcRange(
  date: string,
  timeZone: string,
): { start: Date; end: Date } {
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

function getLocalDateParts(date: Date, timeZone: string): LocalDateParts {
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

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour === "24" ? "0" : parts.hour),
    minute: Number(parts.minute),
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = getLocalDateParts(date, timeZone);
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
  );

  return localAsUtc - date.getTime();
}
