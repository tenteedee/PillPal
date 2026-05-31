create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  age_group text,
  accessibility_mode text not null default 'normal',
  doctor_note text,
  caregiver_name text,
  caregiver_phone text,
  conditions jsonb not null default '[]'::jsonb,
  allergies jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_user_id on profiles(user_id);
