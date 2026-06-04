import type {
  NotificationEventDto,
  NotificationEventRow,
} from "./notification.types.js";

export function mapNotificationEventRowToDto(
  row: NotificationEventRow,
): NotificationEventDto {
  return {
    id: row.id,
    patientProfileId: row.patient_profile_id,
    recipientProfileId: row.recipient_profile_id,
    eventType: row.event_type,
    title: row.title,
    body: row.body,
    payload: row.payload,
    status: row.status,
    errorMessage: row.error_message,
    sentAt: row.sent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
