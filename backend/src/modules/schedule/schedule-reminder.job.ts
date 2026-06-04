import { env } from "../../config/env.js";
import { logger } from "../../shared/utils/logger.js";
import { CaregiverRepository } from "../caregiver/caregiver.repository.js";
import { ScheduleReminderRepository } from "./schedule-reminder.repository.js";
import { ScheduleReminderService } from "./schedule-reminder.service.js";

const DEFAULT_INTERVAL_MINUTES = 30;

export function startScheduleReminderJob(): NodeJS.Timeout | null {
  if (!env.ENABLE_SCHEDULE_REMINDER_JOB) {
    logger.info("Schedule reminder job disabled");
    return null;
  }

  const service = new ScheduleReminderService(
    new ScheduleReminderRepository(),
    new CaregiverRepository(),
  );
  const intervalMs = env.SCHEDULE_REMINDER_INTERVAL_MINUTES * 60 * 1000;

  void runScheduleReminderJob(service);

  return setInterval(() => {
    void runScheduleReminderJob(service);
  }, intervalMs || DEFAULT_INTERVAL_MINUTES * 60 * 1000);
}

async function runScheduleReminderJob(
  service: ScheduleReminderService,
): Promise<void> {
  try {
    const result = await service.processDueReminders();
    logger.info("Schedule reminder job completed", result);
  } catch (error) {
    logger.error("Schedule reminder job failed", error);
  }
}
