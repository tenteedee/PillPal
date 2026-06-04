import type {
  ExternalMedicationCandidateDto,
  ExternalMedicationCandidateRow,
  MedicineDataSourceDto,
  MedicineDataSourceRow,
  MedicineLookupAttemptDto,
  MedicineLookupAttemptRow,
  MedicineLookupDetailDto,
  MedicineLookupEvidenceDto,
  MedicineLookupEvidenceRow,
} from "./medicine-lookup.types.js";

export function mapMedicineDataSourceRowToDto(
  row: MedicineDataSourceRow,
): MedicineDataSourceDto {
  return {
    id: row.id,
    name: row.name,
    baseUrl: row.base_url,
    sourceType: row.source_type,
    requiredWorkerCount: row.required_worker_count,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapMedicineLookupAttemptRowToDto(
  row: MedicineLookupAttemptRow,
): MedicineLookupAttemptDto {
  return {
    id: row.id,
    profileId: row.profile_id,
    scanAttemptId: row.scan_attempt_id,
    staticId: row.static_id,
    userMedicationId: row.user_medication_id,
    status: row.status,
    queryName: row.query_name,
    queryActiveIngredient: row.query_active_ingredient,
    queryManufacturer: row.query_manufacturer,
    extractedData: row.extracted_data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapMedicineLookupEvidenceRowToDto(
  row: MedicineLookupEvidenceRow,
): MedicineLookupEvidenceDto {
  return {
    id: row.id,
    lookupAttemptId: row.lookup_attempt_id,
    medicineDataSourceId: row.medicine_data_source_id,
    sourceUrl: row.source_url,
    sourceTitle: row.source_title,
    evidenceType: row.evidence_type,
    extractedData: row.extracted_data,
    confidence: row.confidence,
    checkedAt: row.checked_at,
    createdAt: row.created_at,
  };
}

export function mapExternalMedicationCandidateRowToDto(
  row: ExternalMedicationCandidateRow,
): ExternalMedicationCandidateDto {
  return {
    id: row.id,
    lookupAttemptId: row.lookup_attempt_id,
    name: row.name,
    activeIngredient: row.active_ingredient,
    strength: row.strength,
    dosageForm: row.dosage_form,
    manufacturer: row.manufacturer,
    country: row.country,
    authorizationStatus: row.authorization_status,
    authorizationSourceUrl: row.authorization_source_url,
    verificationStatus: row.verification_status,
    structuredData: row.structured_data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapMedicineLookupDetailToDto(input: {
  attempt: MedicineLookupAttemptRow;
  evidence: MedicineLookupEvidenceRow[];
  externalCandidates: ExternalMedicationCandidateRow[];
}): MedicineLookupDetailDto {
  return {
    ...mapMedicineLookupAttemptRowToDto(input.attempt),
    evidence: input.evidence.map(mapMedicineLookupEvidenceRowToDto),
    externalCandidates: input.externalCandidates.map(
      mapExternalMedicationCandidateRowToDto,
    ),
  };
}
