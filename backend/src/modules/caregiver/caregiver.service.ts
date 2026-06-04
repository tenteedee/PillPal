import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { ERROR_MESSAGE } from "../../shared/constants/error/error-messages.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import {
  mapCaregiverForPatientToDto,
  mapCaregiverLinkRowToDto,
  mapPatientForCaregiverToDto,
} from "./caregiver.mapper.js";
import { CaregiverRepository } from "./caregiver.repository.js";
import type { InviteCaregiverBody } from "./caregiver.schema.js";
import type {
  CaregiverForPatientDto,
  CaregiverLinkDto,
  CaregiverLinkPermissions,
  PatientForCaregiverDto,
} from "./caregiver.types.js";

const DEFAULT_CAREGIVER_PERMISSIONS: CaregiverLinkPermissions = {
  notifySafetyWarnings: true,
  notifyBlockedAttempts: true,
  notifyMissedDose: true,
  viewMedicationList: false,
  viewIntakeHistory: false,
};

export class CaregiverService {
  constructor(
    private readonly caregiverRepository: CaregiverRepository,
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

  async invite(
    userId: string,
    payload: InviteCaregiverBody,
  ): Promise<CaregiverLinkDto> {
    const patientProfileId = await this.getProfileIdByUserId(userId);

    if (patientProfileId === payload.caregiverProfileId) {
      throw new HttpError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODE.VALIDATION_ERROR,
        ERROR_MESSAGE.INVALID_REQUEST_BODY,
      );
    }

    const caregiverProfile = await this.profileRepository.findById(
      payload.caregiverProfileId,
    );
    if (!caregiverProfile) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.PROFILE_NOT_FOUND,
        ERROR_MESSAGE.PROFILE_NOT_FOUND,
      );
    }

    const existingLink = await this.caregiverRepository.findActiveLink(
      patientProfileId,
      payload.caregiverProfileId,
    );
    if (existingLink) {
      throw new HttpError(
        HTTP_STATUS.CONFLICT,
        ERROR_CODE.CAREGIVER_LINK_ALREADY_EXISTS,
        ERROR_MESSAGE.CAREGIVER_LINK_ALREADY_EXISTS,
      );
    }

    const row = await this.caregiverRepository.create({
      patientProfileId,
      caregiverProfileId: payload.caregiverProfileId,
      relationship: payload.relationship ?? null,
      permissions: payload.permissions ?? DEFAULT_CAREGIVER_PERMISSIONS,
    });

    return mapCaregiverLinkRowToDto(row);
  }

  async accept(userId: string, linkId: string): Promise<CaregiverLinkDto> {
    const caregiverProfileId = await this.getProfileIdByUserId(userId);
    const link = await this.caregiverRepository.findById(linkId);

    if (
      !link ||
      link.caregiver_profile_id !== caregiverProfileId ||
      link.status !== "pending"
    ) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.CAREGIVER_LINK_NOT_FOUND,
        ERROR_MESSAGE.CAREGIVER_LINK_NOT_FOUND,
      );
    }

    const acceptedLink = await this.caregiverRepository.acceptById(linkId);
    if (!acceptedLink) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.CAREGIVER_LINK_NOT_FOUND,
        ERROR_MESSAGE.CAREGIVER_LINK_NOT_FOUND,
      );
    }

    return mapCaregiverLinkRowToDto(acceptedLink);
  }

  async listCaregivers(userId: string): Promise<CaregiverForPatientDto[]> {
    const patientProfileId = await this.getProfileIdByUserId(userId);
    const rows =
      await this.caregiverRepository.listByPatientProfileId(patientProfileId);
    return rows.map(mapCaregiverForPatientToDto);
  }

  async listPatients(userId: string): Promise<PatientForCaregiverDto[]> {
    const caregiverProfileId = await this.getProfileIdByUserId(userId);
    const rows =
      await this.caregiverRepository.listByCaregiverProfileId(caregiverProfileId);
    return rows.map(mapPatientForCaregiverToDto);
  }

  async listInvitations(userId: string): Promise<PatientForCaregiverDto[]> {
    const caregiverProfileId = await this.getProfileIdByUserId(userId);
    const rows =
      await this.caregiverRepository.listPendingByCaregiverProfileId(
        caregiverProfileId,
      );
    return rows.map(mapPatientForCaregiverToDto);
  }

  async revoke(userId: string, linkId: string): Promise<CaregiverLinkDto> {
    const currentProfileId = await this.getProfileIdByUserId(userId);
    const link = await this.caregiverRepository.findById(linkId);

    if (
      !link ||
      (link.patient_profile_id !== currentProfileId &&
        link.caregiver_profile_id !== currentProfileId) ||
      !["pending", "accepted"].includes(link.status)
    ) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.CAREGIVER_LINK_NOT_FOUND,
        ERROR_MESSAGE.CAREGIVER_LINK_NOT_FOUND,
      );
    }

    const revokedLink = await this.caregiverRepository.revokeById(linkId);
    if (!revokedLink) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.CAREGIVER_LINK_NOT_FOUND,
        ERROR_MESSAGE.CAREGIVER_LINK_NOT_FOUND,
      );
    }

    return mapCaregiverLinkRowToDto(revokedLink);
  }
}
