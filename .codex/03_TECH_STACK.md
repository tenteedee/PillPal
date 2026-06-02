# 03 — Final Tech Stack

This stack is optimized for shipping a hackathon MVP in roughly 3 days.

## Chosen stack

```txt
Mobile app:
- Expo React Native
- TypeScript
- Expo Router
- TanStack Query
- Zustand
- React Hook Form
- Zod
- expo-camera
- expo-speech
- expo-notifications if time allows

Backend:
- Node.js
- Express
- TypeScript
- Zod
- Supabase JS SDK
- OpenAI SDK

Database/Auth/Storage:
- Supabase Postgres
- Supabase Auth
- Supabase Storage

AI:
- OpenAI Vision for medication image candidate extraction
- OpenAI Structured Outputs / JSON schema-style response for strict JSON result
- Rule-based safety engine for allowed/warning/blocked decision

Deployment:
- Mobile demo: Expo Go or EAS build if time allows
- Backend: Render / Railway / Fly.io
- Database/Auth/Storage: Supabase hosted project
```

## Why Express instead of Go

The team has only one Go developer, and the deadline is extremely short. Express + TypeScript allows more team members to help across frontend and backend, reduces implementation bottleneck, and is faster for AI API integration.

Use Go only after the hackathon if the team wants a stronger long-term backend rewrite.

## Why Supabase

Supabase is chosen to avoid spending time deploying and managing a database. It provides:

- Hosted Postgres
- Auth
- Storage
- SQL editor
- Simple dashboard
- Row Level Security if needed later

The data model is relational, so Supabase/Postgres is a better fit than MongoDB for this MVP.

## Why not MongoDB for this MVP

MongoDB can work, but this app has many natural relations:

- Profile → medications
- Medication → schedule
- Schedule → schedule times
- Schedule/time → daily plan item
- Medication/profile → intake events
- Safety check → medication/profile/intake history

Postgres is easier for this structure.

## AI stack decision

Use AI for:

1. Image-to-medication candidate extraction.
2. User-friendly explanation of existing rule-based warnings.

Do not use AI for:

1. Final allowed/warning/blocked decision.
2. Medical diagnosis.
3. Prescription recommendation.
4. Dose change.
5. Advice to stop medication.

## Package suggestions

### Backend

```bash
npm install express cors helmet dotenv zod @supabase/supabase-js openai multer uuid dayjs
npm install -D typescript tsx @types/node @types/express @types/cors @types/multer
```

Optional:

```bash
npm install pino pino-http
```

### Mobile

```bash
npx create-expo-app mobile --template
npm install expo-router @tanstack/react-query zustand react-hook-form zod
npx expo install expo-camera expo-speech expo-notifications expo-image-picker
```

Optional UI:

```bash
npm install nativewind
```

## Recommended scripts

### Backend `package.json`

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "dev:debug": "node --inspect=9229 --import tsx src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "typecheck": "tsc --noEmit"
  }
}
```

### Mobile `package.json`

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "typecheck": "tsc --noEmit"
  }
}
```
