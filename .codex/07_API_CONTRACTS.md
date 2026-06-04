# 07 — API Contracts

This file defines planned REST API contracts for the MVP.

Base path:

```txt
/api/v1
```

Auth:

```txt
Authorization: Bearer <supabase_access_token>
```

For hackathon speed, auth can be simplified if needed, but keep the API shape ready for Supabase Auth.

## Response format

Success:

```json
{
  "data": {},
  "message": "OK"
}
```

Error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": []
  }
}
```

---

# Profile

## GET `/profiles/me`

Return current user's profile.

## POST `/profiles`

Create profile.

Request:

```json
{
  "fullName": "Nguyen Van A",
  "ageGroup": "elderly",
  "accessibilityMode": "low_vision",
  "conditions": [
    { "name": "diabetes", "label": "Tiểu đường" }
  ],
  "allergies": [
    { "type": "ingredient", "name": "paracetamol", "label": "Paracetamol" }
  ],
  "doctorNote": "Uống sau ăn nếu có ghi chú.",
  "contactPhoneNumber": "0900000000"
}
```

## PATCH `/profiles/me`

Update current user's profile.

---

# Caregivers

## GET `/caregivers`

List caregiver links for the current patient profile.

## POST `/caregivers/invite`

Invite an existing caregiver profile to watch the current patient profile.

Request:

```json
{
  "caregiverProfileId": "uuid",
  "relationship": "Daughter",
  "permissions": {
    "notifySafetyWarnings": true,
    "notifyBlockedAttempts": true,
    "notifyMissedDose": true,
    "viewMedicationList": false,
    "viewIntakeHistory": false
  }
}
```

## PUT `/caregivers/:id/accept`

Accept a pending caregiver invitation. The current user must be the invited caregiver.

## GET `/caregivers/invitations`

List pending invitations for the current caregiver profile.

Response items include:

```json
{
  "id": "caregiver-link-id",
  "patientProfileId": "patient-profile-id",
  "caregiverProfileId": "caregiver-profile-id",
  "relationship": "Daughter",
  "status": "pending",
  "permissions": {
    "notifySafetyWarnings": true,
    "notifyBlockedAttempts": true,
    "notifyMissedDose": true,
    "viewMedicationList": false,
    "viewIntakeHistory": false
  },
  "patient": {
    "id": "patient-profile-id",
    "fullName": "Nguyen Van A"
  }
}
```

## GET `/caregivers/patients`

List accepted patient links for the current caregiver profile.

## DELETE `/caregivers/:id`

Revoke a pending or accepted caregiver-patient link. The current user must be either the patient or caregiver on the link.

---

# Devices

## POST `/devices/push-token`

Register or refresh the current user's Expo push token.

Request:

```json
{
  "expoPushToken": "ExpoPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "deviceId": "device-or-installation-id",
  "platform": "ios"
}
```

`platform` values:

```txt
ios
android
web
```

Response:

```json
{
  "data": {
    "id": "push-token-id",
    "profileId": "profile-id",
    "expoPushToken": "ExpoPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    "deviceId": "device-or-installation-id",
    "platform": "ios",
    "isActive": true,
    "createdAt": "2026-06-04T00:00:00.000Z",
    "updatedAt": "2026-06-04T00:00:00.000Z",
    "lastSeenAt": "2026-06-04T00:00:00.000Z"
  }
}
```

The endpoint is idempotent for the same profile/device id. Mobile may call it on app start or when Expo refreshes the token.

## GET `/devices/push-tokens`

List current user's active push tokens. Useful for debugging and device management.

## DELETE `/devices/push-token/:id`

Deactivate a push token belonging to the current user.

---

# Notifications

## GET `/notifications`

List notification events for the current user's profile.

Query:

```txt
?status=pending&eventType=safety_blocked&page=1&limit=20
```

`status` values:

```txt
pending
sent
failed
cancelled
```

Initial `eventType` values:

```txt
safety_blocked
safety_warning
intake_confirmed
intake_confirmed_after_warning
dose_missed
medication_reminder
scan_unknown_medicine
test
```

Response:

```json
{
  "data": [
    {
      "id": "notification-event-id",
      "patientProfileId": "patient-profile-id-or-null",
      "recipientProfileId": "recipient-profile-id",
      "eventType": "safety_blocked",
      "title": "Blocked safety check",
      "body": "Patient tried to take a medicine with a known allergy risk.",
      "payload": {
        "safetyCheckEventId": "uuid"
      },
      "status": "pending",
      "errorMessage": null,
      "sentAt": null,
      "createdAt": "2026-06-04T00:00:00.000Z",
      "updatedAt": "2026-06-04T00:00:00.000Z"
    }
  ]
}
```

This stage stores notification intent/history only. Expo sending is added in a later stage.

## GET `/notifications/:id`

Get notification event detail for the current user's profile.

The current user can only read notifications where they are the recipient.

Response:

```json
{
  "data": {
    "id": "notification-event-id",
    "patientProfileId": "patient-profile-id-or-null",
    "recipientProfileId": "recipient-profile-id",
    "eventType": "safety_blocked",
    "title": "Blocked safety check",
    "body": "Patient tried to take a medicine with a known allergy risk.",
    "payload": {
      "safetyCheckEventId": "uuid"
    },
    "status": "sent",
    "errorMessage": null,
    "sentAt": "2026-06-04T00:00:00.000Z",
    "createdAt": "2026-06-04T00:00:00.000Z",
    "updatedAt": "2026-06-04T00:00:00.000Z"
  }
}
```

## POST `/notifications/:id/send`

Send a notification event through Expo Push Service.

This is a development/debug endpoint for Stage 4. The current user can only send notifications where they are the recipient.

Behavior:

1. Load notification event.
2. Load current recipient's active push tokens.
3. Send Expo push notification.
4. Mark event `sent` if Expo accepts at least one ticket.
5. Mark event `failed` if no active tokens exist or all tickets fail.

Response:

```json
{
  "data": {
    "notification": {
      "id": "notification-event-id",
      "status": "sent"
    },
    "tickets": [
      {
        "status": "ok",
        "id": "expo-ticket-id"
      }
    ]
  }
}
```

---

# Medication catalog

## GET `/medication-catalogs/search?q=...`

Search Vietnam medication dataset.

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Metformin 500mg",
      "activeIngredient": "Metformin",
      "strength": "500mg",
      "dosageForm": "Tablet",
      "manufacturer": "Demo Manufacturer"
    }
  ]
}
```

