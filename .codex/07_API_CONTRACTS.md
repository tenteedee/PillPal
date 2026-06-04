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
    "notifyMedicationReminders": true,
    "notifyIntakeConfirmations": true,
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
    "notifyMedicationReminders": true,
    "notifyIntakeConfirmations": true,
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

Backend automatically creates notification events and sends Expo push for:

- `medication_reminder`: patient and caregivers with medication reminder permission.
- `safety_warning`: caregivers with safety warning permission.
- `safety_blocked`: caregivers with blocked attempt permission.
- `intake_confirmed`: caregivers with intake confirmation permission.
- `intake_confirmed_after_warning`: caregivers with intake confirmation permission.
- `scan_unknown_medicine`: caregivers with safety warning permission.

`dose_missed` is reserved for a future missed-dose job/API and is not automatically emitted in this stage.

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

Notification rows store delivery history. Backend attempts Expo push delivery when the event is created by core workflows, or when `POST /notifications/:id/send` is called for a pending/failed notification.

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

Schedule `times` are still mainly reminders/UI references, but when the frontend sends `scheduledTime`, backend verifies that the time belongs to the selected/active schedule and warns when the check is clearly too early or too late.

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
- If a provided `scheduledTime` is not part of the selected/active schedule, backend returns `NOT_SCHEDULED_TIME` as warning.
- If the check is more than 30 minutes before the provided `scheduledTime`, backend returns `TOO_EARLY` as warning.
- If the check is more than 120 minutes after the provided `scheduledTime`, backend returns `DOSE_TIME_PASSED` as warning.
- If the medication was taken before the active plan's `minIntervalHours`, backend returns `MIN_INTERVAL_VIOLATION` as warning.
- If today's taken count reaches the active plan's total daily dose limit, backend returns `DAILY_DOSE_LIMIT_REACHED` as blocked.
- If `catalogId` is `null`, backend returns `MEDICATION_NOT_VERIFIED_IN_CATALOG` as warning.

---

# Intake

## POST `/intakes`

Confirm intake.

This endpoint must be called after `/safety/check`. It records that the user actually took the medication and becomes the source of truth for later `minIntervalHours`, last-taken, and daily dose checks.

Request:

```json
{
  "userMedicationId": "uuid",
  "scheduleId": null,
  "scheduledTime": null,
  "doseAmount": "1 viên",
  "safetyCheckEventId": "uuid",
  "confirmedAfterWarning": false
}
```

Optional request fields:

```txt
scheduleId
scheduledTime
doseAmount
confirmedAfterWarning
takenAt
```

Backend behavior:

- Verifies the medication belongs to the current user.
- Verifies the optional schedule belongs to the current user and selected medication.
- Verifies the safety check belongs to the current user, selected medication, selected schedule, and selected scheduled time.
- Rejects if the safety check result is `blocked` or `canConfirmIntake = false`.
- Rejects if the same `safetyCheckEventId` was already used to create a taken intake.
- Rejects if the same `scheduleId + scheduledTime` was already confirmed on the same local app day.
- Creates an `intake_events` row with `status = taken`.
- If the safety check result was `warning`, stores the warning reasons in `warningSnapshot`.

Response:

```json
{
  "data": {
    "id": "uuid",
    "profileId": "uuid",
    "userMedicationId": "uuid",
    "scheduleId": null,
    "scheduledTime": null,
    "doseAmount": "1 viên",
    "takenAt": "2026-06-05T10:00:00.000Z",
    "status": "taken",
    "confirmedBy": "user",
    "safetyCheckEventId": "uuid",
    "warningSnapshot": [],
    "confirmedAfterWarning": false,
    "createdAt": "2026-06-05T10:00:00.000Z"
  },
  "message": "Created"
}
```

## GET `/intakes`

List current user's intake history.

Query:

```txt
?userMedicationId=uuid&scheduleId=uuid&status=taken&takenFrom=2026-06-05T00:00:00.000Z&takenTo=2026-06-06T00:00:00.000Z&page=1&limit=20
```

Filters are optional.

`status` values:

