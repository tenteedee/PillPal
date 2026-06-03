import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { ERROR_MESSAGE } from "../../shared/constants/error/error-messages.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { MedicationRepository } from "../medication/medication.repository.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import { mapMedicationScheduleRowToDto } from "./schedule.mapper.js";
import { ScheduleRepository } from "./schedule.repository.js";
import type {
  CreateScheduleBody,
  ScheduleGetListInput,
  UpdateScheduleBody,
} from "./schedule.schema.js";
import type { MedicationScheduleDto } from "./schedule.types.js";

export class ScheduleService {
  constructor(
    private readonly scheduleRepository: ScheduleRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly medicationRepository: MedicationRepository,
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

  private async ensureActiveMedicationBelongsToProfile(
    medicationId: string,
    profileId: string,
  ): Promise<void> {
    const medication = await this.medicationRepository.findByIdAndProfileId(
      medicationId,
      profileId,
    );

    if (!medication || !medication.is_active) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.MEDICATION_NOT_FOUND,
        ERROR_MESSAGE.MEDICATION_NOT_FOUND,
      );
    }
  }

  async list(
    userId: string,
    input: ScheduleGetListInput,
  ): Promise<MedicationScheduleDto[]> {
    const profileId = await this.getProfileIdByUserId(userId);
    const rows = await this.scheduleRepository.listByProfileId(
      profileId,
      input,
    );
    return rows.map(mapMedicationScheduleRowToDto);
  }

  async create(
    userId: string,
    payload: CreateScheduleBody,
  ): Promise<MedicationScheduleDto> {
    const profileId = await this.getProfileIdByUserId(userId);
    await this.ensureActiveMedicationBelongsToProfile(
      payload.userMedicationId,
      profileId,
    );

    const row = await this.scheduleRepository.create(profileId, payload);
    return mapMedicationScheduleRowToDto(row);
  }

  async getById(
    userId: string,
    scheduleId: string,
  ): Promise<MedicationScheduleDto> {
    const profileId = await this.getProfileIdByUserId(userId);
    const row = await this.scheduleRepository.findByIdAndProfileId(
      scheduleId,
      profileId,
    );

    if (!row) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.SCHEDULE_NOT_FOUND,
        ERROR_MESSAGE.SCHEDULE_NOT_FOUND,
      );
    }

    return mapMedicationScheduleRowToDto(row);
  }

  async updateById(
    userId: string,
    scheduleId: string,
    payload: UpdateScheduleBody,
  ): Promise<MedicationScheduleDto> {
    const profileId = await this.getProfileIdByUserId(userId);
    await this.ensureActiveMedicationBelongsToProfile(
      payload.userMedicationId,
      profileId,
    );

    const row = await this.scheduleRepository.updateByIdAndProfileId(
      scheduleId,
      profileId,
      payload,
    );

    if (!row) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.SCHEDULE_NOT_FOUND,
        ERROR_MESSAGE.SCHEDULE_NOT_FOUND,
      );
    }

    return mapMedicationScheduleRowToDto(row);
  }

  async pauseById(
    userId: string,
    scheduleId: string,
  ): Promise<MedicationScheduleDto> {
    const profileId = await this.getProfileIdByUserId(userId);
    const row = await this.scheduleRepository.pauseByIdAndProfileId(
      scheduleId,
      profileId,
    );

    if (!row) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.SCHEDULE_NOT_FOUND,
        ERROR_MESSAGE.SCHEDULE_NOT_FOUND,
      );
    }

    return mapMedicationScheduleRowToDto(row);
  }

  async deleteById(userId: string, scheduleId: string): Promise<void> {
    const profileId = await this.getProfileIdByUserId(userId);
    const deleted = await this.scheduleRepository.deleteByIdAndProfileId(
      scheduleId,
      profileId,
    );

    if (!deleted) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.SCHEDULE_NOT_FOUND,
        ERROR_MESSAGE.SCHEDULE_NOT_FOUND,
      );
    }
  }
}
