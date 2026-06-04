import { getSupabaseClient } from "../../config/supabase.js";
import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { getPaginationRange } from "../../shared/utils/pagination.js";
import type {
  CreateNotificationEventInput,
  NotificationListInput,
} from "./notification.schema.js";
import type {
  NotificationEventRow,
  NotificationEventStatus,
} from "./notification.types.js";

export class NotificationRepository {
  async create(
    input: CreateNotificationEventInput,
  ): Promise<NotificationEventRow> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("notification_events")
      .insert({
        patient_profile_id: input.patientProfileId,
        recipient_profile_id: input.recipientProfileId,
        event_type: input.eventType,
        title: input.title,
        body: input.body,
        payload: input.payload ?? {},
      })
      .select("*")
      .single<NotificationEventRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.NOTIFICATION_EVENT_CREATE_FAILED,
        "Failed to create notification event",
        error,
      );
    }

    return data;
  }

  async listByRecipientProfileId(
    recipientProfileId: string,
    input: NotificationListInput,
  ): Promise<NotificationEventRow[]> {
    const supabase = getSupabaseClient();
    const { from, to } = getPaginationRange(input);

    let query = supabase
      .from("notification_events")
      .select("*")
      .eq("recipient_profile_id", recipientProfileId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (input.status !== undefined) {
      query = query.eq("status", input.status);
    }

    if (input.eventType !== undefined) {
      query = query.eq("event_type", input.eventType);
    }

    const { data, error } = await query;

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.NOTIFICATION_EVENT_READ_FAILED,
        `Failed to list notification events for profile ${recipientProfileId}`,
        error,
      );
    }

    return (data as NotificationEventRow[]) ?? [];
  }

  async findByIdAndRecipientProfileId(
    id: string,
    recipientProfileId: string,
  ): Promise<NotificationEventRow | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("notification_events")
      .select("*")
      .eq("id", id)
      .eq("recipient_profile_id", recipientProfileId)
      .maybeSingle<NotificationEventRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.NOTIFICATION_EVENT_READ_FAILED,
        `Failed to read notification event ${id}`,
        error,
      );
    }

    return data;
  }

  async findById(id: string): Promise<NotificationEventRow | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("notification_events")
      .select("*")
      .eq("id", id)
      .maybeSingle<NotificationEventRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.NOTIFICATION_EVENT_READ_FAILED,
        `Failed to read notification event ${id}`,
        error,
      );
    }

    return data;
  }

  async updateStatusById(
    id: string,
    status: NotificationEventStatus,
    errorMessage: string | null,
  ): Promise<NotificationEventRow | null> {
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("notification_events")
      .update({
        status,
        error_message: errorMessage,
        sent_at: status === "sent" ? now : null,
        updated_at: now,
      })
      .eq("id", id)
      .select("*")
      .maybeSingle<NotificationEventRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.NOTIFICATION_EVENT_UPDATE_FAILED,
        `Failed to update notification event ${id}`,
        error,
      );
    }

    return data;
  }
}
