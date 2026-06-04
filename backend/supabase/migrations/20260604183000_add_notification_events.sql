-- Migration: add_notification_events
-- Created at: 2026-06-04T11:30:00Z

create table if not exists notification_events (
  id uuid primary key default gen_random_uuid(),
  patient_profile_id uuid references profiles(id) on delete cascade,
  recipient_profile_id uuid not null references profiles(id) on delete cascade,
  event_type text not null,
  title text not null,
  body text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_events_status_check
    check (status in ('pending', 'sent', 'failed', 'cancelled'))
);

create index if not exists idx_notification_events_recipient_created_at
  on notification_events(recipient_profile_id, created_at desc);

create index if not exists idx_notification_events_patient_created_at
  on notification_events(patient_profile_id, created_at desc);

create index if not exists idx_notification_events_status_created_at
  on notification_events(status, created_at);
