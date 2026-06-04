import { env } from "../../config/env.js";
import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { ERROR_MESSAGE } from "../../shared/constants/error/error-messages.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import type { NotificationEventRow } from "./notification.types.js";
import type { ExpoPushTicket } from "./notification.types.js";

const EXPO_PUSH_SEND_URL = "https://exp.host/--/api/v2/push/send";

export class ExpoPushService {
  async sendNotification(input: {
    expoPushTokens: string[];
    notification: NotificationEventRow;
  }): Promise<ExpoPushTicket[]> {
    if (input.expoPushTokens.length === 0) {
      return [];
    }

    const response = await fetch(EXPO_PUSH_SEND_URL, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({
        to: input.expoPushTokens,
        title: input.notification.title,
        body: input.notification.body,
        sound: "default",
        data: {
          notificationEventId: input.notification.id,
          eventType: input.notification.event_type,
          patientProfileId: input.notification.patient_profile_id,
          ...input.notification.payload,
        },
      }),
    });

    const responseBody = (await response.json().catch(() => null)) as
      | { data?: ExpoPushTicket[] | ExpoPushTicket; errors?: unknown[] }
      | null;

    if (!response.ok || !responseBody) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.EXPO_PUSH_SEND_FAILED,
        ERROR_MESSAGE.EXPO_PUSH_SEND_FAILED,
        responseBody,
      );
    }

    if (responseBody.errors && responseBody.errors.length > 0) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.EXPO_PUSH_SEND_FAILED,
        ERROR_MESSAGE.EXPO_PUSH_SEND_FAILED,
        responseBody.errors,
      );
    }

    const tickets = Array.isArray(responseBody.data)
      ? responseBody.data
      : responseBody.data
        ? [responseBody.data]
        : [];

    return tickets;
  }
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Accept-Encoding": "gzip, deflate",
    "Content-Type": "application/json",
  };

  if (env.EXPO_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${env.EXPO_ACCESS_TOKEN}`;
  }

  return headers;
}
