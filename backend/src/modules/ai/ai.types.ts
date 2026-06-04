export type AiScanSource = "openai" | "mock";

export type MedicationScanExtraction = {
  name: string | null;
  activeIngredient: string | null;
  strength: string | null;
  dosageForm: string | null;
  manufacturer: string | null;
  visibleText: string[];
  confidence: number;
};

export type MedicationScanMatchStatus =
  | "user_medication_matched"
  | "catalog_matched"
  | "no_match";

export type MedicationScanCandidateDto = {
  catalogId: string | null;
  userMedicationId: string | null;
  name: string;
  activeIngredient: string | null;
  strength: string | null;
  dosageForm: string | null;
  manufacturer: string | null;
  confidence: number;
  matchStatus: MedicationScanMatchStatus;
  reason: string;
};

export type MedicationScanResultDto = {
  scanAttemptId: string;
  staticId: string;
  imageUrl: string;
  extractedData: MedicationScanExtraction;
  candidates: MedicationScanCandidateDto[];
  needsUserConfirmation: true;
  source: AiScanSource;
};

export type ScanAttemptRow = {
  id: string;
  profile_id: string;
  static_id: string | null;
  image_url: string | null;
  extracted_data: unknown;
  ai_result: unknown;
  candidates: unknown;
  confirmed_user_medication_id: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
};
