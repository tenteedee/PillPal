# 00 — Documentation Index

This document pack defines the MVP implementation direction for ** PillPal**.

## Product summary

PillPal is a medication safety assistant for users who may struggle with medication intake because of age, forgetfulness, visual impairment, chronic disease, or multiple daily medicines.

The main product flow is:

```txt
Scan or select medicine
→ Match with personal medication list / Vietnam medication dataset
→ Load health profile, schedule, and intake history
→ Run deterministic safety rules
→ Return allowed / warning / blocked
→ User confirms intake only when appropriate
→ Save intake history
```

## Docs

| File                                | Purpose                                                           |
| ----------------------------------- | ----------------------------------------------------------------- |
| `01_PROJECT_OVERVIEW.md`            | Product context, users, positioning, and demo goal.               |
| `02_FEATURE_SCOPE.md`               | Full feature list grouped into P0, P1, and P2.                    |
| `03_TECH_STACK.md`                  | Final stack for fast delivery.                                    |
| `04_ARCHITECTURE.md`                | Backend/mobile structure and data flow.                           |
| `05_DATABASE_DESIGN_DRAFT.md`       | Draft Supabase/Postgres schema. May change during implementation. |
| `06_SAFETY_RULES.md`                | Deterministic safety rules and statuses.                          |
| `07_API_CONTRACTS.md`               | Planned REST API contracts for the MVP.                           |
| `08_IMPLEMENTATION_TIMELINE.md`     | 3-day build timeline and task order.                              |
| `09_AI_GUIDELINES.md`               | AI scan/explanation guardrails.                                   |
| `10_UI_ACCESSIBILITY_GUIDELINES.md` | Accessibility and UX requirements.                                |
| `11_ENV_AND_DEPLOYMENT.md`          | Environment variables and deployment plan.                        |

## Most important constraints

- Ship a working MVP in 3 days.
- Use Express + TypeScript instead of Go because the team has only one Go developer.
- Use Supabase to avoid database deployment overhead.
- Use AI only as an assistive layer.
- Keep medical safety decision logic rule-based.
- Automated testing is not a deadline priority.
