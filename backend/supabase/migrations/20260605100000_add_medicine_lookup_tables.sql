-- Migration: add_medicine_lookup_tables
-- Created at: 2026-06-05T10:00:00Z

create table if not exists medicine_data_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_url text not null unique,
  source_type text not null,
  required_worker_count integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint medicine_data_sources_source_type_check
    check (source_type in ('distributor', 'administration', 'general_web')),
  constraint medicine_data_sources_required_worker_count_check
    check (required_worker_count >= 1)
);

create table if not exists medicine_lookup_attempts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  scan_attempt_id uuid references scan_attempts(id) on delete set null,
  static_id uuid references statics(id) on delete set null,
  user_medication_id uuid references user_medications(id) on delete set null,
  status text not null default 'pending',
  query_name text,
  query_active_ingredient text,
  query_manufacturer text,
  extracted_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint medicine_lookup_attempts_status_check
    check (status in ('pending', 'in_progress', 'needs_admin_review', 'verified', 'rejected', 'failed')),
  constraint medicine_lookup_attempts_scan_attempt_unique
    unique (scan_attempt_id)
);

create table if not exists medicine_lookup_evidence (
  id uuid primary key default gen_random_uuid(),
  lookup_attempt_id uuid not null references medicine_lookup_attempts(id) on delete cascade,
  medicine_data_source_id uuid references medicine_data_sources(id) on delete set null,
  source_url text,
  source_title text,
  evidence_type text not null,
  extracted_data jsonb not null default '{}'::jsonb,
  confidence numeric(4, 3),
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint medicine_lookup_evidence_type_check
    check (evidence_type in ('distributor_match', 'web_match', 'administration_authorization', 'manufacturer_match', 'image_match')),
  constraint medicine_lookup_evidence_confidence_check
    check (confidence is null or (confidence >= 0 and confidence <= 1))
);

create table if not exists external_medication_candidates (
  id uuid primary key default gen_random_uuid(),
  lookup_attempt_id uuid not null references medicine_lookup_attempts(id) on delete cascade,
  name text not null,
  active_ingredient text,
  strength text,
  dosage_form text,
  manufacturer text,
  country text,
  authorization_status text not null default 'unknown',
  authorization_source_url text,
  verification_status text not null default 'pending_evidence',
  structured_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint external_medication_candidates_authorization_status_check
    check (authorization_status in ('unknown', 'pending', 'authorized', 'not_authorized', 'unclear')),
  constraint external_medication_candidates_verification_status_check
    check (verification_status in ('pending_evidence', 'needs_admin_review', 'externally_verified', 'rejected'))
);

create index if not exists idx_medicine_data_sources_active_type
  on medicine_data_sources(is_active, source_type);

create index if not exists idx_medicine_lookup_attempts_profile_created_at
  on medicine_lookup_attempts(profile_id, created_at desc);

create index if not exists idx_medicine_lookup_attempts_profile_status
  on medicine_lookup_attempts(profile_id, status);

create index if not exists idx_medicine_lookup_attempts_scan_attempt_id
  on medicine_lookup_attempts(scan_attempt_id);

create index if not exists idx_medicine_lookup_evidence_attempt_created_at
  on medicine_lookup_evidence(lookup_attempt_id, created_at desc);

create index if not exists idx_external_medication_candidates_attempt_created_at
  on external_medication_candidates(lookup_attempt_id, created_at desc);

insert into medicine_data_sources (
  name,
  base_url,
  source_type,
  required_worker_count
)
values
  ('Nhà thuốc Long Châu', 'https://nhathuoclongchau.com.vn/', 'distributor', 1),
  ('Pharmacity', 'https://www.pharmacity.vn/', 'distributor', 1),
  ('Nhà thuốc An Khang', 'https://www.nhathuocankhang.com/', 'distributor', 1),
  ('Cục Quản lý Dược Việt Nam', 'https://dichvucong.dav.gov.vn/congbothuoc', 'administration', 1),
  ('Reputable web search', 'https://www.google.com/search', 'general_web', 3)
on conflict (base_url) do update
set
  name = excluded.name,
  source_type = excluded.source_type,
  required_worker_count = excluded.required_worker_count,
  is_active = true,
  updated_at = now();