```txt
taken
missed
skipped
blocked_attempt
```

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "profileId": "uuid",
      "userMedicationId": "uuid",
      "scheduleId": "uuid-or-null",
      "scheduledTime": "08:00",
      "doseAmount": "1 viên",
      "takenAt": "2026-06-05T01:00:00.000Z",
      "status": "taken",
      "confirmedBy": "user",
      "safetyCheckEventId": "uuid",
      "warningSnapshot": [],
      "confirmedAfterWarning": false,
      "createdAt": "2026-06-05T01:00:00.000Z"
    }
  ]
}
```

## GET `/intakes/today`

List today's intake events for the current user using backend `APP_TIMEZONE`.

This is the simplest endpoint for mobile history widgets and daily plan refresh after confirming an intake.

Missed/skipped dose APIs are not implemented in this stage. For the MVP, missed state is derived by daily plan from schedule time and absence of a `taken` intake event.

---

# Medicine lookups

These records run and audit the unknown-medicine agentic workflow.

When `/ai/scan-medication` finds no catalog candidates, backend creates a `medicine_lookup_attempt` with `status = pending`.

When the user confirms a scan as `manual_unverified`, backend links the saved `user_medications` row to that lookup and moves it to `status = needs_admin_review`.

## GET `/medicine-lookups/sources`

List configured lookup sources.

Query:

```txt
?sourceType=distributor&active=true&page=1&limit=20
```

`sourceType` values:

```txt
distributor
administration
general_web
```

Initial seeded sources:

```txt
Nhà thuốc Long Châu -> distributor, requiredWorkerCount 1
Pharmacity -> distributor, requiredWorkerCount 1
Nhà thuốc An Khang -> distributor, requiredWorkerCount 1
Cục Quản lý Dược Việt Nam -> administration, requiredWorkerCount 1
Reputable web search -> general_web, requiredWorkerCount 3
```

Worker counts are DB-driven. Stage 5 orchestrator must load active sources by `sourceType` and dispatch `requiredWorkerCount` workers for each source. The supervisor can evaluate a stage only after all dispatched workers for that stage have returned structured output, structured error, or structured timeout.

Lookup workers use the OpenAI SDK to extract structured evidence from fetched source content. Each concrete agent owns a specific prompt:

```txt
OpenAIMedicineLookupAgent
DistributorLookupAgent
GeneralWebLookupAgent
AdministrationComparisonAgent
MedicineLookupSupervisorAgent
```

If `OPENAI_API_KEY` is missing or a model call fails, the worker stores deterministic fallback evidence with `analysisSource = "fallback"`.

Source responsibility:

- `distributor`: trusted pharmacy/distributor evidence. If found here, Stage 5 can move directly to candidate confirmation because Vietnamese distributors are expected to sell administration-authorized medicines.
- `general_web`: fallback evidence when distributor workers cannot find the pill. Use reputable sites only.
- `administration`: Vietnam region authorization check. Used after general-web discovery.

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Nhà thuốc Long Châu",
      "baseUrl": "https://nhathuoclongchau.com.vn/",
      "sourceType": "distributor",
      "requiredWorkerCount": 1,
      "isActive": true,
      "createdAt": "2026-06-05T00:00:00.000Z",
      "updatedAt": "2026-06-05T00:00:00.000Z"
    }
  ]
}
```

## GET `/medicine-lookups`

List current user's unknown medicine lookup attempts.

Query:

```txt
?status=pending&queryName=Tiffy&page=1&limit=20
```

`status` values:

