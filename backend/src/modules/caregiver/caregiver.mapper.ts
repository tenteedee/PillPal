import { mapProfileRowToDto } from "../profile/profile.mapper.js";
import type { ProfileRow } from "../profile/profile.types.js";
import type {
  CaregiverForPatientDto,
  CaregiverLinkDto,
  CaregiverPatientLinkRow,
  PatientForCaregiverDto,
} from "./caregiver.types.js";

export function mapCaregiverLinkRowToDto(
  row: CaregiverPatientLinkRow,
): CaregiverLinkDto {
  return {
    id: row.id,
    patientProfileId: row.patient_profile_id,
    caregiverProfileId: row.caregiver_profile_id,
    relationship: row.relationship,
    status: row.status,
    permissions: row.permissions,
    createdAt: row.created_at,
    acceptedAt: row.accepted_at,
    revokedAt: row.revoked_at,
    updatedAt: row.updated_at,
  };
}

export function mapCaregiverForPatientToDto(input: {
  link: CaregiverPatientLinkRow;
  caregiver: ProfileRow;
}): CaregiverForPatientDto {
  return {
    ...mapCaregiverLinkRowToDto(input.link),
    caregiver: mapProfileRowToDto(input.caregiver),
  };
}

export function mapPatientForCaregiverToDto(input: {
  link: CaregiverPatientLinkRow;
  patient: ProfileRow;
}): PatientForCaregiverDto {
  return {
    ...mapCaregiverLinkRowToDto(input.link),
    patient: mapProfileRowToDto(input.patient),
  };
}
