-- Migration: add_safety_check_events
-- Created at: 2026-06-04T13:00:00Z

create table if not exists safety_check_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  user_medication_id uuid not null references user_medications(id) on delete cascade,
  medication_schedule_id uuid references medication_schedules(id) on delete set null,
  scheduled_time text,
  result text not null,
  can_confirm_intake boolean not null default false,
  reasons jsonb not null default '[]'::jsonb,
  suggested_action text,
  checked_at timestamptz not null default now(),
  source text not null default 'manual',
  metadata jsonb not null default '{}'::jsonb,
  constraint safety_check_events_result_check
    check (result in ('allowed', 'warning', 'blocked')),
  constraint safety_check_events_source_check
    check (source in ('manual', 'today_plan', 'scan'))
);

alter table intake_events
  add constraint intake_events_safety_check_event_fk
  foreign key (safety_check_event_id)
  references safety_check_events(id)
  on delete set null;

create index if not exists idx_safety_check_events_profile_checked_at
  on safety_check_events(profile_id, checked_at desc);

create index if not exists idx_safety_check_events_medication_checked_at
  on safety_check_events(user_medication_id, checked_at desc);
