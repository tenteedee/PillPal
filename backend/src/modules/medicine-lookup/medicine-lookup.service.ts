import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { ERROR_MESSAGE } from "../../shared/constants/error/error-messages.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { mapUserMedicationRowToDto } from "../medication/medication.mapper.js";
import { MedicationRepository } from "../medication/medication.repository.js";
import type { UserMedicationDto } from "../medication/medication.types.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import {
  mapMedicineDataSourceRowToDto,
  mapMedicineLookupAttemptRowToDto,
  mapMedicineLookupDetailToDto,
} from "./medicine-lookup.mapper.js";
import { MedicineLookupOrchestrator } from "./medicine-lookup.orchestrator.js";
import { MedicineLookupRepository } from "./medicine-lookup.repository.js";
import type {
  MedicineDataSourceListInput,
  MedicineLookupListInput,
  SaveLookupMedicationBody,
} from "./medicine-lookup.schema.js";
import type {
  ExternalMedicationCandidateRow,
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
    private readonly medicationRepository: MedicationRepository,
    private readonly medicineLookupOrchestrator = new MedicineLookupOrchestrator(
      medicineLookupRepository,
    ),
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

  async runMyLookup(
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

    await this.medicineLookupOrchestrator.run(attempt);

    return this.getMyLookupById(userId, lookupAttemptId);
  }

  async listMedicineDataSources(
    input: MedicineDataSourceListInput,
  ): Promise<MedicineDataSourceDto[]> {
    const rows =
      await this.medicineLookupRepository.listMedicineDataSources(input);
    return rows.map(mapMedicineDataSourceRowToDto);
  }

  async saveMyLookupAsMedication(
    userId: string,
    lookupAttemptId: string,
    input: SaveLookupMedicationBody,
  ): Promise<{
    lookup: MedicineLookupDetailDto;
    medication: UserMedicationDto;
  }> {
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

    if (attempt.user_medication_id) {
      const medication = await this.medicationRepository.findByIdAndProfileId(
        attempt.user_medication_id,
        profileId,
      );

      if (!medication) {
        throw new HttpError(
          HTTP_STATUS.NOT_FOUND,
          ERROR_CODE.MEDICATION_NOT_FOUND,
          ERROR_MESSAGE.MEDICATION_NOT_FOUND,
        );
      }

      return {
        lookup: await this.getMyLookupById(userId, lookupAttemptId),
        medication: mapUserMedicationRowToDto(medication),
      };
    }

    if (attempt.status !== "verified") {
      throw new HttpError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODE.VALIDATION_ERROR,
        "Only a verified medicine lookup can be saved as a user medication",
      );
    }

    const candidates =
      await this.medicineLookupRepository.listExternalCandidatesByAttemptId(
        attempt.id,
      );
    const selectedCandidate = selectSaveableCandidate(
      candidates,
      input.externalCandidateId,
    );

    if (!selectedCandidate) {
      throw new HttpError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODE.VALIDATION_ERROR,
        "No authorized externally verified candidate is available to save",
      );
    }

    const medication = await this.medicationRepository.create(profileId, {
      catalogId: null,
      name: selectedCandidate.name,
      activeIngredient: selectedCandidate.active_ingredient ?? undefined,
      strength: selectedCandidate.strength ?? undefined,
      dosageForm: selectedCandidate.dosage_form ?? undefined,
      note:
        input.note ??
        buildExternalMedicationNote(selectedCandidate.authorization_source_url),
    });

    await this.medicineLookupRepository.linkAttemptToUserMedication({
      lookupAttemptId: attempt.id,
      profileId,
      userMedicationId: medication.id,
    });

    return {
      lookup: await this.getMyLookupById(userId, lookupAttemptId),
      medication: mapUserMedicationRowToDto(medication),
    };
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

function selectSaveableCandidate(
  candidates: ExternalMedicationCandidateRow[],
  externalCandidateId: string | undefined,
): ExternalMedicationCandidateRow | null {
  const saveableCandidates = candidates.filter(
    (candidate) =>
      candidate.authorization_status === "authorized" &&
      candidate.verification_status === "externally_verified",
  );

  if (externalCandidateId) {
    return (
      saveableCandidates.find(
        (candidate) => candidate.id === externalCandidateId,
      ) ?? null
    );
  }

  return saveableCandidates[0] ?? null;
}

function buildExternalMedicationNote(
  authorizationSourceUrl: string | null,
): string {
  const sourceNote = authorizationSourceUrl
    ? ` Authorization source: ${authorizationSourceUrl}`
    : "";

  return `Created from a verified external medicine lookup.${sourceNote}`;
}