```txt
pending
in_progress
needs_admin_review
verified
rejected
failed
```

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "profileId": "uuid",
      "scanAttemptId": "uuid",
      "staticId": "uuid",
      "userMedicationId": "uuid-or-null",
      "status": "needs_admin_review",
      "queryName": "Tiffy",
      "queryActiveIngredient": "Paracetamol",
      "queryManufacturer": null,
      "extractedData": {},
      "createdAt": "2026-06-05T00:00:00.000Z",
      "updatedAt": "2026-06-05T00:00:00.000Z"
    }
  ]
}
```

## POST `/medicine-lookups/:id/run`

Run the unknown medicine lookup orchestrator for the current user's lookup attempt.

Execution rules:

- Source groups are loaded from active `medicine_data_sources`.
- For each source, backend dispatches `requiredWorkerCount` workers.
- Workers inside the same stage may run in parallel.
- Mission stages remain sequential:

```txt
distributor -> supervisor -> general_web -> supervisor -> administration -> supervisor
```

- Supervisor evaluates a stage only after every dispatched worker in that stage returns structured output, structured error, or structured timeout.
- If distributor evidence is a clear match, backend returns early and skips general web plus administration.
- If distributor evidence is insufficient, backend runs general web workers.
- If general web finds a probable candidate, backend runs administration comparison.
- New medicines are not saved to `medication_catalogs`.
- A verified external medicine may later be saved only into the current user's `user_medications`.
- If scan extraction already proves the product is not for human medication use, such as packaging text saying "for veterinary use only", backend rejects the lookup deterministically before running external workers.

Response:

Same shape as `GET /medicine-lookups/:id`, with updated `status`, `evidence`, and `externalCandidates`.

Possible outcomes:

```txt
verified
needs_admin_review
rejected
failed
```

Notes:

- Distributor clear match saves an external candidate with `verificationStatus = externally_verified`.
- General web match plus administration match saves an external candidate with `verificationStatus = externally_verified`.
- General web match without clear administration match saves an external candidate with `verificationStatus = needs_admin_review`.
- No reliable evidence marks the lookup as `failed` or `needs_admin_review`.

## POST `/medicine-lookups/:id/save-medication`

Save a verified external medicine lookup candidate into the current user's medication list.

This endpoint is the Stage 6 bridge from unknown-medicine verification back into the normal medication flow. It does **not** save the medicine to `medication_catalogs`.

Rules:

- Lookup must belong to the current user.
- Lookup must have `status = verified`.
- Candidate must have `authorizationStatus = authorized`.
- Candidate must have `verificationStatus = externally_verified`.
- If `externalCandidateId` is omitted, backend uses the first saveable candidate for the lookup.
- If the lookup is already linked to a `userMedicationId`, backend returns the existing medication instead of creating a duplicate.
- Safety checks treat this saved medication as externally verified, even though `catalogId` remains `null`.
- After saving, frontend may create a schedule with the existing `POST /schedules` endpoint using the returned `medication.id`.

Request:

```json
{
  "externalCandidateId": "uuid-optional",
  "note": "Bought while traveling. Optional user note."
}
```

Response:

```json
{
  "data": {
    "lookup": {
      "id": "uuid",
      "userMedicationId": "created-user-medication-id",
      "status": "verified",
      "externalCandidates": []
    },
    "medication": {
      "id": "created-user-medication-id",
      "profileId": "uuid",
      "catalogId": null,
      "name": "Tiffy",
      "activeIngredient": "Paracetamol",
      "strength": "500mg",
      "dosageForm": "tablet",
      "note": "Bought while traveling. Optional user note.",
      "imageUrl": null,
      "isActive": true,
      "createdAt": "2026-06-05T00:00:00.000Z",
      "updatedAt": "2026-06-05T00:00:00.000Z"
    }
  }
}
```

## GET `/medicine-lookups/:id`

Get lookup detail, including worker evidence and external medication candidates.

Response:

```json
{
  "data": {
    "id": "uuid",
    "profileId": "uuid",
    "scanAttemptId": "uuid",
    "staticId": "uuid",
    "userMedicationId": "uuid-or-null",
    "status": "needs_admin_review",
    "queryName": "Tiffy",
    "queryActiveIngredient": "Paracetamol",
    "queryManufacturer": null,
    "extractedData": {},
    "createdAt": "2026-06-05T00:00:00.000Z",
    "updatedAt": "2026-06-05T00:00:00.000Z",
    "evidence": [],
    "externalCandidates": []
  }
}
```

`POST /medicine-lookups/:id/run` populates `evidence` and `externalCandidates`.

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

If no catalog/user-medication candidates are found, backend creates a medicine lookup attempt and returns it as `medicineLookup`.

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
    "medicineLookup": null,
    "needsUserConfirmation": true,
    "source": "openai"
  }
}
```

When no candidate is found:

```json
{
  "data": {
    "scanAttemptId": "uuid",
    "staticId": "uuid",
    "imageUrl": "https://...",
    "extractedData": {
      "name": "Tiffy",
      "activeIngredient": "Paracetamol",
      "strength": "500mg",
      "dosageForm": "Tablet",
      "manufacturer": null,
      "visibleText": ["Tiffy", "500mg"],
      "confidence": 0.82
    },
    "candidates": [],
    "medicineLookup": {
      "id": "uuid",
      "status": "pending",
      "queryName": "Tiffy",
      "queryActiveIngredient": "Paracetamol",
      "queryManufacturer": null
    },
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
    "medicineLookup": {
      "id": "uuid",
      "status": "needs_admin_review",
      "queryName": "Tiffy",
      "queryActiveIngredient": "Paracetamol",
      "queryManufacturer": null
    },
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
