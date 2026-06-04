import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { ERROR_MESSAGE } from "../../shared/constants/error/error-messages.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import {
  mapMedicineDataSourceRowToDto,
  mapMedicineLookupAttemptRowToDto,
  mapMedicineLookupDetailToDto,
} from "./medicine-lookup.mapper.js";
import { MedicineLookupRepository } from "./medicine-lookup.repository.js";
import type {
  MedicineDataSourceListInput,
  MedicineLookupListInput,
} from "./medicine-lookup.schema.js";
import type {
  MedicineDataSourceDto,
  MedicineLookupAttemptDto,
  MedicineLookupDetailDto,
  MedicineLookupStatus,
} from "./medicine-lookup.types.js";

type ScanAttemptLookupInput = {
  profileId: string;
  scanAttemptId: string;
  staticId: string | null;
  userMedicationId?: string | null;
  status?: MedicineLookupStatus;
  extractedData: unknown;
};

export class MedicineLookupService {
  constructor(
    private readonly medicineLookupRepository: MedicineLookupRepository,
    private readonly profileRepository: ProfileRepository,
  ) {}

  async listMyLookups(
    userId: string,
    input: MedicineLookupListInput,
  ): Promise<MedicineLookupAttemptDto[]> {
    const profileId = await this.getProfileIdByUserId(userId);
    const rows = await this.medicineLookupRepository.listAttemptsByProfileId(
      profileId,
      input,
    );

    return rows.map(mapMedicineLookupAttemptRowToDto);
  }

  async getMyLookupById(
    userId: string,
    lookupAttemptId: string,
  ): Promise<MedicineLookupDetailDto> {
    const profileId = await this.getProfileIdByUserId(userId);
    const attempt =
      await this.medicineLookupRepository.findAttemptByIdAndProfileId(
        lookupAttemptId,
        profileId,
      );

    if (!attempt) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.MEDICINE_LOOKUP_NOT_FOUND,
        ERROR_MESSAGE.MEDICINE_LOOKUP_NOT_FOUND,
      );
    }

    const [evidence, externalCandidates] = await Promise.all([
      this.medicineLookupRepository.listEvidenceByAttemptId(attempt.id),
      this.medicineLookupRepository.listExternalCandidatesByAttemptId(
        attempt.id,
      ),
    ]);

    return mapMedicineLookupDetailToDto({
      attempt,
      evidence,
      externalCandidates,
    });
  }

  async listMedicineDataSources(
    input: MedicineDataSourceListInput,
  ): Promise<MedicineDataSourceDto[]> {
    const rows =
      await this.medicineLookupRepository.listMedicineDataSources(input);
    return rows.map(mapMedicineDataSourceRowToDto);
  }

  async ensureLookupForScanAttempt(
    input: ScanAttemptLookupInput,
  ): Promise<MedicineLookupAttemptDto> {
    const existing =
      await this.medicineLookupRepository.findAttemptByScanAttemptId(
        input.scanAttemptId,
        input.profileId,
      );

    if (existing) {
      if (input.userMedicationId) {
        const extraction = normalizeExtraction(input.extractedData);
        const updated =
          await this.medicineLookupRepository.updateAttemptForManualConfirmation(
            {
              lookupAttemptId: existing.id,
              profileId: input.profileId,
              userMedicationId: input.userMedicationId,
              queryName: extraction.name,
              queryActiveIngredient: extraction.activeIngredient,
              queryManufacturer: extraction.manufacturer,
              extractedData: input.extractedData,
            },
          );

        return mapMedicineLookupAttemptRowToDto(updated ?? existing);
      }

      return mapMedicineLookupAttemptRowToDto(existing);
    }

    const extraction = normalizeExtraction(input.extractedData);
    const row = await this.medicineLookupRepository.createAttempt({
      profileId: input.profileId,
      scanAttemptId: input.scanAttemptId,
      staticId: input.staticId,
      userMedicationId: input.userMedicationId ?? null,
      status: input.status ?? "pending",
      queryName: extraction.name,
      queryActiveIngredient: extraction.activeIngredient,
      queryManufacturer: extraction.manufacturer,
      extractedData: input.extractedData,
    });

    return mapMedicineLookupAttemptRowToDto(row);
  }

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
}

function normalizeExtraction(value: unknown): {
  name: string | null;
  activeIngredient: string | null;
  manufacturer: string | null;
} {
  if (!value || typeof value !== "object") {
    return {
      name: null,
      activeIngredient: null,
      manufacturer: null,
    };
  }

  const record = value as Record<string, unknown>;

  return {
    name: parseOptionalString(record.name),
    activeIngredient: parseOptionalString(record.activeIngredient),
    manufacturer: parseOptionalString(record.manufacturer),
  };
}

function parseOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
