import { getSupabaseClient } from "../../config/supabase.js";
import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import type { MedicationScheduleWithMedicationRow } from "./schedule.types.js";

export class ScheduleReminderRepository {
  async listActiveSchedulesForReminders(): Promise<MedicationScheduleWithMedicationRow[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("medication_schedules")
      .select("*, medication:user_medications!medication_schedules_user_medication_id_fkey(name)")
      .eq("is_active", true);

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.SCHEDULE_REMINDER_READ_FAILED,
        "Failed to list active schedules for reminders",
        error,
      );
    }

    return (
      (data as Array<
        Omit<MedicationScheduleWithMedicationRow, "medication_name"> & {
          medication: { name: string } | null;
        }
      >) ?? []
    ).flatMap((row) => {
      if (!row.medication) {
        return [];
      }

      return {
        ...row,
        medication_name: row.medication.name,
      };
    });
  }

  async reserveReminderDelivery(input: {
    scheduleId: string;
    scheduledDate: string;
    scheduledTime: string;
    recipientProfileId: string;
  }): Promise<string | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("medication_schedule_reminder_deliveries")
      .insert({
        medication_schedule_id: input.scheduleId,
        scheduled_date: input.scheduledDate,
        scheduled_time: input.scheduledTime,
        recipient_profile_id: input.recipientProfileId,
      })
      .select("id")
      .single<{ id: string }>();

    if (!error) {
      return data.id;
    }

    if (error.code === "23505") {
      return null;
    }

    throw new HttpError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODE.SCHEDULE_REMINDER_CREATE_FAILED,
      "Failed to create schedule reminder delivery",
      error,
    );
  }

  async attachNotificationEvent(
    deliveryId: string,
    notificationEventId: string,
  ): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("medication_schedule_reminder_deliveries")
      .update({ notification_event_id: notificationEventId })
      .eq("id", deliveryId);

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.SCHEDULE_REMINDER_CREATE_FAILED,
        "Failed to attach notification event to reminder delivery",
        error,
      );
    }
  }
}
