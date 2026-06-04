export type MedicineDataSourceType =
  | "distributor"
  | "administration"
  | "general_web";

export type MedicineLookupStatus =
  | "pending"
  | "in_progress"
  | "needs_admin_review"
  | "verified"
  | "rejected"
  | "failed";

export type MedicineLookupEvidenceType =
  | "distributor_match"
  | "web_match"
  | "administration_authorization"
  | "manufacturer_match"
  | "image_match";

export type ExternalMedicationAuthorizationStatus =
  | "unknown"
  | "pending"
  | "authorized"
  | "not_authorized"
  | "unclear";

export type ExternalMedicationVerificationStatus =
  | "pending_evidence"
  | "needs_admin_review"
  | "externally_verified"
  | "rejected";

export type MedicineDataSourceRow = {
  id: string;
  name: string;
  base_url: string;
  source_type: MedicineDataSourceType;
  required_worker_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MedicineLookupAttemptRow = {
  id: string;
  profile_id: string;
  scan_attempt_id: string | null;
  static_id: string | null;
  user_medication_id: string | null;
  status: MedicineLookupStatus;
  query_name: string | null;
  query_active_ingredient: string | null;
  query_manufacturer: string | null;
  extracted_data: unknown;
  created_at: string;
  updated_at: string;
};

export type MedicineLookupEvidenceRow = {
  id: string;
  lookup_attempt_id: string;
  medicine_data_source_id: string | null;
  source_url: string | null;
  source_title: string | null;
  evidence_type: MedicineLookupEvidenceType;
  extracted_data: unknown;
  confidence: number | null;
  checked_at: string;
  created_at: string;
};

export type ExternalMedicationCandidateRow = {
  id: string;
  lookup_attempt_id: string;
  name: string;
  active_ingredient: string | null;
  strength: string | null;
  dosage_form: string | null;
  manufacturer: string | null;
  country: string | null;
  authorization_status: ExternalMedicationAuthorizationStatus;
  authorization_source_url: string | null;
  verification_status: ExternalMedicationVerificationStatus;
  structured_data: unknown;
  created_at: string;
  updated_at: string;
};

export type MedicineDataSourceDto = {
  id: string;
  name: string;
  baseUrl: string;
  sourceType: MedicineDataSourceType;
  requiredWorkerCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MedicineLookupAttemptDto = {
  id: string;
  profileId: string;
  scanAttemptId: string | null;
  staticId: string | null;
  userMedicationId: string | null;
  status: MedicineLookupStatus;
  queryName: string | null;
  queryActiveIngredient: string | null;
  queryManufacturer: string | null;
  extractedData: unknown;
  createdAt: string;
  updatedAt: string;
};

export type MedicineLookupEvidenceDto = {
  id: string;
  lookupAttemptId: string;
  medicineDataSourceId: string | null;
  sourceUrl: string | null;
  sourceTitle: string | null;
  evidenceType: MedicineLookupEvidenceType;
  extractedData: unknown;
  confidence: number | null;
  checkedAt: string;
  createdAt: string;
};

export type ExternalMedicationCandidateDto = {
  id: string;
  lookupAttemptId: string;
  name: string;
  activeIngredient: string | null;
  strength: string | null;
  dosageForm: string | null;
  manufacturer: string | null;
  country: string | null;
  authorizationStatus: ExternalMedicationAuthorizationStatus;
  authorizationSourceUrl: string | null;
  verificationStatus: ExternalMedicationVerificationStatus;
  structuredData: unknown;
  createdAt: string;
  updatedAt: string;
};

export type MedicineLookupDetailDto = MedicineLookupAttemptDto & {
  evidence: MedicineLookupEvidenceDto[];
  externalCandidates: ExternalMedicationCandidateDto[];
};
