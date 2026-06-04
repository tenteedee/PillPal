import { env } from "../../config/env.js";
import { getOpenAIClient } from "../../config/openai.js";
import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { ERROR_MESSAGE } from "../../shared/constants/error/error-messages.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { MedicationRepository } from "../medication/medication.repository.js";
import type { MedicationCatalogRow } from "../medication-catalog/medication-catalog.types.js";
import { MedicineLookupService } from "../medicine-lookup/medicine-lookup.service.js";
import type { MedicineLookupAttemptDto } from "../medicine-lookup/medicine-lookup.types.js";
import type { UserMedicationRow } from "../medication/medication.types.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import { StaticRepository } from "../static/static.repository.js";
import { StaticService } from "../static/static.service.js";
import {
  mapConfirmMedicationScanResultToDto,
  mapMedicationScanResultToDto,
} from "./ai.mapper.js";
import {
  MEDICATION_SCAN_SYSTEM_PROMPT,
  MEDICATION_SCAN_USER_PROMPT,
} from "./ai.prompts.js";
import { AiRepository } from "./ai.repository.js";
import type {
  ConfirmMedicationScanBody,
  ScanMedicationBody,
} from "./ai.schema.js";
import type {
  AiScanSource,
  ConfirmMedicationScanResultDto,
  MedicationScanCandidateDto,
  MedicationScanConfirmationType,
  MedicationScanExtraction,
  MedicationScanMatchStatus,
  MedicationScanVerificationStatus,
  MedicationScanResultDto,
} from "./ai.types.js";

const MOCK_EXTRACTION: MedicationScanExtraction = {
  name: "Metformin 500mg",
  activeIngredient: "Metformin",
  strength: "500mg",
  dosageForm: "Tablet",
  manufacturer: null,
  visibleText: ["Metformin", "500mg"],
  confidence: 0.9,
};

export class AiService {
  private readonly staticService = new StaticService(new StaticRepository());

  constructor(
    private readonly aiRepository: AiRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly medicationRepository: MedicationRepository,
    private readonly medicineLookupService: MedicineLookupService,
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

  async scanMedication(
    userId: string,
    payload: ScanMedicationBody,
  ): Promise<MedicationScanResultDto> {
    const profileId = await this.getProfileIdByUserId(userId);
    const staticFile = await this.staticService.getFileById(
      userId,
      payload.staticId,
    );

    if (
      !staticFile.contentType.startsWith("image/") ||
      staticFile.contentType.endsWith("pdf") ||
      !staticFile.url
    ) {
      throw new HttpError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODE.INVALID_UPLOAD_FILE,
        ERROR_MESSAGE.INVALID_UPLOAD_FILE,
      );
    }

    const extractionResult = await this.extractMedication(staticFile.url);
    const catalogRows = await this.aiRepository.findCatalogCandidates(
      extractionResult.extraction,
    );
    const candidates = await this.buildCandidates(profileId, catalogRows, {
      extraction: extractionResult.extraction,
    });

    const scanAttempt = await this.aiRepository.createScanAttempt({
      profileId,
      staticId: payload.staticId,
      imageUrl: staticFile.url,
      extractedData: extractionResult.extraction,
      aiResult: extractionResult.rawResult,
      candidates,
    });

    const medicineLookup =
      candidates.length === 0
        ? await this.medicineLookupService.ensureLookupForScanAttempt({
            profileId,
            scanAttemptId: scanAttempt.id,
            staticId: payload.staticId,
            status: "pending",
            extractedData: extractionResult.extraction,
          })
        : null;

    return mapMedicationScanResultToDto({
      scanAttemptId: scanAttempt.id,
      staticId: payload.staticId,
      imageUrl: staticFile.url,
      extractedData: extractionResult.extraction,
      candidates,
      medicineLookup,
      source: extractionResult.source,
    });
  }

