# 02 — Feature Scope

This file consolidates the feature list for the 3-day MVP and future phases.

## Priority definitions

- **P0**: Must-have for hackathon MVP.
- **P1**: Demo enhancement if P0 is stable.
- **P2**: After hackathon.

---

# P0 — MVP Core Features

## 1. Initial Setup & User Health Profile

Goal: create the user's initial health context.

| Task | Description |
| --- | --- |
| 1.1 Onboarding screen | Introduce PillPal and its purpose: medication pre-intake safety check. |
| 1.2 Medical disclaimer | Explain that the app does not replace doctors/pharmacists, diagnose, prescribe, or change dosage. |
| 1.3 Create user profile | Store basic information such as name and age group. |
| 1.4 Store health conditions | Store conditions such as diabetes, hypertension, cardiovascular disease, liver disease, kidney disease. |
| 1.5 Store allergies | Store medication allergies or ingredient allergies for safety checks. |
| 1.6 Store doctor notes | Store instructions such as "after meal", "do not increase dose", "at least 6 hours apart". |
| 1.7 Choose accessibility mode | Normal, elderly mode, low-vision mode, simplified mode. |
| 1.8 Store caregiver info | Name and phone number of caregiver/contact person. |
| 1.9 View health profile | Show saved conditions, allergies, doctor notes, caregiver. |
| 1.10 Update health profile | Edit profile when health data changes. |

## 2. Personal Medication Management

Goal: manage the medicines that the user is currently taking.

| Task | Description |
| --- | --- |
| 2.1 Medication list screen | Show active user medications. |
| 2.2 Add personal medication | Add a new medication. |
| 2.3 Search Vietnam medication dataset | Search by medication name, active ingredient, or dataset metadata. |
| 2.4 Show search results | Display matching dataset records. |
| 2.5 Match medication with dataset | Pre-fill name, ingredient, strength, and form from selected dataset item. |
| 2.6 Manual medication entry | Allow manual entry if not found in dataset. |
| 2.7 Save personal medication | Store name, ingredient, strength, form, usage note. |
| 2.8 Add usage note | Examples: before meal, after meal, when needed, as doctor instructed. |
| 2.9 Add medication image | Save image for recognition/demo. |
| 2.10 View medication detail | Show medication info. |
| 2.11 Update medication | Edit name, strength, notes, images. |
| 2.12 Stop medication | Mark as inactive; exclude from main schedule/safety flow. |
| 2.13 Delete medication | Delete if created by mistake. |
| 2.14 Show active medicines first | Main flows should prioritize active medicines. |

## 3. Medication Schedule & Daily Plan

Goal: define schedules and show today's medicine plan.

| Task | Description |
| --- | --- |
| 3.1 Create medication schedule | Select a personal medication and create schedule. |
| 3.2 Configure intake times | Example: 08:00, 12:00, 19:00. |
| 3.3 Configure dose amount | Example: 1 pill, 5ml, 1 sachet. |
| 3.4 Configure times per day | Number of doses per day. |
| 3.5 Configure minimum interval | Minimum time between two intakes. |
| 3.6 Add meal instruction | Before meal, after meal, during meal, no requirement. |
| 3.7 Save schedule | Persist schedule. |
| 3.8 Update schedule | Edit time, dose, frequency, note. |
| 3.9 Pause schedule | Temporarily pause medication schedule. |
| 3.10 Delete schedule | Delete wrong/unneeded schedule. |
| 3.11 Generate today's plan | Generate today's medicine list from active schedules. |
| 3.12 Today plan screen | Show medicines to take today. |
| 3.13 Group by time | Group scheduled doses by time. |
| 3.14 Dose status | Not yet, due, taken, missed. |
| 3.15 Show dose and note | Clear dose amount and instruction. |
| 3.16 Pre-intake check button | Start safety check from today's plan. |

## 4. Pre-Intake Safety Check

Goal: the most important core feature.

| Task | Description |
| --- | --- |
| 4.1 Select medication to check | From today's plan or personal medication list. |
| 4.2 Load health profile | Conditions, allergies, doctor notes. |
| 4.3 Load medication info | Name, ingredient, strength, active status. |
| 4.4 Load medication schedule | Times, dose, times per day, minimum interval. |
| 4.5 Load intake history | Last intake and today's count. |
| 4.6 Check active medication | Warn/block if stopped/inactive. |
| 4.7 Check if scheduled today | Warn if not in today's schedule. |
| 4.8 Check if it is due | Warn if too early or too far from scheduled time. |
| 4.9 Check last intake | Determine most recent intake. |
| 4.10 Check minimum interval | Block or warn if too soon. |
| 4.11 Check daily dose count | Block or warn if daily maximum reached. |
| 4.12 Check allergies | Compare medication/ingredient with saved allergies. |
| 4.13 Check missing critical data | Warn when schedule/profile/ingredient is missing. |
| 4.14 Aggregate safety result | Return allowed, warning, or blocked. |
| 4.15 Generate clear warning message | Short, simple Vietnamese explanation. |
| 4.16 Result screen | Show allowed/warning/blocked and reasons. |
| 4.17 Confirm if allowed | User may confirm intake if allowed. |
| 4.18 Explicit confirm if warning | User must acknowledge warning before confirm. |
| 4.19 Block confirm if blocked | Do not allow direct intake confirmation. |
| 4.20 Suggest next action | Ask caregiver/pharmacist/doctor when warning/blocked. |
| 4.21 Save safety check result | Save for history and demo. |

## 5. Intake Tracking & History

Goal: record and view medication intake history.

