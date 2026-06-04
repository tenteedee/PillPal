import { apiFetch } from './client';

export type SafetyResult = 'allowed' | 'warning' | 'blocked';
export type SafetySeverity = 'info' | 'warning' | 'blocked';

export type SafetyReason = {
  code: string;
  severity: SafetySeverity;
  message: string;
  metadata?: Record<string, unknown>;
};

export type SafetyCheckRequest = {
  userMedicationId: string;
  scheduleId?: string | null;
  scheduledTime?: string | null;
  source: 'manual' | 'today_plan' | 'scan';
};

export type SafetyCheckResult = {
  id: string;
  profileId: string;
  userMedicationId: string;
  scheduleId: string | null;
  scheduledTime: string | null;
  result: SafetyResult;
  canConfirmIntake: boolean;
  reasons: SafetyReason[];
  suggestedAction: string | null;
  checkedAt: string;
  source: 'manual' | 'today_plan' | 'scan';
};

export async function runSafetyCheck(payload: SafetyCheckRequest): Promise<SafetyCheckResult> {
  return apiFetch<SafetyCheckResult>('/safety/check', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
