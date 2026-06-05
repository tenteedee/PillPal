import { randomUUID } from "node:crypto";

import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { ERROR_MESSAGE } from "../../shared/constants/error/error-messages.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { MedicationRepository } from "../medication/medication.repository.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import type { MedicationScanExtraction } from "../ai/ai.types.js";
import {
  mapMedicineLookupRowToDto,
  mapSaveMedicineLookupResultToDto,
} from "./medicine-lookup.mapper.js";
import { MedicineLookupRepository } from "./medicine-lookup.repository.js";
import type { SaveMedicineLookupBody } from "./medicine-lookup.schema.js";
import type {
  ExternalMedicineCandidate,
  MedicineLookupDto,
  MedicineLookupEvidence,
  MedicineLookupRow,
  SaveMedicineLookupResultDto,
} from "./medicine-lookup.types.js";

export class MedicineLookupService {
  constructor(
    private readonly lookupRepository: MedicineLookupRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly medicationRepository: MedicationRepository,
  ) {}

  async createPendingFromScan(input: {
    profileId: string;
    scanAttemptId: string;
    staticId: string;
    imageUrl: string | null;
    extraction: MedicationScanExtraction;
  }): Promise<MedicineLookupDto> {
    const lookup = await this.lookupRepository.createPending({
      profileId: input.profileId,
      scanAttemptId: input.scanAttemptId,
      staticId: input.staticId,
      imageUrl: input.imageUrl,
      query: buildLookupQuery(input.extraction),
      extractedData: input.extraction,
    });

    return mapMedicineLookupRowToDto(lookup);
  }

  async run(userId: string, lookupId: string): Promise<MedicineLookupDto> {
    const { profileId } = await this.getProfileContext(userId);
    const lookup = await this.getLookupForProfile(lookupId, profileId);

    if (lookup.status === "saved" || lookup.status === "verified") {
      return mapMedicineLookupRowToDto(lookup);
    }

    const extraction = normalizeExtraction(lookup.extracted_data);
    const query = lookup.query ?? buildLookupQuery(extraction);
    const checkedAt = new Date().toISOString();
    const evidence: MedicineLookupEvidence = {
      source: "mock_external_registry",
      checkedAt,
      query,
      summary: `External registry check found an authorized medicine candidate for ${query}.`,
    };
    const externalCandidates = [buildVerifiedCandidate(extraction, query)];

    const verifiedLookup = await this.lookupRepository.updateVerification({
      lookupId,
      profileId,
      status: "verified",
      evidence,
      externalCandidates,
    });

    if (!verifiedLookup) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.MEDICINE_LOOKUP_NOT_FOUND,
        ERROR_MESSAGE.MEDICINE_LOOKUP_NOT_FOUND,
      );
    }

    return mapMedicineLookupRowToDto(verifiedLookup);
  }

  async saveMedication(
    userId: string,
    lookupId: string,
    payload: SaveMedicineLookupBody,
  ): Promise<SaveMedicineLookupResultDto> {
    const { profileId } = await this.getProfileContext(userId);
    const lookup = await this.getLookupForProfile(lookupId, profileId);

    if (lookup.user_medication_id) {
      const medication = await this.medicationRepository.findByIdAndProfileId(
        lookup.user_medication_id,
        profileId,
      );

      if (medication) {
        return mapSaveMedicineLookupResultToDto({ lookup, medication });
      }
    }

    if (lookup.status !== "verified") {
      throw new HttpError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODE.VALIDATION_ERROR,
        "Medicine lookup must be verified before saving medication",
      );
    }

    const candidate = selectSaveableCandidate(
      lookup.external_candidates,
      payload.externalCandidateId,
    );

    const medication = await this.medicationRepository.create(profileId, {
      catalogId: null,
      name: candidate.name,
      activeIngredient: candidate.activeIngredient ?? undefined,
      strength: candidate.strength ?? undefined,
      dosageForm: candidate.dosageForm ?? undefined,
      note: payload.note ?? "Saved from verified external medicine lookup.",
      imageUrl: lookup.image_url ?? undefined,
    });

    const savedLookup = await this.lookupRepository.markSaved({
      lookupId,
      profileId,
      userMedicationId: medication.id,
    });

    if (!savedLookup) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.MEDICINE_LOOKUP_NOT_FOUND,
        ERROR_MESSAGE.MEDICINE_LOOKUP_NOT_FOUND,
      );
    }

    return mapSaveMedicineLookupResultToDto({
      lookup: savedLookup,
      medication,
    });
  }

  private async getProfileContext(userId: string): Promise<{ profileId: string }> {
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.PROFILE_NOT_FOUND,
        ERROR_MESSAGE.PROFILE_NOT_FOUND,
      );
    }

    return { profileId: profile.id };
  }

  private async getLookupForProfile(
    lookupId: string,
    profileId: string,
  ): Promise<MedicineLookupRow> {
    const lookup = await this.lookupRepository.findByIdAndProfileId(
      lookupId,
      profileId,
    );

    if (!lookup) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.MEDICINE_LOOKUP_NOT_FOUND,
        ERROR_MESSAGE.MEDICINE_LOOKUP_NOT_FOUND,
      );
    }

    return lookup;
  }
}

function buildLookupQuery(extraction: MedicationScanExtraction): string {
  return [extraction.name, extraction.activeIngredient, extraction.strength]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .trim() || "unknown medication";
}

function buildVerifiedCandidate(
  extraction: MedicationScanExtraction,
  query: string,
): ExternalMedicineCandidate {
  return {
    id: randomUUID(),
    name: extraction.name ?? query,
    activeIngredient: extraction.activeIngredient,
    strength: extraction.strength,
    dosageForm: extraction.dosageForm,
    manufacturer: extraction.manufacturer,
    authorizationStatus: "authorized",
    verificationStatus: "externally_verified",
    source: "mock_external_registry",
    sourceUrl: null,
  };
}

function selectSaveableCandidate(
  candidates: ExternalMedicineCandidate[],
  externalCandidateId?: string,
): ExternalMedicineCandidate {
  const saveableCandidates = candidates.filter(
    (candidate) =>
      candidate.authorizationStatus === "authorized" &&
      candidate.verificationStatus === "externally_verified",
  );

  const candidate = externalCandidateId
    ? saveableCandidates.find((item) => item.id === externalCandidateId)
    : saveableCandidates.length === 1
      ? saveableCandidates[0]
      : null;

  if (!candidate) {
    throw new HttpError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODE.VALIDATION_ERROR,
      "Choose one authorized and externally verified candidate to save",
    );
  }

  return candidate;
}

function normalizeExtraction(value: unknown): MedicationScanExtraction {
  if (!value || typeof value !== "object") {
    return emptyExtraction();
  }

  const record = value as Partial<MedicationScanExtraction>;
  return {
    name: parseNullableString(record.name),
    activeIngredient: parseNullableString(record.activeIngredient),
    strength: parseNullableString(record.strength),
    dosageForm: parseNullableString(record.dosageForm),
    manufacturer: parseNullableString(record.manufacturer),
    visibleText: Array.isArray(record.visibleText)
      ? record.visibleText.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
    confidence: typeof record.confidence === "number" ? record.confidence : 0.5,
  };
}

function parseNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function emptyExtraction(): MedicationScanExtraction {
  return {
    name: null,
    activeIngredient: null,
    strength: null,
    dosageForm: null,
    manufacturer: null,
    visibleText: [],
    confidence: 0.5,
  };
}
