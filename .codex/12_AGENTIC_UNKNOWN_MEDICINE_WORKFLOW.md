# 12 — Agentic Unknown Medicine Workflow

This document captures the planned workflow for scanned medicines that are not found in the local PillPal medication catalog.

## Core Safety Boundary

AI agents may gather evidence, extract structured data, compare sources, and estimate whether a medicine identity is clear enough to continue.

AI agents must not decide whether the user can safely consume a medicine.

The final intake result must still come from deterministic backend safety rules:

```txt
allowed | warning | blocked
```

Correct flow:

```txt
AI assists -> user confirms -> deterministic rules decide -> AI may explain
```

Incorrect flow:

```txt
AI decides medicine is safe to consume
```

## Scenario

A user scans a medicine that is not found in the Vietnam medication catalog.

This may happen when:

- the user is traveling abroad
- the medicine is imported or uncommon
- the package text is incomplete or hard to read
- the current PillPal catalog is missing the product

PillPal should still support the workflow, but it must clearly communicate when the medicine cannot be fully verified.

## Orchestrator And Workers Pattern

Use an orchestrator-worker workflow.

The orchestrator receives the scan output, dispatches specialized workers, merges evidence, and produces a structured identity result.

Workers must return structured output so the data can be stored, reused, reviewed by admins, and fed into deterministic safety checks.

## Step 1 — Scan Agent

The scan agent extracts visible package information.

Structured output should include:

```json
{
  "productName": "string-or-null",
  "activeIngredients": ["string"],
  "strength": "string-or-null",
  "dosageForm": "string-or-null",
  "manufacturer": "string-or-null",
  "distributor": "string-or-null",
  "importer": "string-or-null",
  "country": "string-or-null",
  "registrationNumber": "string-or-null",
  "barcode": "string-or-null",
  "lotNumber": "string-or-null",
  "expiryDate": "string-or-null",
  "rawVisibleText": ["string"],
  "confidence": 0.0
}
```

The scan agent only extracts candidates. It does not approve intake.

## Step 2 — Distributor Workers

Use trusted Vietnam distributor/pharmacy sources as supporting evidence.

Initial allowed distributor sources:

```txt
https://nhathuoclongchau.com.vn/
https://www.pharmacity.vn/
https://www.nhathuocankhang.com/
```

The orchestrator must dispatch at least 1 distributor workers for each distributor site. Each worker should operate independently and return structured evidence.

These workers search by:

- product name
- active ingredient
- strength
- manufacturer
- distributor/importer
- registration number if available

Distributor sites are useful for product matching and retail evidence. For the MVP workflow, if a medicine is clearly found on trusted Vietnam distributor sources, the orchestrator may return the structured candidate to the next function without separately running the administration comparison, because these distributors are expected to carry administration-authorized products.

The worker still must store source metadata, matched fields, timestamp, and confidence. It must not decide whether the user can safely take the medicine.

## Step 3 — General Web Evidence Workers

Use broader web search only when distributor workers cannot find enough evidence, especially for foreign medicines.

The orchestrator must dispatch at least 3 general web workers. Each worker should search independently and only return evidence from reputable sources.

Search inputs may include:

- product name
- active ingredient
- strength
- manufacturer
- distributor
- importer
- country
- barcode
- visible package text

Only reputable sources should be trusted for evidence:

- official manufacturer websites
- official regulator websites
- hospital or pharmacy reference pages
- official product leaflets
- recognized medicine databases

Do not use random blogs, forums, or social posts as decisive evidence.

## Step 4 — Vietnam Administration Comparison Worker

Check Vietnam Drug Administration registration data:

```txt
https://dichvucong.dav.gov.vn/congbothuoc
```

This worker is required when the pill is found through general web evidence instead of trusted distributor evidence.

This can be handled by 1 administration comparison worker.

The worker searches by:

- medicine name
- active ingredient
- dosage form
- registering company
- manufacturer
- registration/license number

Administration evidence is the regional authorization check for Vietnam. Store source metadata and timestamp because registry data may change.

