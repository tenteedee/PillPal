# 09 — AI Guidelines

AI is an assistive layer. It must not be the source of truth for medication safety decisions.

## AI use cases

### MVP/P1

1. Medication image scan:
   - Input: image of medication, blister, or packaging.
   - Output: candidate medicines with confidence.
   - User must confirm candidate.

2. Warning explanation:
   - Input: rule-based safety result.
   - Output: simple Vietnamese explanation.
   - Must not add new medical claims.

### P2

1. Real OCR.
2. Prescription upload extraction.
3. Medication information summarization from trusted data.

## Do not use AI for

- Final safety decision.
- Diagnosis.
- Prescription.
- Dose changes.
- Advice to stop medication.
- Drug interaction warnings unless backed by trusted dataset.
- Contraindication warnings unless backed by trusted dataset.

## AI scan flow

```txt
Image
→ OpenAI Vision / mock fallback
→ JSON candidates
→ user confirms candidate
→ backend rule-based safety check
```

## Candidate output schema

```ts
type MedicationScanResult = {
  candidates: MedicationCandidate[];
  needsUserConfirmation: true;
  warning?: string;
};

type MedicationCandidate = {
  name: string;
  activeIngredient?: string;
  strength?: string;
  dosageForm?: string;
  confidence: number;
  matchedUserMedicationId?: string | null;
  matchedCatalogId?: string | null;
  reason: string;
};
```

## Backend fallback behavior

If OpenAI API key is missing or request fails:

- Return mock candidate based on demo image name or selected demo option.
- Do not break the demo.
- Include `source: "mock"` in metadata.

Example mock mapping:

```ts
const mockScanMap = {
  "metformin": {
    name: "Metformin 500mg",
    activeIngredient: "Metformin",
    strength: "500mg",
    dosageForm: "Tablet",
    confidence: 0.91,
  },
  "amlodipine": {
    name: "Amlodipine 5mg",
    activeIngredient: "Amlodipine",
    strength: "5mg",
    dosageForm: "Tablet",
    confidence: 0.88,
  },
};
```

## AI scan prompt direction

System behavior:

```txt
You identify possible medication candidates from an image. You are not a doctor. You must not decide whether the medicine is safe to take. Return only structured JSON candidates. If unsure, return low confidence and tell the app that user confirmation is required.
```

User content:

```txt
Analyze this medication image. Extract visible medicine name, active ingredient, strength, dosage form, and packaging clues if possible. Return top candidates only. Always require user confirmation.
```

## AI explanation guardrail

System behavior:

```txt
You rewrite medication safety warnings in simple Vietnamese. You must only use the rule-based result and provided facts. Do not diagnose, prescribe, change dose, or tell the user to stop medication. For risky cases, suggest checking with a caregiver, pharmacist, or doctor.
```

## AI explanation input

```json
{
  "status": "blocked",
  "medicationName": "Metformin 500mg",
  "reasons": [
    {
      "code": "MIN_INTERVAL_NOT_REACHED",
      "severity": "critical",
      "message": "Bạn vừa uống thuốc này gần đây. Chưa đủ khoảng cách tối thiểu giữa hai lần uống."
    }
  ],
  "lastTakenAt": "2026-05-31T08:00:00+07:00",
  "minIntervalHours": 8
}
```

## AI explanation output

```json
{
  "message": "Bạn chưa nên uống thuốc này lúc này.",
  "explanation": "Bạn vừa uống thuốc này gần đây, nên hệ thống đang chặn để tránh uống quá sát liều.",
  "nextAction": "Vui lòng kiểm tra lại hoặc gọi người hỗ trợ nếu bạn không chắc."
}
```

## UI requirement for AI results

Always show that the scan is uncertain:

```txt
Tôi nghĩ đây có thể là: Metformin 500mg.
Vui lòng xác nhận trước khi tiếp tục.
```

Do not show:

```txt
Đây chắc chắn là Metformin 500mg.
```

## Data privacy note

For the MVP, do not upload unnecessary personal health information to AI calls.

For image scan, send only the image.

For explanation, send only:

- medication name
- rule result
- reason codes/messages
- relevant schedule/intake facts

Do not send full profile if not needed.
