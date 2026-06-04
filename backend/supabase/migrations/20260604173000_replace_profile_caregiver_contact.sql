-- Migration: replace_profile_caregiver_contact
-- Created at: 2026-06-04T10:30:00Z

alter table profiles
  add column if not exists contact_phone_number text;

update profiles
set contact_phone_number = caregiver_phone
where contact_phone_number is null
  and caregiver_phone is not null;

alter table profiles
  drop column if exists caregiver_name,
  drop column if exists caregiver_phone;
