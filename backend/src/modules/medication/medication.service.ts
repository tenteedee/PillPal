import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { ERROR_MESSAGE } from "../../shared/constants/error/error-messages.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { mapUserMedicationRowToDto } from "./medication.mapper.js";
import { MedicationRepository } from "./medication.repository.js";
import type {
  CreateMedicationBody,
  UpdateMedicationBody,
} from "./medication.schema.js";
import type { UserMedicationDto } from "./medication.types.js";
import { ProfileRepository } from "../profile/profile.repository.js";

export class MedicationService {
  constructor(
    private readonly medicationRepository: MedicationRepository,
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

  async list(userId: string, active?: boolean): Promise<UserMedicationDto[]> {
    const profileId = await this.getProfileIdByUserId(userId);
    const rows = await this.medicationRepository.listByProfileId(
      profileId,
      active,
    );
    return rows.map(mapUserMedicationRowToDto);
  }

  async create(
    userId: string,
    payload: CreateMedicationBody,
  ): Promise<UserMedicationDto> {
    const profileId = await this.getProfileIdByUserId(userId);
    const row = await this.medicationRepository.create(profileId, payload);
    return mapUserMedicationRowToDto(row);
  }

  async getById(
    userId: string,
    medicationId: string,
  ): Promise<UserMedicationDto> {
    const profileId = await this.getProfileIdByUserId(userId);
    const row = await this.medicationRepository.findByIdAndProfileId(
      medicationId,
      profileId,
    );

    if (!row) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.MEDICATION_NOT_FOUND,
        ERROR_MESSAGE.MEDICATION_NOT_FOUND,
      );
    }

    return mapUserMedicationRowToDto(row);
  }

  async updateById(
    userId: string,
    medicationId: string,
    payload: UpdateMedicationBody,
  ): Promise<UserMedicationDto> {
    const profileId = await this.getProfileIdByUserId(userId);
    const row = await this.medicationRepository.updateByIdAndProfileId(
      medicationId,
      profileId,
      payload,
    );

    if (!row) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.MEDICATION_NOT_FOUND,
        ERROR_MESSAGE.MEDICATION_NOT_FOUND,
      );
    }

    return mapUserMedicationRowToDto(row);
  }

  async stopById(userId: string, medicationId: string): Promise<UserMedicationDto> {
    const profileId = await this.getProfileIdByUserId(userId);
    const row = await this.medicationRepository.stopByIdAndProfileId(
      medicationId,
      profileId,
    );

    if (!row) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.MEDICATION_NOT_FOUND,
        ERROR_MESSAGE.MEDICATION_NOT_FOUND,
      );
    }

    return mapUserMedicationRowToDto(row);
  }

  async deleteById(userId: string, medicationId: string): Promise<void> {
    const profileId = await this.getProfileIdByUserId(userId);
    const deleted = await this.medicationRepository.deleteByIdAndProfileId(
      medicationId,
      profileId,
    );

    if (!deleted) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.MEDICATION_NOT_FOUND,
        ERROR_MESSAGE.MEDICATION_NOT_FOUND,
      );
    }
  }
}
