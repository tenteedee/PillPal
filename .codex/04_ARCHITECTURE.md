# 04 — Project Architecture

## High-level architecture

```txt
Expo React Native App
        |
        | HTTPS REST API
        v
Express TypeScript Backend
        |
        +-- Supabase Postgres
        +-- Supabase Auth
        +-- Supabase Storage
        |
        +-- OpenAI API
```

## Core rule

The backend is the source of truth for safety checks.

The mobile app should never decide final safety status by itself.

## Backend architecture

Use a modular monolith. Do not create microservices for the MVP.

Recommended structure:

```txt
backend/
├── package.json
├── tsconfig.json
├── .env.example
└── src/
    ├── app.ts
    ├── server.ts
    ├── config/
    │   ├── env.ts
    │   ├── supabase.ts
    │   └── openai.ts
    ├── shared/
    │   ├── errors/
    │   ├── middlewares/
    │   │   ├── auth.middleware.ts
    │   │   ├── error.middleware.ts
    │   │   └── validate.middleware.ts
    │   ├── types/
    │   └── utils/
    │       ├── date-time.ts
    │       └── response.ts
    └── modules/
        ├── profile/
        │   ├── profile.routes.ts
        │   ├── profile.controller.ts
        │   ├── profile.service.ts
        │   ├── profile.repository.ts
        │   ├── profile.mapper.ts
        │   ├── profile.types.ts
        │   └── profile.schema.ts
        ├── medication/
        │   ├── medication.routes.ts
        │   ├── medication.controller.ts
        │   ├── medication.service.ts
        │   ├── medication.repository.ts
        │   ├── medication.mapper.ts
        │   ├── medication.types.ts
        │   └── medication.schema.ts
        ├── schedule/
        │   ├── schedule.routes.ts
        │   ├── schedule.controller.ts
        │   ├── schedule.service.ts
        │   ├── schedule.repository.ts
        │   ├── schedule.mapper.ts
        │   ├── schedule.types.ts
        │   └── schedule.schema.ts
        ├── daily-plan/
        │   ├── daily-plan.routes.ts
        │   ├── daily-plan.controller.ts
        │   ├── daily-plan.service.ts
        │   ├── daily-plan.mapper.ts
        │   ├── daily-plan.types.ts
        │   └── daily-plan.schema.ts
        ├── safety/
        │   ├── safety.routes.ts
        │   ├── safety.controller.ts
        │   ├── safety.service.ts
        │   ├── safety.rules.ts
        │   ├── safety.messages.ts
        │   ├── safety.repository.ts
        │   ├── safety.mapper.ts
        │   ├── safety.types.ts
        │   └── safety.schema.ts
        ├── intake/
        │   ├── intake.routes.ts
        │   ├── intke.controller.ts
        │   ├── intake.service.ts
        │   ├── intake.repository.ts
        │   ├── intake.mapper.ts
        │   ├── intake.types.ts
        │   └── intake.schema.ts
        ├── ai/
        │   ├── ai.routes.ts
        │   ├── ai.controller.ts
        │   ├── ai.service.ts
        │   ├── ai.prompts.ts
        │   ├── ai.mapper.ts
        │   ├── ai.types.ts
        │   └── ai.schema.ts
        └── upload/
            ├── upload.routes.ts
            ├── upload.controller.ts
            └── upload.service.ts
```

## Backend layer rules

### Routes

- Define HTTP path and method.
- Apply auth middleware and validation middleware.
- Call service.
- Return response.

### Services

- Business logic orchestration.
- Call repositories.
- Call safety rules.
- Call AI service only from AI-related modules or controlled orchestration.

### Repositories

- Supabase database access.
- Keep query logic here.
- Do not put business safety rules in repositories.

### Safety rules

- All deterministic checks must live in `safety.rules.ts`.
- No OpenAI calls here.
- No UI-specific copy here except stable reason codes/messages.

## Mobile architecture

Recommended structure:

```txt
mobile/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── onboarding.tsx
│   ├── profile.tsx
│   ├── medications/
│   │   ├── index.tsx
│   │   ├── new.tsx
│   │   └── [id].tsx
│   ├── schedule/
│   │   ├── index.tsx
│   │   └── new.tsx
│   ├── today.tsx
│   ├── scan.tsx
│   ├── safety-check/
│   │   └── [medicationId].tsx
│   └── history.tsx
├── src/
│   ├── api/
│   │   ├── client.ts
│   │   ├── profile.api.ts
│   │   ├── medication.api.ts
│   │   ├── schedule.api.ts
│   │   ├── safety.api.ts
│   │   ├── intake.api.ts
│   │   └── ai.api.ts
│   ├── components/
│   │   ├── AppButton.tsx
│   │   ├── AppCard.tsx
│   │   ├── WarningBanner.tsx
│   │   ├── MedicationCard.tsx
│   │   └── ReadAloudButton.tsx
│   ├── features/
│   │   ├── profile/
│   │   ├── medications/
│   │   ├── schedule/
│   │   ├── today/
│   │   ├── safety/
│   │   ├── intake/
│   │   └── scan/
│   ├── hooks/
│   ├── store/
│   ├── theme/
│   └── utils/
```

## Critical data flows

### Flow 1 — Manual safety check

```txt
User selects medication
→ mobile calls POST /safety/check
→ backend loads profile + medication + schedule + intake history
→ backend runs safety.rules.ts
→ backend saves safety_check_events
→ backend returns result
→ mobile shows allowed/warning/blocked
```

### Flow 2 — AI scan then safety check

```txt
User uploads/captures image
→ mobile uploads image to backend or Supabase Storage
→ backend calls OpenAI Vision or mock fallback
→ backend returns candidates
→ user confirms candidate
→ mobile calls POST /safety/check with confirmed medication id
→ backend runs rule-based safety check
```

### Flow 3 — Confirm intake

```txt
Safety check result is allowed or warning
→ user confirms intake
→ mobile calls POST /intakes
→ backend validates safety status and duplicate risk
→ backend saves intake_events
→ mobile refreshes today plan/history
```

## Maintainability principles

- Keep API contracts stable and typed.
- Keep safety reasons code-based, not only text-based.
- Store snapshots of warning reasons in intake events.
- Keep AI prompts isolated in `ai.prompts.ts`.
- Keep UI warning copy simple and consistent.