---

# User medications

## GET `/medications`

List user's medications.

Query:

```txt
?active=true
```

## POST `/medications`

Create medication.

Request:

```json
{
  "catalogId": "uuid-or-null",
  "name": "Metformin 500mg",
  "activeIngredient": "Metformin",
  "strength": "500mg",
  "dosageForm": "Tablet",
  "note": "Uống sau ăn",
  "imageUrl": "https://..."
}
```

## GET `/medications/:id`

Get detail.

## PATCH `/medications/:id`

Update medication.

## PATCH `/medications/:id/stop`

Mark medication inactive.

## DELETE `/medications/:id`

Delete medication.

---

# Schedules

## GET `/schedules`

List active schedules.

## POST `/schedules`

Create schedule.

Request:

```json
{
  "userMedicationId": "uuid",
  "doseAmount": "1 viên",
  "times": ["08:00", "20:00"],
  "timesPerDay": 2,
  "minIntervalHours": 8,
  "instruction": "Uống sau ăn"
}
```

## PUT `/schedules/:id`

Replace schedule. Update APIs use `PUT` and must pass the full object.

Request:

```json
{
  "userMedicationId": "uuid",
  "doseAmount": "1 viên",
  "times": ["08:00", "20:00"],
  "timesPerDay": 2,
  "minIntervalHours": 8,
  "instruction": "Uống sau ăn",
  "isActive": true
}
```

## PUT `/schedules/:id/pause`

Pause schedule.

## DELETE `/schedules/:id`

Delete schedule.

---

# Today plan

## GET `/daily-plan/today`

Generate/read today's medication plan.

Response:

```json
{
  "data": {
    "date": "2026-05-31",
    "groups": [
      {
        "time": "08:00",
        "items": [
          {
            "userMedicationId": "uuid",
            "scheduleId": "uuid",
            "name": "Metformin 500mg",
            "doseAmount": "1 viên",
            "instruction": "Uống sau ăn",
            "status": "due"
          }
        ]
      }
    ]
  }
}
```

