import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { ERROR_MESSAGE } from "../../shared/constants/error/error-messages.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import { DeviceRepository } from "./device.repository.js";
import type { RegisterPushTokenBody } from "./device.schema.js";
import { mapPushTokenRowToDto } from "./device.mapper.js";
import type { PushTokenDto } from "./device.types.js";

export class DeviceService {
  constructor(
    private readonly deviceRepository: DeviceRepository,
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

  async registerPushToken(
    userId: string,
    payload: RegisterPushTokenBody,
  ): Promise<PushTokenDto> {
    const profileId = await this.getProfileIdByUserId(userId);
    const existing = await this.deviceRepository.findExistingToken(
      profileId,
      payload,
    );

    const row = existing
      ? await this.deviceRepository.updateById(existing.id, profileId, payload)
      : await this.deviceRepository.create(profileId, payload);

    if (!row) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.PUSH_TOKEN_NOT_FOUND,
        ERROR_MESSAGE.PUSH_TOKEN_NOT_FOUND,
      );
    }

    return mapPushTokenRowToDto(row);
  }

  async listPushTokens(userId: string): Promise<PushTokenDto[]> {
    const profileId = await this.getProfileIdByUserId(userId);
    const rows = await this.deviceRepository.listActiveByProfileId(profileId);
    return rows.map(mapPushTokenRowToDto);
  }

  async deactivatePushToken(userId: string, tokenId: string): Promise<PushTokenDto> {
    const profileId = await this.getProfileIdByUserId(userId);
    const row = await this.deviceRepository.deactivateById(tokenId, profileId);

    if (!row) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.PUSH_TOKEN_NOT_FOUND,
        ERROR_MESSAGE.PUSH_TOKEN_NOT_FOUND,
      );
    }

    return mapPushTokenRowToDto(row);
  }
}
