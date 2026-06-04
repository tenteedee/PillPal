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
  "caregiverName": "Nguyen Van B",
  "caregiverPhone": "0900000000"
}
```

## PATCH `/profiles/me`

Update current user's profile.

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

## PATCH `/schedules/:id`

Update schedule.

## PATCH `/schedules/:id/pause`

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
  "scheduleId": "uuid-or-null",
  "scheduledTime": "08:00",
  "source": "manual"
}
```

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
    "safetyCheckEventId": "uuid",
    "status": "warning",
    "canConfirmIntake": true,
    "reasons": [
      {
        "code": "TOO_EARLY_FOR_SCHEDULE",
        "severity": "warning",
        "message": "Hiện tại có vẻ chưa đến giờ uống thuốc này."
      }
    ],
    "suggestedAction": "Vui lòng kiểm tra lại lịch uống hoặc hỏi người hỗ trợ nếu bạn không chắc."
  }
}
```

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

Upload image or pass image URL. Returns candidates only.

Request option A:

```json
{
  "imageUrl": "https://..."
}
```

Response:

```json
{
  "data": {
    "scanAttemptId": "uuid",
    "candidates": [
      {
        "name": "Metformin 500mg",
        "activeIngredient": "Metformin",
        "strength": "500mg",
        "dosageForm": "Tablet",
        "confidence": 0.82,
        "matchedUserMedicationId": "uuid-or-null",
        "reason": "The package text appears similar to Metformin 500mg."
      }
    ],
    "needsUserConfirmation": true
  }
}
```

## POST `/ai/scan-medication/:scanAttemptId/confirm`

Confirm selected medication candidate.

Request:

```json
{
  "userMedicationId": "uuid"
}
```

After confirmation, mobile should call `/safety/check`.

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
