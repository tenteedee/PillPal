import { getSupabaseClient } from "../../config/supabase.js";
import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import type { ProfileRow } from "../profile/profile.types.js";
import type {
  CaregiverLinkPermissions,
  CaregiverPatientLinkRow,
} from "./caregiver.types.js";

export class CaregiverRepository {
  async findActiveLink(
    patientProfileId: string,
    caregiverProfileId: string,
  ): Promise<CaregiverPatientLinkRow | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("caregiver_patient_links")
      .select("*")
      .eq("patient_profile_id", patientProfileId)
      .eq("caregiver_profile_id", caregiverProfileId)
      .in("status", ["pending", "accepted"])
      .maybeSingle<CaregiverPatientLinkRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.CAREGIVER_LINK_READ_FAILED,
        "Failed to read caregiver link",
        error,
      );
    }

    return data;
  }

  async create(input: {
    patientProfileId: string;
    caregiverProfileId: string;
    relationship: string | null;
    permissions: CaregiverLinkPermissions;
  }): Promise<CaregiverPatientLinkRow> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("caregiver_patient_links")
      .insert({
        patient_profile_id: input.patientProfileId,
        caregiver_profile_id: input.caregiverProfileId,
        relationship: input.relationship,
        permissions: input.permissions,
      })
      .select("*")
      .single<CaregiverPatientLinkRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.CAREGIVER_LINK_CREATE_FAILED,
        "Failed to create caregiver link",
        error,
      );
    }

    return data;
  }

  async findById(id: string): Promise<CaregiverPatientLinkRow | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("caregiver_patient_links")
      .select("*")
      .eq("id", id)
      .maybeSingle<CaregiverPatientLinkRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.CAREGIVER_LINK_READ_FAILED,
        `Failed to read caregiver link ${id}`,
        error,
      );
    }

    return data;
  }

  async acceptById(id: string): Promise<CaregiverPatientLinkRow | null> {
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("caregiver_patient_links")
      .update({
        status: "accepted",
        accepted_at: now,
        updated_at: now,
      })
      .eq("id", id)
      .eq("status", "pending")
      .select("*")
      .maybeSingle<CaregiverPatientLinkRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.CAREGIVER_LINK_UPDATE_FAILED,
        `Failed to accept caregiver link ${id}`,
        error,
      );
    }

    return data;
  }

  async revokeById(id: string): Promise<CaregiverPatientLinkRow | null> {
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("caregiver_patient_links")
      .update({
        status: "revoked",
        revoked_at: now,
        updated_at: now,
      })
      .eq("id", id)
      .in("status", ["pending", "accepted"])
      .select("*")
      .maybeSingle<CaregiverPatientLinkRow>();

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.CAREGIVER_LINK_UPDATE_FAILED,
        `Failed to revoke caregiver link ${id}`,
        error,
      );
    }

    return data;
  }

  async listByPatientProfileId(patientProfileId: string): Promise<
    Array<{
      link: CaregiverPatientLinkRow;
      caregiver: ProfileRow;
    }>
  > {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("caregiver_patient_links")
      .select("*, caregiver:profiles!caregiver_patient_links_caregiver_profile_id_fkey(*)")
      .eq("patient_profile_id", patientProfileId)
      .in("status", ["pending", "accepted"])
      .order("created_at", { ascending: false });

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.CAREGIVER_LINK_READ_FAILED,
        `Failed to list caregivers for profile ${patientProfileId}`,
        error,
      );
    }

    return ((data as Array<CaregiverPatientLinkRow & { caregiver: ProfileRow }>) ?? [])
      .filter((row) => row.caregiver)
      .map((row) => ({
        link: row,
        caregiver: row.caregiver,
      }));
  }

  async listByCaregiverProfileId(caregiverProfileId: string): Promise<
    Array<{
      link: CaregiverPatientLinkRow;
      patient: ProfileRow;
    }>
  > {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("caregiver_patient_links")
      .select("*, patient:profiles!caregiver_patient_links_patient_profile_id_fkey(*)")
      .eq("caregiver_profile_id", caregiverProfileId)
      .eq("status", "accepted")
      .order("created_at", { ascending: false });

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.CAREGIVER_LINK_READ_FAILED,
        `Failed to list patients for caregiver ${caregiverProfileId}`,
        error,
      );
    }

    return ((data as Array<CaregiverPatientLinkRow & { patient: ProfileRow }>) ?? [])
      .filter((row) => row.patient)
      .map((row) => ({
        link: row,
        patient: row.patient,
      }));
  }

  async listPendingByCaregiverProfileId(caregiverProfileId: string): Promise<
    Array<{
      link: CaregiverPatientLinkRow;
      patient: ProfileRow;
    }>
  > {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("caregiver_patient_links")
      .select("*, patient:profiles!caregiver_patient_links_patient_profile_id_fkey(*)")
      .eq("caregiver_profile_id", caregiverProfileId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.CAREGIVER_LINK_READ_FAILED,
        `Failed to list caregiver invitations for profile ${caregiverProfileId}`,
        error,
      );
    }

    return ((data as Array<CaregiverPatientLinkRow & { patient: ProfileRow }>) ?? [])
      .filter((row) => row.patient)
      .map((row) => ({
        link: row,
        patient: row.patient,
      }));
  }

  async listAcceptedReminderCaregiverProfileIds(
    patientProfileId: string,
  ): Promise<string[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("caregiver_patient_links")
      .select("caregiver_profile_id, permissions")
      .eq("patient_profile_id", patientProfileId)
      .eq("status", "accepted");

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.CAREGIVER_LINK_READ_FAILED,
        `Failed to list accepted caregivers for reminders ${patientProfileId}`,
        error,
      );
    }

    return (
      (data as Array<{
        caregiver_profile_id: string;
        permissions: Partial<CaregiverLinkPermissions> | null;
      }>) ?? []
    )
      .filter((row) => row.permissions?.notifyMedicationReminders !== false)
      .map((row) => row.caregiver_profile_id);
  }

  async listAcceptedNotificationCaregiverProfileIds(
    patientProfileId: string,
    permission:
      | "notifySafetyWarnings"
      | "notifyBlockedAttempts"
      | "notifyMissedDose"
      | "notifyMedicationReminders"
      | "notifyIntakeConfirmations",
  ): Promise<string[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("caregiver_patient_links")
      .select("caregiver_profile_id, permissions")
      .eq("patient_profile_id", patientProfileId)
      .eq("status", "accepted");

    if (error) {
      throw new HttpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODE.CAREGIVER_LINK_READ_FAILED,
        `Failed to list accepted caregivers for notifications ${patientProfileId}`,
        error,
      );
    }

    return (
      (data as Array<{
        caregiver_profile_id: string;
        permissions: Partial<CaregiverLinkPermissions> | null;
      }>) ?? []
    )
      .filter((row) => row.permissions?.[permission] !== false)
      .map((row) => row.caregiver_profile_id);
  }
}
