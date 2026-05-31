# Supabase SQL Migration Workflow

This project stores SQL migrations in:

- `backend/supabase/migrations/*.sql`

Migrations are applied in filename order by `supabase db push`.

## Prerequisites

1. Supabase CLI installed.
2. `backend/.env` includes:

```env
SUPABASE_DB_URL=postgresql://postgres.<project-ref>:<password>@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
```

## Commands

Create a new migration file:

```bash
cd backend
make migration-new name=<migration_name>
```

List migration files:

```bash
cd backend
make migration-list
```

Apply pending migrations to your remote Supabase database:

```bash
cd backend
make migration-up
```

## Initial schema

If you already prepared an initialized SQL command, paste it into a migration file created by `migration-new`, then run `migration-up`.

Example:

1. `make migration-new name=init_schema`
2. Paste your full init SQL into the generated file in `supabase/migrations/`.
3. `make migration-up`

## Notes

- Keep one concern per migration when possible.
- Never edit an already-applied migration in shared environments; add a new migration instead.
