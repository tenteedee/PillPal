import type { ProfileDto } from "../profile/profile.types.js";

export type CaregiverLinkStatus = "pending" | "accepted" | "revoked" | "declined";

export type CaregiverLinkPermissions = {
  notifySafetyWarnings: boolean;
  notifyBlockedAttempts: boolean;
  notifyMissedDose: boolean;
  notifyMedicationReminders: boolean;
  notifyIntakeConfirmations: boolean;
  viewMedicationList: boolean;
  viewIntakeHistory: boolean;
};

export type CaregiverPatientLinkRow = {
  id: string;
  patient_profile_id: string;
  caregiver_profile_id: string;
  relationship: string | null;
  status: CaregiverLinkStatus;
  permissions: CaregiverLinkPermissions;
  created_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  updated_at: string;
};

export type CaregiverLinkDto = {
  id: string;
  patientProfileId: string;
  caregiverProfileId: string;
  relationship: string | null;
  status: CaregiverLinkStatus;
  permissions: CaregiverLinkPermissions;
  createdAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  updatedAt: string;
};

export type CaregiverForPatientDto = CaregiverLinkDto & {
  caregiver: ProfileDto;
};

export type PatientForCaregiverDto = CaregiverLinkDto & {
  patient: ProfileDto;
};
