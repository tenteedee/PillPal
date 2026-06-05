-- Migration: add_medicine_lookups
-- Created at: 2026-06-05T09:30:00Z

create table if not exists medicine_lookups (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  scan_attempt_id uuid references scan_attempts(id) on delete set null,
  static_id uuid references statics(id) on delete set null,
  image_url text,
  status text not null default 'pending',
  query text,
  extracted_data jsonb not null default '{}'::jsonb,
  evidence jsonb,
  external_candidates jsonb not null default '[]'::jsonb,
  user_medication_id uuid references user_medications(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint medicine_lookups_status_check
    check (status in ('pending', 'verified', 'failed', 'saved'))
);

create index if not exists idx_medicine_lookups_profile_created_at
  on medicine_lookups(profile_id, created_at desc);

create index if not exists idx_medicine_lookups_scan_attempt_id
  on medicine_lookups(scan_attempt_id);

create index if not exists idx_medicine_lookups_user_medication_id
  on medicine_lookups(user_medication_id);

create unique index if not exists idx_medicine_lookups_unique_user_medication
  on medicine_lookups(user_medication_id)
  where user_medication_id is not null;
