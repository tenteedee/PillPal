export type NotificationEventStatus =
  | "pending"
  | "sent"
  | "failed"
  | "cancelled";

export type NotificationEventType =
  | "safety_blocked"
  | "safety_warning"
  | "intake_confirmed"
  | "intake_confirmed_after_warning"
  | "dose_missed"
  | "medication_reminder"
  | "scan_unknown_medicine"
  | "test";

export type NotificationEventRow = {
  id: string;
  patient_profile_id: string | null;
  recipient_profile_id: string;
  event_type: NotificationEventType;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  status: NotificationEventStatus;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

export type NotificationEventDto = {
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

export type ExpoPushTicket = {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: {
    error?: string;
    [key: string]: unknown;
  };
};

export type ExpoPushSendResultDto = {
  notification: NotificationEventDto;
  tickets: ExpoPushTicket[];
};
