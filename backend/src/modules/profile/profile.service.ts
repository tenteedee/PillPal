import { HttpError } from "../../shared/errors/http-error.js";
import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { ERROR_MESSAGE } from "../../shared/constants/error/error-messages.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";

import { mapProfileRowToDto } from "./profile.mapper.js";
import { ProfileRepository } from "./profile.repository.js";
import type { CreateProfileBody, UpdateProfileBody } from "./profile.schema.js";
import type { ProfileDto } from "./profile.types.js";

export class ProfileService {
  constructor(private readonly repository: ProfileRepository) {}

  async getMe(userId: string): Promise<ProfileDto> {
    const profile = await this.repository.findByUserId(userId);
    if (!profile) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.PROFILE_NOT_FOUND,
        ERROR_MESSAGE.PROFILE_NOT_FOUND,
      );
    }

    return mapProfileRowToDto(profile);
  }

  async create(
    userId: string,
    payload: CreateProfileBody,
  ): Promise<ProfileDto> {
    const existing = await this.repository.findByUserId(userId);
    if (existing) {
      throw new HttpError(
        HTTP_STATUS.CONFLICT,
        ERROR_CODE.PROFILE_ALREADY_EXISTS,
        ERROR_MESSAGE.PROFILE_ALREADY_EXISTS,
      );
    }

    const created = await this.repository.create(userId, payload);
    return mapProfileRowToDto(created);
  }

  async updateMe(
    userId: string,
    payload: UpdateProfileBody,
  ): Promise<ProfileDto> {
    const updated = await this.repository.updateByUserId(userId, payload);
    if (!updated) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.PROFILE_NOT_FOUND,
        ERROR_MESSAGE.PROFILE_NOT_FOUND,
      );
    }

    return mapProfileRowToDto(updated);
  }
}
