-- Migration: add_medication_schedule_table
-- Created at: 2026-06-03T17:57:54Z

-- Write your SQL below
create table if not exists medication_schedules (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  user_medication_id uuid not null references user_medications(id) on delete cascade,
  dose_amount text not null,
  times text[] not null default '{}',
  times_per_day integer not null default 1,
  min_interval_hours integer,
  instruction text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_medication_schedules_profile_id
  on medication_schedules(profile_id);

create index if not exists idx_medication_schedules_profile_active
  on medication_schedules(profile_id, is_active);

create index if not exists idx_medication_schedules_user_medication_id
  on medication_schedules(user_medication_id);
