-- Migration: add_scan_attempts_table
-- Created at: 2026-06-04T08:00:00Z

create table if not exists scan_attempts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  static_id uuid references statics(id) on delete set null,
  image_url text,
  extracted_data jsonb not null default '{}'::jsonb,
  ai_result jsonb not null default '{}'::jsonb,
  candidates jsonb not null default '[]'::jsonb,
  confirmed_user_medication_id uuid references user_medications(id) on delete set null,
  status text not null default 'pending_confirmation',
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists idx_scan_attempts_profile_created_at
  on scan_attempts(profile_id, created_at desc);

create index if not exists idx_scan_attempts_static_id
  on scan_attempts(static_id);
