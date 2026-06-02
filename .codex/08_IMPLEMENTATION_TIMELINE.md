# 08 — 3-Day Implementation Timeline

This timeline is optimized for a 4-person hackathon team where only one member is comfortable with Go, so the final backend stack is Express + TypeScript.

## Team roles

### Person 1 — Backend lead

Main responsibilities:

- Express setup
- Supabase schema
- Core APIs
- Safety rule engine
- AI scan endpoint
- Intake endpoint

### Person 2 — Mobile core flow

Main responsibilities:

- Expo setup
- Navigation
- Onboarding
- Health profile screens
- Medication list/add/detail screens

### Person 3 — Mobile safety flow

Main responsibilities:

- Today plan screen
- Safety check result screen
- Confirm intake screen/flow
- History screen
- Warning/blocked demo flows

### Person 4 — UI/accessibility/demo data

Main responsibilities:

- Large text mode
- Large buttons
- Simple UI polish
- Text-to-speech buttons
- Demo seed medications
- Demo sample images
- Demo script support

---

# Day 1 — Foundation + CRUD

Goal: the app can create profile, add medication, and create schedule.

## Backend

1. Initialize `backend` project.
2. Configure TypeScript, Express, CORS, dotenv, error middleware.
3. Connect Supabase client.
4. Create Supabase SQL schema from `05_DATABASE_DESIGN_DRAFT.md`.
5. Implement profile APIs:
   - `GET /profiles/me`
   - `POST /profiles`
   - `PATCH /profiles/me`
6. Implement medication APIs:
   - `GET /medications`
   - `POST /medications`
   - `GET /medications/:id`
   - `PATCH /medications/:id`
   - `PATCH /medications/:id/stop`
7. Implement schedule APIs:
   - `GET /schedules`
   - `POST /schedules`
   - `PATCH /schedules/:id`

## Mobile

1. Initialize Expo app.
2. Add Expo Router.
3. Add API client.
4. Build screens:
   - onboarding/disclaimer
   - profile form
   - medication list
   - add medication
   - schedule form
5. Add simple navigation.

## Demo data

1. Create sample medication catalog records:
   - Metformin 500mg
   - Amlodipine 5mg
   - Paracetamol 500mg
   - Amoxicillin 500mg
2. Create sample allergy scenario.
3. Create sample too-soon scenario.

## Day 1 acceptance criteria

- User can create/update profile.
- User can add at least one medication.
- User can create a daily schedule.
- Data persists in Supabase.

---

# Day 2 — Safety check + intake history

Goal: the core product value works.

## Backend

1. Implement `GET /daily-plan/today`.
2. Implement safety input loader:
   - profile
   - medication
   - active schedule
   - today's intake count
   - last intake time
3. Implement `safety.rules.ts`.
4. Implement `POST /safety/check`.
5. Save safety check event.
6. Implement `POST /intakes`.
7. Reject intake if safety check is blocked.
8. Implement duplicate confirmation protection.
9. Implement `GET /intakes/history`.
10. Implement `POST /intakes/missed` if time allows.

## Mobile

1. Build today plan screen.
2. Add "Check before taking" button.
3. Build safety check result screen.
4. Show allowed/warning/blocked clearly.
5. Add confirm intake button for allowed/warning.
6. Hide/disable confirm button for blocked.
7. Build simple history screen.

## Day 2 acceptance criteria

Demo these scenarios:

1. Allowed: correct medicine, correct time, no conflict.
2. Warning: medicine not scheduled or too early.
3. Blocked: too soon since last intake.
4. Blocked: allergy match.
5. Intake history updates after confirmation.

---

# Day 3 — AI scan + accessibility + polish

Goal: the demo feels complete and understandable.

## Backend

1. Implement upload endpoint or direct image URL flow.
2. Implement `POST /ai/scan-medication`.
3. Use OpenAI Vision if API key is available.
4. Add mock fallback if OpenAI fails or no key is configured.
5. Save scan attempt.
6. Implement scan confirmation endpoint.
7. Optional: implement AI explanation endpoint.

## Mobile

1. Build scan screen.
2. Allow camera/upload image.
3. Show AI/mock candidates.
4. Require user confirmation.
5. Continue to safety check after confirmation.
6. Add text-to-speech button for warning/blocked.
7. Add accessibility mode visual improvements.
8. Polish important screens.

## Demo preparation

1. Prepare demo user profile.
2. Prepare sample medicines.
3. Prepare sample images.
4. Prepare script:
   - profile setup
   - add medicines
   - show today plan
   - scan medicine
   - allowed case
   - warning case
   - blocked case
   - read warning aloud
5. Prepare fallback plan if AI API fails:
   - use mock image-to-medication mapping.

## Day 3 acceptance criteria

- User can scan/upload image.
- App returns candidate medication.
- User confirms candidate.
- App runs safety check.
- App reads warning aloud.
- Demo has at least one allowed, one warning, and one blocked flow.

---

# Strict MVP order

If time is running out, implement in this order:

1. Manual medication selection
2. Safety check
3. Intake confirmation
4. Today plan
5. History
6. Mock scan
7. Real OpenAI scan
8. Text-to-speech
9. UI polish

Never sacrifice safety check for AI scan. AI scan is a demo enhancer; safety check is the product.