| Task | Description |
| --- | --- |
| 5.1 Confirm intake | User confirms after safety check. |
| 5.2 Save intake event | Store medication, time, dose, status, confirmer. |
| 5.3 Link with today's plan | Connect intake to the planned dose when possible. |
| 5.4 Update today status | Mark dose as taken. |
| 5.5 Prevent duplicate confirm | Avoid repeated confirmation for same dose/time window. |
| 5.6 Save warning snapshot | Store warning if user confirmed after warning. |
| 5.7 Save blocked attempts | Store blocked safety events for history. |
| 5.8 View daily history | Show taken, missed, warned, blocked events by day. |
| 5.9 Show warning/blocked history | Make risk events visible. |
| 5.10 Mark dose missed | Allow marking a dose as skipped/missed. |
| 5.11 Edit intake record | Optional for MVP; lower priority. |

## 6. Accessibility Mode

Goal: make the app usable by older adults, low-vision users, and forgetful users.

| Task | Description |
| --- | --- |
| 6.1 Toggle accessibility mode | Change display mode in profile/settings. |
| 6.2 Large text | Increase font size on key screens. |
| 6.3 Large buttons | Big, clear primary actions. |
| 6.4 Simplified interface | Reduce information density. |
| 6.5 Warnings not color-only | Use text/icon in addition to color. |
| 6.6 Simple Vietnamese warning copy | Avoid difficult medical terms. |
| 6.7 Read important content aloud | Read medication name, time, warning. |
| 6.8 Read safety warning aloud | Especially warning/blocked. |
| 6.9 Repeat instruction button | "Read again" button. |

---

# P1 — Demo Enhancement Features

## 7. Mock or AI Medication Scan

Goal: demo AI-like experience.

For the 3-day MVP, implement either real OpenAI Vision or a mock fallback. The scan must only produce candidates and must not confirm intake.

| Task | Description |
| --- | --- |
| 7.1 Upload/take medication photo | Entry point: "Scan medicine". |
| 7.2 Upload or capture image | User provides packaging/blister image. |
| 7.3 Mock image-to-medication mapping | Example: Metformin image returns Metformin 500mg. |
| 7.4 AI returns candidates | Suggested medication with confidence. |
| 7.5 Show suggested medication | "This may be Metformin 500mg." |
| 7.6 User confirms or rejects | Required before continuing. |
| 7.7 Confirmed candidate starts safety check | Candidate goes into pre-intake check. |
| 7.8 Rejected candidate goes to manual selection | User selects medicine manually. |
| 7.9 Do not auto-save intake | Scan only selects medicine. |

## 8. Basic Voice Support

Goal: accessibility improvement.

| Task | Description |
| --- | --- |
| 8.1 Text-to-speech function | Use Expo Speech/browser speech. |
| 8.2 Read medication name/dose | Read today's medication info. |
| 8.3 Read warnings | Read warning/blocked result. |
| 8.4 Repeat instructions | Allow replaying content. |
| 8.5 Add "Read again" button | On important screens. |

## 9. Basic Caregiver Support

Goal: support users in high-risk situations.

| Task | Description |
| --- | --- |
| 9.1 Store caregiver info | Name, phone, relationship. |
| 9.2 Show call caregiver button | On profile/warning screens. |
| 9.3 Suggest contact when critical | When safety result is blocked/critical. |
| 9.4 Show caregiver instruction | "Please ask a caregiver to check this medicine." |

---

# P2 — After Hackathon

## 10. Real AI Vision / OCR

| Task | Description |
| --- | --- |
| 10.1 Real OCR | Read text from packaging/blister. |
| 10.2 Real vision model | Recognize medication from image, text, color, packaging. |
| 10.3 Extract name/strength | Extract medication name and dose. |
| 10.4 Match Vietnam dataset | Match OCR/vision result to dataset. |
| 10.5 Return top candidates | Show confidence values. |
| 10.6 Low confidence handling | Ask user to select manually or contact caregiver. |

## 11. AI Explanation

| Task | Description |
| --- | --- |
| 11.1 Normalize AI input | Send only known data: medicine, schedule, warning, profile. |
| 11.2 Natural language warning | Rewrite rule result in simple Vietnamese. |
| 11.3 Summarize medication info | Based on available data only. |
| 11.4 Medical guardrails | No diagnosis, prescription, dose change, stop-medication advice. |
| 11.5 Rule-based fallback | Use fixed messages if AI fails. |

## 12. Prescription Upload

| Task | Description |
| --- | --- |
| 12.1 Upload prescription image | User uploads or captures prescription. |
| 12.2 Extract medication names | OCR/AI reads medicine list. |
| 12.3 Extract dose/schedule | Extract dose and timing if possible. |
| 12.4 Create draft medication/schedule | Draft for user/caregiver review. |
| 12.5 User confirms before saving | Never auto-save prescription extraction. |

## 13. Advanced Drug Safety

| Task | Description |
| --- | --- |
| 13.1 Drug interaction check | Detect interactions between medicines. |
| 13.2 Duplicate ingredient check | Warn about same active ingredient. |
| 13.3 Contraindication check | Check medicine against health conditions with trusted data. |
| 13.4 Show data source | Advanced warning must show source. |
| 13.5 Severity classification | Minor/moderate/severe. |

## 14. Advanced Caregiver Notifications

| Task | Description |
| --- | --- |
| 14.1 Missed dose notification | Notify caregiver. |
| 14.2 Critical warning notification | Notify caregiver for blocked/critical. |
| 14.3 Daily history report | Daily summary. |
| 14.4 Caregiver history view | Caregiver dashboard. |

## 15. Barcode / QR Scan

| Task | Description |
| --- | --- |
| 15.1 Scan barcode/QR | Scan product code. |
| 15.2 Match code with dataset | Match against Vietnam medication dataset. |
| 15.3 Show product info | Name, ingredient, form, manufacturer. |
| 15.4 Handle unknown code | Search by name or manual entry. |