  async confirmMedicationScan(
    userId: string,
    scanAttemptId: string,
    payload: ConfirmMedicationScanBody,
  ): Promise<ConfirmMedicationScanResultDto> {
    const profileId = await this.getProfileIdByUserId(userId);
    const scanAttempt = await this.aiRepository.findScanAttemptByIdAndProfileId(
      scanAttemptId,
      profileId,
    );

    if (!scanAttempt) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.AI_SCAN_ATTEMPT_NOT_FOUND,
        ERROR_MESSAGE.AI_SCAN_ATTEMPT_NOT_FOUND,
      );
    }

    const confirmationType = payload.type;

    if (scanAttempt.confirmed_user_medication_id) {
      const confirmedMedication =
        await this.medicationRepository.findByIdAndProfileId(
          scanAttempt.confirmed_user_medication_id,
          profileId,
        );

      if (confirmedMedication) {
        return this.buildConfirmationResult({
          scanAttemptId,
          confirmationType,
          verificationStatus: "already_confirmed",
          userMedication: confirmedMedication,
        });
      }
    }

    const userMedication = await this.resolveConfirmedMedication(
      profileId,
      scanAttempt.image_url,
      payload,
    );

    const confirmedScanAttempt = await this.aiRepository.confirmScanAttempt({
      scanAttemptId,
      profileId,
      userMedicationId: userMedication.id,
    });

    if (!confirmedScanAttempt) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.AI_SCAN_ATTEMPT_NOT_FOUND,
        ERROR_MESSAGE.AI_SCAN_ATTEMPT_NOT_FOUND,
      );
    }

    const medicineLookup =
      payload.type === "manual_unverified"
        ? await this.medicineLookupService.ensureLookupForScanAttempt({
            profileId,
            scanAttemptId,
            staticId: scanAttempt.static_id,
            userMedicationId: userMedication.id,
            status: "needs_admin_review",
            extractedData: mergeExtractionWithManualConfirmation(
              scanAttempt.extracted_data,
              payload,
            ),
          })
        : null;

    return this.buildConfirmationResult({
      scanAttemptId,
      confirmationType,
      verificationStatus: resolveVerificationStatus(payload),
      medicineLookup,
      userMedication,
    });
  }

  private async resolveConfirmedMedication(
    profileId: string,
    scanImageUrl: string | null,
    payload: ConfirmMedicationScanBody,
  ): Promise<UserMedicationRow> {
    if (payload.type === "existing_user_medication") {
      const medication = await this.medicationRepository.findByIdAndProfileId(
        payload.userMedicationId,
        profileId,
      );

      if (!medication) {
        throw new HttpError(
          HTTP_STATUS.NOT_FOUND,
          ERROR_CODE.MEDICATION_NOT_FOUND,
          ERROR_MESSAGE.MEDICATION_NOT_FOUND,
        );
      }

      return medication;
    }

    if (payload.type === "catalog_medication") {
      const existingMedications =
        await this.aiRepository.findActiveUserMedicationsByCatalogIds(profileId, [
          payload.catalogId,
        ]);

      if (existingMedications[0]) {
        return existingMedications[0];
      }

      const catalog = await this.aiRepository.findCatalogById(payload.catalogId);

      if (!catalog) {
        throw new HttpError(
          HTTP_STATUS.NOT_FOUND,
          ERROR_CODE.MEDICATION_CATALOG_NOT_FOUND,
          ERROR_MESSAGE.MEDICATION_CATALOG_NOT_FOUND,
        );
      }

      return this.medicationRepository.create(profileId, {
        catalogId: catalog.id,
        name: catalog.name,
        activeIngredient: catalog.active_ingredient ?? undefined,
        strength: catalog.strength ?? undefined,
        dosageForm: catalog.dosage_form ?? undefined,
        note: payload.note,
        imageUrl: scanImageUrl ?? undefined,
      });
    }

    return this.medicationRepository.create(profileId, {
      catalogId: null,
      name: payload.name,
      activeIngredient: payload.activeIngredient,
      strength: payload.strength,
      dosageForm: payload.dosageForm,
      note: payload.note ?? "Created from an unverified medication scan.",
      imageUrl: scanImageUrl ?? undefined,
    });
  }

  private buildConfirmationResult(input: {
    scanAttemptId: string;
    confirmationType: MedicationScanConfirmationType;
    verificationStatus: MedicationScanVerificationStatus;
    medicineLookup?: MedicineLookupAttemptDto | null;
    userMedication: UserMedicationRow;
  }): ConfirmMedicationScanResultDto {
    return mapConfirmMedicationScanResultToDto(input);
  }

  private async extractMedication(imageUrl: string): Promise<{
    extraction: MedicationScanExtraction;
    rawResult: unknown;
    source: AiScanSource;
  }> {
    if (!env.OPENAI_API_KEY) {
      return {
        extraction: MOCK_EXTRACTION,
        rawResult: { fallback: "missing_openai_api_key" },
        source: "mock",
      };
    }

    try {
      const openai = getOpenAIClient();
      const response = await openai.chat.completions.create({
        model: env.OPENAI_MODEL,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: MEDICATION_SCAN_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: [
              { type: "text", text: MEDICATION_SCAN_USER_PROMPT },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
      });

      const rawContent = response.choices[0]?.message.content;
      if (!rawContent) {
        throw new Error("OpenAI returned empty scan response");
      }

      return {
        extraction: parseMedicationScanExtraction(rawContent),
        rawResult: response,
        source: "openai",
      };
    } catch (error) {
      if (env.ENABLE_MOCK_AI_SCAN) {
        return {
          extraction: MOCK_EXTRACTION,
          rawResult: {
            fallback: "openai_scan_failed",
            error: getErrorMessage(error),
          },
          source: "mock",
        };
      }

      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.AI_SCAN_FAILED,
        ERROR_MESSAGE.AI_SCAN_FAILED,
        error,
      );
    }
  }

  private async buildCandidates(
    profileId: string,
    catalogRows: MedicationCatalogRow[],
    input: { extraction: MedicationScanExtraction },
  ): Promise<MedicationScanCandidateDto[]> {
    const scoredCatalogRows = catalogRows
      .map((row) => ({
        row,
        score: scoreCatalogMatch(row, input.extraction),
      }))
      .filter((candidate) => candidate.score >= 0.5)
      .sort((left, right) => right.score - left.score)
      .slice(0, 5);

    const catalogIds = scoredCatalogRows.map((candidate) => candidate.row.id);
    const userMedications =
      await this.aiRepository.findActiveUserMedicationsByCatalogIds(
        profileId,
        catalogIds,
      );
    const userMedicationByCatalogId = new Map(
      userMedications
        .filter((medication) => medication.catalog_id)
        .map((medication) => [medication.catalog_id as string, medication]),
    );

    return scoredCatalogRows.map(({ row, score }) => {
      const userMedication = userMedicationByCatalogId.get(row.id) ?? null;
      const matchStatus: MedicationScanMatchStatus = userMedication
        ? "user_medication_matched"
        : "catalog_matched";

      return {
        catalogId: row.id,
        userMedicationId: userMedication?.id ?? null,
        name: row.name,
        activeIngredient: row.active_ingredient,
        strength: row.strength,
        dosageForm: row.dosage_form,
        manufacturer: row.manufacturer,
        confidence: clampConfidence(score * input.extraction.confidence),
        matchStatus,
        reason: buildMatchReason(row, userMedication, input.extraction),
      };
    });
  }
}

