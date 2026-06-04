# 11 — Environment and Deployment

## Backend environment variables

Create `backend/.env.example`:

```env
NODE_ENV=development
PORT=4000

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=medication-images

OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4.1-mini
EXPO_ACCESS_TOKEN=

APP_TIMEZONE=Asia/Ho_Chi_Minh
ENABLE_MOCK_AI_SCAN=true
ENABLE_SCHEDULE_REMINDER_JOB=true
SCHEDULE_REMINDER_INTERVAL_MINUTES=30
```

Important:

- Never expose `SUPABASE_SERVICE_ROLE_KEY` in mobile.
- Mobile can use anon key only if needed.
- Prefer all database writes through backend for MVP consistency.

## Mobile environment variables

Create `mobile/.env.example`:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

For physical phone testing with Expo Go, replace localhost with LAN IP:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:4000/api/v1
```

## Local development commands

Backend:

```bash
cd backend
npm install
npm run dev
```

Mobile:

```bash
cd mobile
npm install
npm run start
```

## Debugging

Use `.vscode/launch.json` in this documentation pack.

Supported launch targets:

- Backend: Debug Express API
- Mobile: Expo Start
- Mobile: Expo Web
- Compound: Backend + Mobile

## Deployment recommendation

Fastest setup:

```txt
Database/Auth/Storage: Supabase hosted project
Backend: Render or Railway
Mobile demo: Expo Go
```

## Supabase setup checklist

1. Create Supabase project.
2. Run SQL schema from `docs/05_DATABASE_DESIGN_DRAFT.md`.
3. Create Storage bucket: `medication-images`.
4. Add sample medication catalog rows.
5. Copy project URL and keys to env files.
6. Keep service role key backend-only.

## Backend deployment checklist

1. Push backend to GitHub/GitLab.
2. Create Render/Railway service.
3. Set root directory to `backend` if monorepo.
4. Build command:

```bash
npm install && npm run build
```

5. Start command:

```bash
npm run start
```

6. Set env variables.
7. Verify health endpoint.

## Suggested health endpoint

```txt
GET /api/v1/health
```

Response:

```json
{
  "data": {
    "status": "ok"
  }
}
```

## Demo fallback plan

If deployment fails:

- Run backend locally.
- Use Expo Go on same Wi-Fi.
- Set API base URL to local LAN IP.
- Use mock AI scan if OpenAI fails.

If OpenAI fails:

- Set `ENABLE_MOCK_AI_SCAN=true`.
- Use prepared demo images/names.

If Supabase Auth slows down implementation:

- Temporarily use a demo profile id from env.
- Keep API contracts ready for auth.
- Add real auth after demo.
