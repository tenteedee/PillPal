-- Migration: add_detailed_columns_to_medication_catalogue
-- Created at: 2026-06-02T07:17:54Z

-- Write your SQL below
alter table medication_catalogs
  add column if not exists ingredients jsonb not null default '[]'::jsonb,
  add column if not exists route text,
  add column if not exists description text,
  add column if not exists common_uses jsonb not null default '[]'::jsonb,
  add column if not exists warnings jsonb not null default '[]'::jsonb,
  add column if not exists contraindications jsonb not null default '[]'::jsonb,
  add column if not exists side_effects jsonb not null default '[]'::jsonb,
  add column if not exists interaction_notes jsonb not null default '[]'::jsonb;

create index if not exists idx_medication_catalogs_ingredients_gin
on medication_catalogs using gin (ingredients);

create index if not exists idx_medication_catalogs_common_uses_gin
on medication_catalogs using gin (common_uses);
