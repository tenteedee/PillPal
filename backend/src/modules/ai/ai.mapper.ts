import type {
  AiScanSource,
  ConfirmMedicationScanResultDto,
  MedicationScanConfirmationType,
  MedicationScanCandidateDto,
  MedicationScanExtraction,
  MedicationScanResultDto,
  MedicationScanVerificationStatus,
} from "./ai.types.js";
import type { MedicineLookupDto } from "../medicine-lookup/medicine-lookup.types.js";
import { mapUserMedicationRowToDto } from "../medication/medication.mapper.js";
import type { UserMedicationRow } from "../medication/medication.types.js";

export function mapMedicationScanResultToDto(input: {
  scanAttemptId: string;
  staticId: string;
  imageUrl: string;
  extractedData: MedicationScanExtraction;
  candidates: MedicationScanCandidateDto[];
  source: AiScanSource;
  medicineLookup?: MedicineLookupDto | null;
}): MedicationScanResultDto {
  return {
    scanAttemptId: input.scanAttemptId,
    staticId: input.staticId,
    imageUrl: input.imageUrl,
    extractedData: input.extractedData,
    candidates: input.candidates,
    needsUserConfirmation: true,
    source: input.source,
    ...(input.medicineLookup !== undefined
      ? { medicineLookup: input.medicineLookup }
      : {}),
  };
}

export function mapConfirmMedicationScanResultToDto(input: {
  scanAttemptId: string;
  confirmationType: MedicationScanConfirmationType;
  verificationStatus: MedicationScanVerificationStatus;
  userMedication: UserMedicationRow;
}): ConfirmMedicationScanResultDto {
  const userMedication = mapUserMedicationRowToDto(input.userMedication);

  return {
    scanAttemptId: input.scanAttemptId,
    confirmationType: input.confirmationType,
    verificationStatus: input.verificationStatus,
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
