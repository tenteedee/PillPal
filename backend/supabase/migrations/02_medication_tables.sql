create table if not exists medication_catalogs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active_ingredient text,
  strength text,
  dosage_form text,
  manufacturer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_medications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  catalog_id uuid references medication_catalogs(id) on delete set null,
  name text not null,
  active_ingredient text,
  strength text,
  dosage_form text,
  note text,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