Status values:

```txt
not_yet
due
taken
missed
warning
blocked
```

---

# Safety check

## POST `/safety/check`

Run pre-intake safety check.

Request:

```json
{
  "userMedicationId": "uuid",
  "scheduleId": null,
  "scheduledTime": null,
  "source": "scan"
}
```

`scheduleId` and `scheduledTime` are optional. When `scheduleId` is omitted or `null`, backend automatically loads active schedules for `userMedicationId` and treats those schedules as the expected medication plan.

The `times` in medication schedules are reminder/UI references only. Safety timing is based on `minIntervalHours`, the last intake record, and today's intake count.

`source` values:

```txt
manual
today_plan
scan
```

Response:

```json
{
  "data": {
    "id": "uuid",
    "profileId": "profile-id",
    "userMedicationId": "uuid",
    "scheduleId": "uuid-or-null",
    "scheduledTime": "08:00",
    "result": "warning",
    "canConfirmIntake": true,
    "reasons": [
      {
        "code": "MIN_INTERVAL_VIOLATION",
        "severity": "warning",
        "message": "This medication was taken too recently.",
        "metadata": {
          "minIntervalHours": 6,
          "hoursSinceLastTaken": 2.5,
          "lastTakenAt": "2026-06-04T01:30:00.000Z",
          "scheduleIds": ["uuid"]
        }
      }
    ],
    "suggestedAction": "Please confirm the information carefully. If unsure, ask a caregiver, pharmacist, or doctor.",
    "checkedAt": "2026-06-04T00:00:00.000Z",
    "source": "today_plan"
  }
}
```

Important safety behavior:

- If the medication has no active schedule, backend returns a warning with `SCHEDULE_NOT_FOUND` because the medicine is not part of the user's expected active plan.
- If a provided `scheduleId` belongs to another medication, backend returns `SCHEDULE_MEDICATION_MISMATCH` as blocked.
- If the medication was taken before the active plan's `minIntervalHours`, backend returns `MIN_INTERVAL_VIOLATION` as warning.
- If today's taken count reaches the active plan's total daily dose limit, backend returns `DAILY_DOSE_LIMIT_REACHED` as blocked.
- If `catalogId` is `null`, backend returns `MEDICATION_NOT_VERIFIED_IN_CATALOG` as warning.

---

# Intake

## POST `/intakes`

Confirm intake.

Request:

```json
{
  "userMedicationId": "uuid",
  "scheduleId": "uuid-or-null",
  "scheduledTime": "08:00",
  "doseAmount": "1 viên",
  "safetyCheckEventId": "uuid",
  "confirmedAfterWarning": false
}
```

Backend must reject if related safety check is `blocked`.

## GET `/intakes/history?date=YYYY-MM-DD`

Daily intake history.

## POST `/intakes/missed`

Mark dose missed.

Request:

```json
{
  "userMedicationId": "uuid",
  "scheduleId": "uuid",
  "scheduledTime": "20:00",
  "date": "2026-05-31"
}
```

---

# Upload

## POST `/uploads`

Upload a static file to Supabase Storage and save its metadata to the `statics` table.

Request:

```txt
multipart/form-data
file=<binary>
purpose=medication_image | prescription_image | general
```

Response:

```json
{
  "data": {
    "staticId": "uuid",
    "url": "https://...",
    "bucket": "medication-images",
    "path": "medication_image/user-id/timestamp-uuid.jpg",
    "contentType": "image/jpeg",
    "size": 12345,
    "purpose": "medication_image",
    "createdAt": "2026-06-04T00:00:00.000Z",
    "updatedAt": null
  }
}
```

Later modules should receive `staticId` and resolve the file through the static module instead of accepting base64 payloads or trusting client-provided URLs.

## GET `/uploads/:id`

Return uploaded static file metadata for the current user.

---

# AI scan

## POST `/ai/scan-medication`

Pass uploaded static file id. Returns candidates only.

Request:

```json
{
  "staticId": "uuid"
}
```

Response:

