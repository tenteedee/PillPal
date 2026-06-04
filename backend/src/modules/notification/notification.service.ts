import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { ERROR_MESSAGE } from "../../shared/constants/error/error-messages.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import { mapNotificationEventRowToDto } from "./notification.mapper.js";
import { NotificationRepository } from "./notification.repository.js";
import type {
  CreateNotificationEventInput,
  NotificationListInput,
} from "./notification.schema.js";
import type {
  NotificationEventDto,
  NotificationEventStatus,
} from "./notification.types.js";

export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
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
