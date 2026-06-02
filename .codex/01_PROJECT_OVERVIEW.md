# 01 — Project Overview

## Working names

- Product name: **PillPal**

Use **PillPal** in UI copy unless the team decides to rename later.

## One-line product statement

**PillPal helps users verify the right medicine, right time, and right dose before taking medication.**

## Problem

For many people, taking medication seems simple. For older adults, visually impaired users, forgetful users, users with mild cognitive difficulties, or users taking multiple medications every day, the moment before taking medicine can be risky.

Common risks:

- Picking the wrong blister pack or bottle.
- Taking a dose again too soon.
- Forgetting whether a dose was already taken.
- Not being able to read small text on packaging.
- Taking medicine that conflicts with saved allergies or health conditions.
- Using medicines purchased by family members or from online/offline sources without enough context.

The problem is not only: **"Did I remember to take medicine?"**

The deeper question is:

```txt
Should I take this medicine right now?
```

## Market positioning

Existing medication reminder apps usually focus on reminders and history tracking. Pharmacy apps focus on product search, purchase, and consultation. Smart pill dispensers focus on hardware-assisted dose dispensing.

PillPal focuses on the moment where the user is already holding a medicine and needs a safety check before intake.

## Core flow

```txt
1. User scans a medicine using camera or selects it manually.
2. System matches it with the user medication list and/or medication dataset.
3. System loads health profile, medication schedule, and intake history.
4. System runs rule-based safety checks.
5. System returns one of: allowed, warning, blocked.
6. If allowed or warning, user can confirm intake depending on risk level.
7. Intake event and safety check result are saved for history/demo.
```

## Target users

Primary users:

1. Older adults with chronic diseases such as diabetes, hypertension, or cardiovascular diseases.
2. Users who are forgetful or have mild cognitive difficulties.
3. Users with visual impairment or poor eyesight.
4. Users in rural or underserved areas with limited access to modern healthcare support.

Secondary users:

- Caregivers
- Children/family members
- Pharmacists
- Healthcare workers

## What the app does not do

PillPal must not:

- Diagnose disease.
- Prescribe medicine.
- Change dose.
- Recommend stopping medicine.
- Replace a doctor, pharmacist, or caregiver.
- Automatically confirm that a user has taken medicine.

## MVP success criteria

The MVP is successful if the team can demo:

1. User creates a health profile with conditions/allergies.
2. User adds medicines and schedules.
3. User sees today's medicine plan.
4. User selects/scans a medicine.
5. Backend runs safety rules.
6. App displays allowed/warning/blocked with clear Vietnamese explanation.
7. User confirms intake when appropriate.
8. Intake history is saved.
9. App has basic accessibility support such as large buttons and read-aloud warning.
