import { apiFetch } from './client';

export type NotificationEventStatus = 'pending' | 'sent' | 'failed' | 'cancelled';

export type NotificationEventType =
  | 'safety_blocked'
  | 'safety_warning'
  | 'intake_confirmed'
  | 'intake_confirmed_after_warning'
  | 'dose_missed'
  | 'medication_reminder'
  | 'scan_unknown_medicine'
  | 'test';

export type NotificationEvent = {
  id: string;
  patientProfileId: string | null;
  recipientProfileId: string;
  eventType: NotificationEventType;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  status: NotificationEventStatus;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NotificationListInput = {
  status?: NotificationEventStatus;
  eventType?: NotificationEventType;
  page?: number;
  limit?: number;
};

export type ExpoPushSendResult = {
  notification: NotificationEvent;
  tickets: {
    status: 'ok' | 'error';
    id?: string;
    message?: string;
    details?: Record<string, unknown>;
  }[];
};

function buildQuery(input: NotificationListInput = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  }

  const query = params.toString();
  return query ? '?' + query : '';
}

export async function listNotifications(input: NotificationListInput = {}): Promise<NotificationEvent[]> {
  return apiFetch<NotificationEvent[]>('/notifications' + buildQuery(input));
}

export async function sendNotificationById(id: string): Promise<ExpoPushSendResult> {
  return apiFetch<ExpoPushSendResult>('/notifications/' + id + '/send', {
    method: 'POST',
  });
}
