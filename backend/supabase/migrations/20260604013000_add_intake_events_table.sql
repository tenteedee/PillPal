-- Migration: add_intake_events_table
-- Created at: 2026-06-03T18:30:00Z

create table if not exists intake_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  user_medication_id uuid not null references user_medications(id) on delete cascade,
  medication_schedule_id uuid references medication_schedules(id) on delete set null,
  scheduled_time text,
  dose_amount text,
  taken_at timestamptz not null default now(),
  status text not null default 'taken',
  confirmed_by text not null default 'user',
  safety_check_event_id uuid,
  warning_snapshot jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_intake_events_profile_taken_at
  on intake_events(profile_id, taken_at desc);

create index if not exists idx_intake_events_medication_taken_at
  on intake_events(user_medication_id, taken_at desc);

create index if not exists idx_intake_events_schedule_time_taken_at
  on intake_events(medication_schedule_id, scheduled_time, taken_at desc);
