import { apiFetch } from './client';

export type ProfileDto = {
  id: string;
  userId: string;
  fullName: string;
  ageGroup: string | null;
  accessibilityMode: string;
  conditions: unknown[];
  allergies: unknown[];
  doctorNote: string | null;
  contactPhoneNumber: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CaregiverLinkStatus = 'pending' | 'accepted' | 'revoked' | 'declined';

export type CaregiverLinkPermissions = {
  notifySafetyWarnings: boolean;
  notifyBlockedAttempts: boolean;
  notifyMissedDose: boolean;
  notifyMedicationReminders: boolean;
  viewMedicationList: boolean;
  viewIntakeHistory: boolean;
};

export type CaregiverForPatient = {
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
  caregiver: ProfileDto;
};

export async function listCaregivers(): Promise<CaregiverForPatient[]> {
  return apiFetch<CaregiverForPatient[]>('/caregivers');
}