```json
{
  "data": {
    "scanAttemptId": "uuid",
    "staticId": "uuid",
    "imageUrl": "https://...",
    "extractedData": {
      "name": "Metformin 500mg",
      "activeIngredient": "Metformin",
      "strength": "500mg",
      "dosageForm": "Tablet",
      "manufacturer": null,
      "visibleText": ["Metformin", "500mg"],
      "confidence": 0.9
    },
    "candidates": [
      {
        "catalogId": "uuid",
        "userMedicationId": "uuid-or-null",
        "name": "Metformin 500mg",
        "activeIngredient": "Metformin",
        "strength": "500mg",
        "dosageForm": "Tablet",
        "manufacturer": "Demo Manufacturer",
        "confidence": 0.82,
        "matchStatus": "user_medication_matched",
        "reason": "Matched an active user medication by name, active ingredient, strength."
      }
    ],
    "needsUserConfirmation": true,
    "source": "openai"
  }
}
```

## POST `/ai/scan-medication/:scanAttemptId/confirm`

Confirm the selected scan result and resolve it to a saved `user_medications` row.

The AI scan endpoint only extracts candidates. The user must confirm one path here before the backend can run the deterministic safety rules.

Supported confirmation types:

```txt
existing_user_medication
catalog_medication
manual_unverified
```

Use `existing_user_medication` when the scan candidate already has a `userMedicationId`.

Request:

```json
{
  "type": "existing_user_medication",
  "userMedicationId": "uuid"
}
```

Use `catalog_medication` when the scan matched a catalog medicine but the user has not saved it yet. Backend creates or reuses a `user_medications` row for that catalog item.

Request:

```json
{
  "type": "catalog_medication",
  "catalogId": "uuid",
  "saveToUserMedications": true,
  "note": "Optional user note"
}
```

Use `manual_unverified` when the medicine is not in our catalog, but the scan extracted structured information and the user confirms the packaging. Backend creates a `user_medications` row with `catalogId = null`; safety check will warn that this medicine is not verified in the local catalog.

Request:

```json
{
  "type": "manual_unverified",
  "name": "Tiffy",
  "activeIngredient": "Paracetamol",
  "strength": "500mg",
  "dosageForm": "Tablet",
  "note": "Gifted by a friend, packaging confirmed by user"
}
```

Response:

```json
{
  "data": {
    "scanAttemptId": "uuid",
    "confirmationType": "manual_unverified",
    "verificationStatus": "manual_unverified",
    "userMedication": {
      "id": "uuid",
      "profileId": "uuid",
      "catalogId": null,
      "name": "Tiffy",
      "activeIngredient": "Paracetamol",
      "strength": "500mg",
      "dosageForm": "Tablet",
      "note": "Gifted by a friend, packaging confirmed by user",
      "imageUrl": "https://...",
      "isActive": true,
      "createdAt": "2026-06-05T00:00:00.000Z",
      "updatedAt": "2026-06-05T00:00:00.000Z"
    },
    "nextAction": "run_safety_check",
    "safetyCheckPayload": {
      "userMedicationId": "uuid",
      "scheduleId": null,
      "scheduledTime": null,
      "source": "scan"
    }
  }
}
```

`verificationStatus` values:

```txt
existing_user_medication
catalog_verified
manual_unverified
already_confirmed
```

After confirmation, mobile should call `/safety/check` with `safetyCheckPayload`.

---

# AI explanation

## POST `/ai/explain-warning`

Optional for P1/P2. Rewrites rule-based result in simple Vietnamese.

Request:

```json
{
  "status": "blocked",
  "reasons": [
    {
      "code": "MIN_INTERVAL_NOT_REACHED",
      "severity": "critical",
      "message": "Bạn vừa uống thuốc này gần đây. Chưa đủ khoảng cách tối thiểu giữa hai lần uống."
    }
  ],
  "medicationName": "Metformin 500mg"
}
```

Response:

```json
{
  "data": {
    "message": "Bạn chưa nên uống thuốc này lúc này.",
    "explanation": "Bạn vừa uống thuốc này gần đây, nên hệ thống đang chặn để tránh uống quá sát liều.",
    "nextAction": "Vui lòng kiểm tra lại hoặc gọi người hỗ trợ."
  }
}
```
