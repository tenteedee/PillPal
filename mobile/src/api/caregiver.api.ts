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
  notifyIntakeConfirmations: boolean;
  viewMedicationList: boolean;
  viewIntakeHistory: boolean;
};

export type CaregiverLink = {
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

export type CaregiverForPatient = CaregiverLink & {
  caregiver: ProfileDto;
};

export type PatientForCaregiver = CaregiverLink & {
  patient: ProfileDto;
};

export type InviteCaregiverInput = {
  caregiverProfileId: string;
  relationship?: string | null;
  permissions?: Partial<CaregiverLinkPermissions>;
};

export async function listCaregivers(): Promise<CaregiverForPatient[]> {
  return apiFetch<CaregiverForPatient[]>('/caregivers');
}

export async function inviteCaregiver(
  input: InviteCaregiverInput,
): Promise<CaregiverLink> {
  return apiFetch<CaregiverLink>('/caregivers/invite', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function listCaregiverInvitations(): Promise<PatientForCaregiver[]> {
  return apiFetch<PatientForCaregiver[]>('/caregivers/invitations');
}

export async function listCaregiverPatients(): Promise<PatientForCaregiver[]> {
  return apiFetch<PatientForCaregiver[]>('/caregivers/patients');
}

export async function acceptCaregiverInvitation(
  linkId: string,
): Promise<PatientForCaregiver> {
  return apiFetch<PatientForCaregiver>('/caregivers/' + linkId + '/accept', {
    method: 'PUT',
  });
}

export async function revokeCaregiverLink(linkId: string): Promise<void> {
  await apiFetch('/caregivers/' + linkId, {
    method: 'DELETE',
  });
}
