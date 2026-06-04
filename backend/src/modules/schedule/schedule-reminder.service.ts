import { env } from "../../config/env.js";
import { CaregiverRepository } from "../caregiver/caregiver.repository.js";
import { DeviceRepository } from "../device/device.repository.js";
import { ExpoPushService } from "../notification/expo-push.service.js";
import { NotificationRepository } from "../notification/notification.repository.js";
import { NotificationService } from "../notification/notification.service.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import { ScheduleReminderRepository } from "./schedule-reminder.repository.js";
import type { MedicationScheduleWithMedicationRow } from "./schedule.types.js";

const REMINDER_WINDOW_MINUTES = 30;

export class ScheduleReminderService {
  private readonly notificationService = new NotificationService(
    new NotificationRepository(),
    new ProfileRepository(),
    new DeviceRepository(),
    new ExpoPushService(),
  );

  constructor(
    private readonly reminderRepository: ScheduleReminderRepository,
    private readonly caregiverRepository: CaregiverRepository,
  ) {}

  async processDueReminders(now: Date = new Date()): Promise<{
    remindersCreated: number;
  }> {
    const date = getLocalDateString(now, env.APP_TIMEZONE);
    const nowMinutes = getLocalMinutes(now, env.APP_TIMEZONE);
    const schedules =
      await this.reminderRepository.listActiveSchedulesForReminders();

    let remindersCreated = 0;

    for (const schedule of schedules) {
      for (const scheduledTime of schedule.times) {
        if (!isDueInCurrentWindow(scheduledTime, nowMinutes)) {
          continue;
        }

        const recipientProfileIds = await this.getReminderRecipients(schedule);

        for (const recipientProfileId of recipientProfileIds) {
          const deliveryId = await this.reminderRepository.reserveReminderDelivery({
            scheduleId: schedule.id,
            scheduledDate: date,
            scheduledTime,
            recipientProfileId,
          });

          if (!deliveryId) {
            continue;
          }

          const notification =
            await this.notificationService.createNotificationEvent({
              patientProfileId: schedule.profile_id,
              recipientProfileId,
              eventType: "medication_reminder",
              title: "Medication reminder",
              body: buildReminderBody(schedule, scheduledTime),
              payload: {
                medicationScheduleId: schedule.id,
                userMedicationId: schedule.user_medication_id,
                medicationName: schedule.medication_name,
                doseAmount: schedule.dose_amount,
                scheduledDate: date,
                scheduledTime,
              },
            });

          await this.reminderRepository.attachNotificationEvent(
            deliveryId,
            notification.id,
          );
          await this.notificationService.sendNotificationEventById(notification.id);
          remindersCreated += 1;
        }
      }
    }

    return {
      remindersCreated,
    };
  }

  private async getReminderRecipients(
    schedule: MedicationScheduleWithMedicationRow,
  ): Promise<string[]> {
    const caregiverProfileIds =
      await this.caregiverRepository.listAcceptedReminderCaregiverProfileIds(
        schedule.profile_id,
      );

    return Array.from(new Set([schedule.profile_id, ...caregiverProfileIds]));
  }
}

function buildReminderBody(
  schedule: MedicationScheduleWithMedicationRow,
  scheduledTime: string,
): string {
  return `${scheduledTime}: ${schedule.medication_name} - ${schedule.dose_amount}`;
}

function isDueInCurrentWindow(scheduledTime: string, nowMinutes: number): boolean {
  const scheduledMinutes = parseTimeToMinutes(scheduledTime);
  const diff = nowMinutes - scheduledMinutes;
  return diff >= 0 && diff < REMINDER_WINDOW_MINUTES;
}

function parseTimeToMinutes(time: string): number {
  const [hour = "0", minute = "0"] = time.split(":");
  return Number(hour) * 60 + Number(minute);
}

function getLocalDateString(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
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
  const minute = Number(parts.minute);

  return hour * 60 + minute;
}
