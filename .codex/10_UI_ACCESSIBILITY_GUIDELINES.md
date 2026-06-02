# 10 — UI and Accessibility Guidelines

PillPal is designed for older adults, forgetful users, and users with low vision. The UI must be simple and forgiving.

## Design principles

1. Large text.
2. Large tap targets.
3. Clear primary action.
4. Low information density.
5. Warnings must use text and icon, not color only.
6. Important screens should support read-aloud.
7. Avoid complex medical language.
8. Make confirmation steps explicit.

## Main screens

### Onboarding / disclaimer

Must explain:

- App supports medication safety checking.
- App does not replace doctors/pharmacists.
- App does not diagnose or prescribe.
- User/caregiver must verify high-risk cases.

### Today plan

Must show:

- Time group.
- Medication name.
- Dose amount.
- Instruction.
- Status.
- Main button: "Kiểm tra trước khi uống".

### Safety result

Use these status labels:

```txt
allowed: Có thể uống theo lịch
warning: Cần chú ý trước khi uống
blocked: Không nên xác nhận uống lúc này
```

For each result, show:

- Big status heading.
- Reason list.
- Suggested next action.
- Read-aloud button.
- Confirm button only if allowed/warning.

### Scan result

Must show:

```txt
Tôi nghĩ đây có thể là: <medicine name>
Vui lòng xác nhận trước khi tiếp tục.
```

Actions:

- "Đúng, tiếp tục kiểm tra"
- "Không đúng, chọn thuốc thủ công"

## Accessibility mode

Suggested modes:

```txt
normal
elderly
low_vision
simple
```

For MVP, these can map to UI settings:

| Mode | Behavior |
| --- | --- |
| normal | Default font and layout. |
| elderly | Larger text and buttons. |
| low_vision | Largest text, high contrast, read-aloud visible. |
| simple | Hide secondary details and show one main action per screen. |

## Text-to-speech

Use Expo Speech if mobile app is Expo.

Read these contents:

- Medication name and dose.
- Safety result status.
- Warning/blocked reason.
- Suggested action.

Example text:

```txt
Kết quả: Không nên xác nhận uống lúc này. Lý do: Bạn vừa uống thuốc này gần đây. Vui lòng kiểm tra lại hoặc gọi người hỗ trợ.
```

## Copywriting style

Prefer:

```txt
Bạn vừa uống thuốc này gần đây.
```

Avoid:

```txt
Khoảng cách dược động học giữa hai lần hấp thu hoạt chất chưa đạt ngưỡng an toàn.
```

Prefer:

```txt
Vui lòng hỏi người hỗ trợ hoặc dược sĩ nếu bạn không chắc.
```

Avoid:

```txt
Bạn phải ngừng thuốc này ngay.
```

## Color and icon guidance

Even if using colors, always include text:

- Allowed: check icon + text.
- Warning: alert icon + text.
- Blocked: stop icon + text.

Do not rely only on green/yellow/red.

## Confirmation UX

For warning:

1. Show warning.
2. User must check an acknowledgement or press explicit button.
3. Then allow confirm intake.

For blocked:

- Do not show direct confirm intake button.
- Show actions:
  - "Chọn thuốc khác"
  - "Gọi người hỗ trợ"
  - "Xem lại lịch uống"
