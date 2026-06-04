import type {
  AiScanSource,
  MedicationScanCandidateDto,
  MedicationScanExtraction,
  MedicationScanResultDto,
} from "./ai.types.js";

export function mapMedicationScanResultToDto(input: {
  scanAttemptId: string;
  staticId: string;
  imageUrl: string;
  extractedData: MedicationScanExtraction;
  candidates: MedicationScanCandidateDto[];
  source: AiScanSource;
}): MedicationScanResultDto {
  return {
    scanAttemptId: input.scanAttemptId,
    staticId: input.staticId,
    imageUrl: input.imageUrl,
    extractedData: input.extractedData,
    candidates: input.candidates,
    needsUserConfirmation: true,
    source: input.source,
  };
}
