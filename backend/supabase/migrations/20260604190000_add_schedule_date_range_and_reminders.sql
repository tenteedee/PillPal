-- Migration: add_schedule_date_range_and_reminders
-- Created at: 2026-06-04T12:00:00Z

alter table medication_schedules
  add column if not exists start_date date not null default current_date,
  add column if not exists end_date date not null default current_date;

alter table medication_schedules
  add constraint medication_schedules_date_range_check
  check (end_date >= start_date);

create table if not exists medication_schedule_reminder_deliveries (
  id uuid primary key default gen_random_uuid(),
  medication_schedule_id uuid not null references medication_schedules(id) on delete cascade,
  scheduled_date date not null,
  scheduled_time text not null,
  recipient_profile_id uuid not null references profiles(id) on delete cascade,
  notification_event_id uuid references notification_events(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint medication_schedule_reminder_deliveries_unique
    unique (medication_schedule_id, scheduled_date, scheduled_time, recipient_profile_id)
);

create index if not exists idx_medication_schedule_reminder_deliveries_date
  on medication_schedule_reminder_deliveries(scheduled_date, scheduled_time);
