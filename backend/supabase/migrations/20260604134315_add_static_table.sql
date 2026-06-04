-- Migration: add_static_table
-- Created at: 2026-06-04T06:43:15Z

create table if not exists statics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  url text not null,
  storage_bucket text not null,
  storage_path text not null,
  file_size bigint not null,
  file_type text not null,
  purpose text not null default 'medication_image',
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists idx_statics_user_id
  on statics(user_id);

create index if not exists idx_statics_purpose_created_at
  on statics(purpose, created_at desc);