function parseMedicationScanExtraction(
  rawContent: string,
): MedicationScanExtraction {
  const parsed = JSON.parse(rawContent) as Record<string, unknown>;

  return {
    name: parseNullableString(parsed.name),
    activeIngredient: parseNullableString(parsed.activeIngredient),
    strength: parseNullableString(parsed.strength),
    dosageForm: parseNullableString(parsed.dosageForm),
    manufacturer: parseNullableString(parsed.manufacturer),
    visibleText: Array.isArray(parsed.visibleText)
      ? parsed.visibleText.filter(
          (value): value is string => typeof value === "string",
        )
      : [],
    confidence: clampConfidence(
      typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
    ),
  };
}

function parseNullableString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function scoreCatalogMatch(
  row: MedicationCatalogRow,
  extraction: MedicationScanExtraction,
): number {
  let score = 0;

  if (matchesText(row.name, extraction.name)) score += 0.45;
  if (matchesText(row.active_ingredient, extraction.activeIngredient))
    score += 0.3;
  if (matchesText(row.strength, extraction.strength)) score += 0.15;
  if (matchesText(row.dosage_form, extraction.dosageForm)) score += 0.05;
  if (matchesText(row.manufacturer, extraction.manufacturer)) score += 0.05;

  return clampConfidence(score);
}

function matchesText(left: string | null, right: string | null): boolean {
  if (!left || !right) {
    return false;
  }

  const normalizedLeft = normalizeText(left);
  const normalizedRight = normalizeText(right);

  return (
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  );
}

function normalizeText(value: string): string {
  return value.toLowerCase().replaceAll(/\s+/g, " ").trim();
}

function clampConfidence(value: number): number {
  return Math.min(1, Math.max(0, Number(value.toFixed(2))));
}

function buildMatchReason(
  row: MedicationCatalogRow,
  userMedication: UserMedicationRow | null,
  extraction: MedicationScanExtraction,
): string {
  const fields = [
    matchesText(row.name, extraction.name) ? "name" : null,
    matchesText(row.active_ingredient, extraction.activeIngredient)
      ? "active ingredient"
      : null,
    matchesText(row.strength, extraction.strength) ? "strength" : null,
  ].filter(Boolean);

  const prefix = userMedication
    ? "Matched an active user medication"
    : "Matched medication catalog";

  return `${prefix} by ${fields.join(", ") || "visible package data"}.`;
}

function resolveVerificationStatus(
  payload: ConfirmMedicationScanBody,
): MedicationScanVerificationStatus {
  if (payload.type === "existing_user_medication") {
    return "existing_user_medication";
  }

  if (payload.type === "catalog_medication") {
    return "catalog_verified";
  }

  return "manual_unverified";
}

function mergeExtractionWithManualConfirmation(
  extractedData: unknown,
  payload: ConfirmMedicationScanBody,
): unknown {
  if (payload.type !== "manual_unverified") {
    return extractedData;
  }

  const base =
    extractedData && typeof extractedData === "object"
      ? (extractedData as Record<string, unknown>)
      : {};

  return {
    ...base,
    name: payload.name,
    activeIngredient: payload.activeIngredient ?? base.activeIngredient ?? null,
    strength: payload.strength ?? base.strength ?? null,
    dosageForm: payload.dosageForm ?? base.dosageForm ?? null,
    manualConfirmationNote: payload.note ?? null,
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}
