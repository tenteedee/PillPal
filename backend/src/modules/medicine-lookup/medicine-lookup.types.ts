import type { UserMedicationDto } from "../medication/medication.types.js";

export type MedicineLookupStatus = "pending" | "verified" | "failed" | "saved";
export type ExternalAuthorizationStatus = "authorized" | "not_authorized" | "unknown";
export type ExternalVerificationStatus =
  | "externally_verified"
  | "not_verified"
  | "rejected";

export type ExternalMedicineCandidate = {
  id: string;
  name: string;
  activeIngredient: string | null;
  strength: string | null;
  dosageForm: string | null;
  manufacturer: string | null;
  authorizationStatus: ExternalAuthorizationStatus;
  verificationStatus: ExternalVerificationStatus;
  source: string;
  sourceUrl: string | null;
};

export type MedicineLookupEvidence = {
  source: string;
  checkedAt: string;
  query: string;
  summary: string;
};

export type MedicineLookupRow = {
  id: string;
  profile_id: string;
  scan_attempt_id: string | null;
  static_id: string | null;
  image_url: string | null;
  status: MedicineLookupStatus;
  query: string | null;
  extracted_data: unknown;
  evidence: MedicineLookupEvidence | null;
  external_candidates: ExternalMedicineCandidate[];
  user_medication_id: string | null;
  created_at: string;
  updated_at: string;
};

export type MedicineLookupDto = {
  id: string;
  profileId: string;
  scanAttemptId: string | null;
  staticId: string | null;
  imageUrl: string | null;
  status: MedicineLookupStatus;
  query: string | null;
  extractedData: unknown;
  evidence: MedicineLookupEvidence | null;
  externalCandidates: ExternalMedicineCandidate[];
  userMedicationId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SaveMedicineLookupResultDto = {
  lookup: MedicineLookupDto;
  medication: UserMedicationDto;
};
