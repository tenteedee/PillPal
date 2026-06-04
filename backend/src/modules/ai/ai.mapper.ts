import type {
  AiScanSource,
  ConfirmMedicationScanResultDto,
  MedicationScanLookupDto,
  MedicationScanConfirmationType,
  MedicationScanCandidateDto,
  MedicationScanExtraction,
  MedicationScanResultDto,
  MedicationScanVerificationStatus,
} from "./ai.types.js";
import { mapUserMedicationRowToDto } from "../medication/medication.mapper.js";
import type { UserMedicationRow } from "../medication/medication.types.js";
import type { MedicineLookupAttemptDto } from "../medicine-lookup/medicine-lookup.types.js";

export function mapMedicationScanResultToDto(input: {
  scanAttemptId: string;
  staticId: string;
  imageUrl: string;
  extractedData: MedicationScanExtraction;
  candidates: MedicationScanCandidateDto[];
  medicineLookup?: MedicineLookupAttemptDto | null;
  source: AiScanSource;
}): MedicationScanResultDto {
  return {
    scanAttemptId: input.scanAttemptId,
    staticId: input.staticId,
    imageUrl: input.imageUrl,
    extractedData: input.extractedData,
    candidates: input.candidates,
    medicineLookup: input.medicineLookup
      ? mapMedicineLookupAttemptToScanLookupDto(input.medicineLookup)
      : null,
    needsUserConfirmation: true,
    source: input.source,
  };
}

export function mapConfirmMedicationScanResultToDto(input: {
  scanAttemptId: string;
  confirmationType: MedicationScanConfirmationType;
  verificationStatus: MedicationScanVerificationStatus;
  medicineLookup?: MedicineLookupAttemptDto | null;
  userMedication: UserMedicationRow;
}): ConfirmMedicationScanResultDto {
  const userMedication = mapUserMedicationRowToDto(input.userMedication);

  return {
    scanAttemptId: input.scanAttemptId,
    confirmationType: input.confirmationType,
    verificationStatus: input.verificationStatus,
    medicineLookup: input.medicineLookup
      ? mapMedicineLookupAttemptToScanLookupDto(input.medicineLookup)
      : null,
    userMedication,
    nextAction: "run_safety_check",
    safetyCheckPayload: {
      userMedicationId: userMedication.id,
      scheduleId: null,
      scheduledTime: null,
      source: "scan",
    },
  };
}

function mapMedicineLookupAttemptToScanLookupDto(
  lookup: MedicineLookupAttemptDto,
): MedicationScanLookupDto {
  return {
    id: lookup.id,
    status: lookup.status,
    queryName: lookup.queryName,
    queryActiveIngredient: lookup.queryActiveIngredient,
    queryManufacturer: lookup.queryManufacturer,
  };
}
