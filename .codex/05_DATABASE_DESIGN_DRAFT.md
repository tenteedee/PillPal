# 05 — Database Design Draft

> Important: this database design is **draft / dự tính** and may change during implementation.
>
> The goal is to ship the MVP quickly while keeping the schema maintainable enough for post-hackathon extension.

## Platform

Use **Supabase Postgres**.

Supabase Auth may provide `auth.users`. Application profile data should be stored in `profiles`.

## MVP simplification

To ship in 3 days, some fields use `jsonb` instead of fully normalized tables. After the hackathon, these can be normalized.

Examples:

- `profiles.conditions jsonb`
- `profiles.allergies jsonb`
- `medication_schedules.times text[]`
- `safety_check_events.reasons jsonb`

## ERD overview

```txt
auth.users
   |
   v
profiles
   |
   +-- user_medications
   |       |
   |       +-- medication_schedules
   |       +-- intake_events
   |       +-- safety_check_events
   |
   +-- scan_attempts

medication_catalogs
   |
   +-- user_medications.catalog_id nullable
```

## Suggested SQL draft

```sql
create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  full_name text not null,
  age_group text,
  accessibility_mode text not null default 'normal',
  conditions jsonb not null default '[]'::jsonb,
  allergies jsonb not null default '[]'::jsonb,
  doctor_note text,
  caregiver_name text,
  caregiver_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.medication_catalogs (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  active_ingredient text,
  strength text,
  dosage_form text,
  manufacturer text,
  registration_number text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_medications (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  catalog_id uuid references public.medication_catalogs(id) on delete set null,
  name text not null,
  active_ingredient text,
  strength text,
  dosage_form text,
  note text,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.medication_schedules (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  user_medication_id uuid not null references public.user_medications(id) on delete cascade,
  dose_amount text not null,
  times text[] not null default '{}',
  times_per_day integer not null default 1,
  min_interval_hours integer,
  instruction text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.intake_events (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  user_medication_id uuid not null references public.user_medications(id) on delete cascade,
  medication_schedule_id uuid references public.medication_schedules(id) on delete set null,
  scheduled_time text,
  dose_amount text,
  taken_at timestamptz not null default now(),
  status text not null default 'taken',
  confirmed_by text not null default 'user',
  safety_check_event_id uuid,
  warning_snapshot jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.safety_check_events (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  user_medication_id uuid not null references public.user_medications(id) on delete cascade,
  medication_schedule_id uuid references public.medication_schedules(id) on delete set null,
  result text not null,
  can_confirm_intake boolean not null default false,
  reasons jsonb not null default '[]'::jsonb,
  suggested_action text,
  checked_at timestamptz not null default now(),
  source text not null default 'manual',
  metadata jsonb not null default '{}'::jsonb
);

alter table public.intake_events
  add constraint intake_events_safety_check_event_fk
  foreign key (safety_check_event_id)
  references public.safety_check_events(id)
  on delete set null;

create table if not exists public.scan_attempts (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  image_url text,
  ai_result jsonb not null default '{}'::jsonb,
  confirmed_user_medication_id uuid references public.user_medications(id) on delete set null,
  status text not null default 'pending_confirmation',
  created_at timestamptz not null default now()
);
```

## Recommended indexes

```sql
create index if not exists idx_profiles_user_id on public.profiles(user_id);
create index if not exists idx_user_medications_profile_id on public.user_medications(profile_id);
create index if not exists idx_user_medications_catalog_id on public.user_medications(catalog_id);
create index if not exists idx_medication_schedules_profile_id on public.medication_schedules(profile_id);
create index if not exists idx_medication_schedules_user_medication_id on public.medication_schedules(user_medication_id);
create index if not exists idx_intake_events_profile_taken_at on public.intake_events(profile_id, taken_at desc);
create index if not exists idx_intake_events_medication_taken_at on public.intake_events(user_medication_id, taken_at desc);
create index if not exists idx_safety_check_events_profile_checked_at on public.safety_check_events(profile_id, checked_at desc);
create index if not exists idx_scan_attempts_profile_created_at on public.scan_attempts(profile_id, created_at desc);
```

## Field notes

### `profiles.conditions`

Example:

```json
[
  { "name": "diabetes", "label": "Tiểu đường" },
  { "name": "hypertension", "label": "Cao huyết áp" }
]
```

### `profiles.allergies`

Example:

```json
[
  { "type": "ingredient", "name": "paracetamol", "label": "Paracetamol" },
  { "type": "medication", "name": "amoxicillin", "label": "Amoxicillin" }
]
```

### `medication_schedules.times`

Example:

```json
["08:00", "20:00"]
```

For MVP, all times can be treated in local timezone. If the product continues after hackathon, add timezone support.

### `safety_check_events.result`

Allowed values:

```txt
allowed
warning
blocked
```

### `intake_events.status`

Allowed values:

```txt
taken
missed
skipped
blocked_attempt
```

## RLS note

For fastest hackathon implementation, the backend can use Supabase service role key and enforce ownership in backend queries.

After hackathon, implement Supabase Row Level Security policies properly.

Never expose `SUPABASE_SERVICE_ROLE_KEY` to mobile.
