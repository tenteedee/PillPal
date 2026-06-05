import { mapUserMedicationRowToDto } from "../medication/medication.mapper.js";
import type { UserMedicationRow } from "../medication/medication.types.js";
import type {
  ExternalMedicineCandidate,
  MedicineLookupDto,
  MedicineLookupEvidence,
  MedicineLookupRow,
  SaveMedicineLookupResultDto,
} from "./medicine-lookup.types.js";

export function mapMedicineLookupRowToDto(
  row: MedicineLookupRow,
): MedicineLookupDto {
  return {
    id: row.id,
    profileId: row.profile_id,
    scanAttemptId: row.scan_attempt_id,
    staticId: row.static_id,
    imageUrl: row.image_url,
    status: row.status,
    query: row.query,
    extractedData: row.extracted_data,
    evidence: normalizeEvidence(row.evidence),
    externalCandidates: normalizeExternalCandidates(row.external_candidates),
    userMedicationId: row.user_medication_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSaveMedicineLookupResultToDto(input: {
  lookup: MedicineLookupRow;
  medication: UserMedicationRow;
}): SaveMedicineLookupResultDto {
  return {
    lookup: mapMedicineLookupRowToDto(input.lookup),
    medication: mapUserMedicationRowToDto(input.medication),
  };
}

function normalizeEvidence(value: unknown): MedicineLookupEvidence | null {
  if (!value || typeof value !== "object") return null;
  const evidence = value as Partial<MedicineLookupEvidence>;
  if (
    typeof evidence.source !== "string" ||
    typeof evidence.checkedAt !== "string" ||
    typeof evidence.query !== "string" ||
    typeof evidence.summary !== "string"
  ) {
    return null;
  }

  return {
    source: evidence.source,
    checkedAt: evidence.checkedAt,
    query: evidence.query,
    summary: evidence.summary,
  };
}

function normalizeExternalCandidates(value: unknown): ExternalMedicineCandidate[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isExternalCandidate);
}

function isExternalCandidate(value: unknown): value is ExternalMedicineCandidate {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ExternalMedicineCandidate>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.authorizationStatus === "string" &&
    typeof candidate.verificationStatus === "string" &&
    typeof candidate.source === "string"
  );
}
