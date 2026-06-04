import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { ERROR_MESSAGE } from "../../shared/constants/error/error-messages.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { DeviceRepository } from "../device/device.repository.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import { ExpoPushService } from "./expo-push.service.js";
import { mapNotificationEventRowToDto } from "./notification.mapper.js";
import { NotificationRepository } from "./notification.repository.js";
import type {
  CreateNotificationEventInput,
  NotificationListInput,
} from "./notification.schema.js";
import type {
  NotificationEventDto,
  ExpoPushSendResultDto,
  NotificationEventStatus,
} from "./notification.types.js";

export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly deviceRepository: DeviceRepository,
    private readonly expoPushService: ExpoPushService,
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

  async createNotificationEvent(
    input: CreateNotificationEventInput,
  ): Promise<NotificationEventDto> {
    const row = await this.notificationRepository.create(input);
    return mapNotificationEventRowToDto(row);
  }

  async listMyNotifications(
    userId: string,
    input: NotificationListInput,
  ): Promise<NotificationEventDto[]> {
    const profileId = await this.getProfileIdByUserId(userId);
    const rows = await this.notificationRepository.listByRecipientProfileId(
      profileId,
      input,
    );
    return rows.map(mapNotificationEventRowToDto);
  }

  async getMyNotificationById(
    userId: string,
    notificationId: string,
  ): Promise<NotificationEventDto> {
    const profileId = await this.getProfileIdByUserId(userId);
    const row = await this.notificationRepository.findByIdAndRecipientProfileId(
      notificationId,
      profileId,
    );

    if (!row) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.NOTIFICATION_EVENT_NOT_FOUND,
        ERROR_MESSAGE.NOTIFICATION_EVENT_NOT_FOUND,
      );
    }

    return mapNotificationEventRowToDto(row);
  }

  async sendMyNotificationById(
    userId: string,
    notificationId: string,
  ): Promise<ExpoPushSendResultDto> {
    const profileId = await this.getProfileIdByUserId(userId);
    const row = await this.notificationRepository.findByIdAndRecipientProfileId(
      notificationId,
      profileId,
    );

    if (!row) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.NOTIFICATION_EVENT_NOT_FOUND,
        ERROR_MESSAGE.NOTIFICATION_EVENT_NOT_FOUND,
      );
    }

    if (row.status === "sent") {
      return {
        notification: mapNotificationEventRowToDto(row),
        tickets: [],
      };
    }

    const pushTokens = await this.deviceRepository.listActiveByProfileId(
      row.recipient_profile_id,
    );

    if (pushTokens.length === 0) {
      const failed = await this.markFailed(row.id, "No active push tokens");
      return {
        notification: failed ?? mapNotificationEventRowToDto(row),
        tickets: [],
      };
    }

    try {
      const tickets = await this.expoPushService.sendNotification({
        expoPushTokens: pushTokens.map((token) => token.expo_push_token),
        notification: row,
      });
      const failedTickets = tickets.filter((ticket) => ticket.status === "error");

      if (failedTickets.length > 0 && failedTickets.length === tickets.length) {
        const failed = await this.markFailed(
          row.id,
          summarizeExpoTicketErrors(failedTickets),
        );

        return {
          notification: failed ?? mapNotificationEventRowToDto(row),
          tickets,
        };
      }

      const sent = await this.markSent(row.id);

      return {
        notification: sent ?? mapNotificationEventRowToDto(row),
        tickets,
      };
    } catch (error) {
      const failed = await this.markFailed(row.id, getErrorMessage(error));
      return {
        notification: failed ?? mapNotificationEventRowToDto(row),
        tickets: [],
      };
    }
  }

  async markSent(id: string): Promise<NotificationEventDto | null> {
    const row = await this.notificationRepository.updateStatusById(
      id,
      "sent",
      null,
    );
    return row ? mapNotificationEventRowToDto(row) : null;
  }

  async markFailed(
    id: string,
    errorMessage: string,
  ): Promise<NotificationEventDto | null> {
    const row = await this.notificationRepository.updateStatusById(
      id,
      "failed",
      errorMessage,
    );
    return row ? mapNotificationEventRowToDto(row) : null;
  }

  async markCancelled(id: string): Promise<NotificationEventDto | null> {
    const row = await this.notificationRepository.updateStatusById(
      id,
      "cancelled" satisfies NotificationEventStatus,
      null,
    );
    return row ? mapNotificationEventRowToDto(row) : null;
  }
}

function summarizeExpoTicketErrors(
  tickets: Array<{ message?: string; details?: { error?: string } }>,
): string {
  return tickets
    .map((ticket) => ticket.details?.error ?? ticket.message ?? "Expo push error")
    .join("; ");
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown Expo push error";
}
