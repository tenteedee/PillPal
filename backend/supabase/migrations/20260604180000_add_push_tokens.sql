-- Migration: add_push_tokens
-- Created at: 2026-06-04T11:00:00Z

create table if not exists push_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  expo_push_token text not null,
  device_id text,
  platform text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  constraint push_tokens_platform_check
    check (platform in ('ios', 'android', 'web'))
);

create unique index if not exists idx_push_tokens_profile_token
  on push_tokens(profile_id, expo_push_token);

create unique index if not exists idx_push_tokens_profile_device
  on push_tokens(profile_id, device_id)
  where device_id is not null;

create index if not exists idx_push_tokens_profile_active
  on push_tokens(profile_id, is_active);