## Step 5 — Orchestrator Evidence Merge

The orchestrator merges all worker outputs into a structured identity result.

Suggested output:

```json
{
  "identityStatus": "verified | probable | uncertain | rejected",
  "vietnamAuthorizationStatus": "authorized | not_found | unclear | withdrawn_or_risky",
  "candidate": {
    "name": "string",
    "activeIngredients": ["string"],
    "strength": "string-or-null",
    "dosageForm": "string-or-null",
    "manufacturer": "string-or-null",
    "country": "string-or-null",
    "registrationNumber": "string-or-null"
  },
  "evidence": [
    {
      "sourceName": "string",
      "sourceUrl": "string",
      "sourceType": "distributor | administration | manufacturer | medical_reference | general_web",
      "trustLevel": "high | medium | low",
      "matchedFields": ["string"],
      "extractedData": {},
      "confidence": 0.0,
      "retrievedAt": "ISO-8601"
    }
  ],
  "missingFields": ["string"],
  "recommendedUserAction": "string"
}
```

## Decision Boundary

The orchestrator may decide:

```txt
This medicine identity is verified enough to continue.
```

The orchestrator must not decide:

```txt
The user can safely take this medicine.
```

If the medicine identity is unclear, the flow should stop or return a warning requiring user/caregiver/pharmacist confirmation.

If the medicine identity is clear but Vietnam authorization is not found, the flow should continue only as an unverified/foreign medicine workflow with warning.

## Safety Engine Integration

After identity evidence is merged:

1. User confirms the candidate.
2. Backend creates or updates a `user_medications` record if the user chooses to save it.
3. Safety check runs using deterministic rules.

Safety checks must still use:

- profile allergies
- medication name and active ingredient
- active/inactive medication state
- schedule
- minimum interval
- daily dose count
- last intake history

Unknown or unverified medicine should usually produce at least a warning:

```txt
MEDICATION_NOT_VERIFIED_IN_CATALOG
```

If active ingredient is missing:

```txt
MISSING_ACTIVE_INGREDIENT
```

If allergy matches:

```txt
ALLERGY_MATCH -> blocked
```

If interval or daily dose rules fail:

```txt
MIN_INTERVAL_VIOLATION -> blocked
DAILY_DOSE_LIMIT_REACHED -> blocked
```

## Suggested Future Tables

### `medicine_data_sources`

Admin-managed allowed source list, split by responsibility.

Suggested fields:

```txt
id
name
base_url
source_type
required_worker_count
trust_level
is_active
created_at
updated_at
```

`source_type` values:

```txt
distributor
administration
general_web
```

Worker-count rules:

```txt
distributor: at least 3 workers
general_web: at least 3 workers
administration: 1 comparison worker
```

### `medicine_lookup_attempts`

One row per unknown medicine investigation.

Suggested fields:

```txt
id
profile_id
image_url
scan_output jsonb
identity_status
vietnam_authorization_status
final_candidate jsonb
status
created_at
updated_at
```

### `medicine_lookup_evidence`

One row per source result.

Suggested fields:

```txt
id
lookup_attempt_id
source_name
source_url
source_type
trust_level
matched_fields jsonb
extracted_data jsonb
confidence
retrieved_at
created_at
```

### `external_medication_candidates`

Reusable normalized external candidates before admin/user acceptance.

Suggested fields:

```txt
id
name
active_ingredients jsonb
strength
dosage_form
manufacturer
country
registration_number
verification_status
evidence_summary jsonb
created_at
updated_at
```

## Product Copy Principle

For unknown medicines, PillPal should say:

```txt
We cannot fully verify this medicine.
```

PillPal should not say:

```txt
This medicine is safe.
```

Vietnamese warning copy example:

```txt
Thuốc này chưa có trong dữ liệu kiểm chứng của PillPal. Hệ thống chỉ có thể kiểm tra dựa trên thông tin bạn đã xác nhận. Nếu không chắc chắn, hãy hỏi dược sĩ, bác sĩ hoặc người chăm sóc.
```
