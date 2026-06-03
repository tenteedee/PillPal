# AGENTS.md — Codex Instructions for PillPal

## Project identity

This repository is for **PillPal**.

PillPal is a mobile-first medication safety assistant focused on **pre-intake safety check**: before a user takes a medicine, the app helps verify whether it is the right medicine, at the right time, with the right dose, and whether there are obvious risks based on the user's saved profile.

The project must be shipped as a hackathon MVP in roughly **3 days**. Prefer pragmatic, maintainable implementation over over-engineering. Testing is not required for this deadline.

## Before coding, read these docs in order

1. `.codex/00_INDEX.md`
2. `.codex/01_PROJECT_OVERVIEW.md`
3. `.codex/02_FEATURE_SCOPE.md`
4. `.codex/03_TECH_STACK.md`
5. `.codex/04_ARCHITECTURE.md`
6. `.codex/05_DATABASE_DESIGN_DRAFT.md`
7. `.codex/06_SAFETY_RULES.md`
8. `.codex/07_API_CONTRACTS.md`
9. `.codex/08_IMPLEMENTATION_TIMELINE.md`
10. `.codex/09_AI_GUIDELINES.md`
11. `.codex/10_UI_ACCESSIBILITY_GUIDELINES.md`
12. `.codex/11_ENV_AND_DEPLOYMENT.md`

## Core implementation principles

- The core product value is **not** a medical chatbot.
- The core product value is **rule-based pre-intake safety checking**.
- AI may help with medication image recognition and user-friendly explanations.
- AI must **not** decide whether a medication is safe to take.
- Safety decisions must be produced by deterministic backend rules.
- The app must not diagnose, prescribe, change doses, or recommend stopping medication.
- Any AI scan result must require user confirmation before safety check.
- Any high-risk warning should suggest contacting a caregiver, pharmacist, or doctor.

## Deadline priorities

Prioritize in this order:

1. User health profile
2. Medication management
3. Medication schedule
4. Today medication plan
5. Safety check rule engine
6. Intake confirmation and history
7. Basic scan flow using OpenAI Vision or mock fallback
8. Accessibility UI and text-to-speech

Do not spend time on:

- Microservices
- Kafka / Redis
- Complex role-based permission system
- Full drug interaction engine
- Full caregiver dashboard
- Production-grade push notification system
- Barcode/QR integration unless core flow is already complete
- Automated testing unless explicitly requested

## Expected repository layout

Use this repository shape unless the existing repo already has a different structure:

```txt
.
├── AGENTS.md
├── .codex/
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── app.ts
│       ├── server.ts
│       ├── config/
│       ├── shared/
│       └── modules/
│           ├── profile/
│           ├── medication/
│           ├── schedule/
│           ├── daily-plan/
│           ├── safety/
│           ├── intake/
│           ├── ai/
│           └── upload/
├── mobile/
│   ├── package.json
│   ├── app.json
│   ├── .env.example
│   ├── app/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── theme/
│   │   └── utils/
│   └── assets/
└── .vscode/
    └── launch.json
```

## Backend rules

- Use Express + TypeScript.
- Keep modules separated by business capability.
- Use Zod for request validation.
- Use Supabase as the hosted database/auth/storage platform.
- Use Swagger to generate API Documentation.
- Get list APIs must include PaginationInput under `backend/src/shared/types/pagination.ts`, as well as filtering query params.
- All the update APIs MUST be implemented with PUT method.
- Put all safety rules in `backend/src/modules/safety/safety.rules.ts`.
- Do not call OpenAI from the safety rule engine.
- Store safety check logs for demo/history.
- OpenAI only for medication scan candidate extraction and friendly explanation.
- Safety decision must be rule-based, not AI-based.

## Mobile rules

- Use Expo React Native + TypeScript.
- Prefer Expo Router for screens.
- Keep UI simple, large, readable, and accessible.
- Important warnings must not rely on color only; include clear text and icon.
- Provide text-to-speech buttons for important medication and warning messages if time allows.

## AI rules

- AI scan endpoint returns candidates only.
- User must confirm a candidate before safety check.
- AI explanation endpoint may rewrite rule-based warnings in simple Vietnamese.
- Always keep rule-based fallback messages.
- Never let AI output final medical advice.

## Change style

- Make small, focused changes.
- Prefer clear names and explicit data flow.
- Do not introduce unnecessary abstractions.
- Do not rewrite unrelated files.
- When unsure, implement the smallest working version that matches the docs.
