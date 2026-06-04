-- Migration: add_caregiver_patient_links
-- Created at: 2026-06-04T10:00:00Z

create table if not exists caregiver_patient_links (
  id uuid primary key default gen_random_uuid(),
  patient_profile_id uuid not null references profiles(id) on delete cascade,
  caregiver_profile_id uuid not null references profiles(id) on delete cascade,
  relationship text,
  status text not null default 'pending',
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  revoked_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint caregiver_patient_links_distinct_profiles
    check (patient_profile_id <> caregiver_profile_id),
  constraint caregiver_patient_links_status_check
    check (status in ('pending', 'accepted', 'revoked', 'declined'))
);

create unique index if not exists idx_caregiver_patient_links_unique_active
  on caregiver_patient_links(patient_profile_id, caregiver_profile_id)
  where status in ('pending', 'accepted');

create index if not exists idx_caregiver_patient_links_patient_status
  on caregiver_patient_links(patient_profile_id, status);

create index if not exists idx_caregiver_patient_links_caregiver_status
  on caregiver_patient_links(caregiver_profile_id, status);
