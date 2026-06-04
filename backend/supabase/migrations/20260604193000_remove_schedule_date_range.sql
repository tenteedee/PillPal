-- Migration: remove_schedule_date_range
-- Created at: 2026-06-04T12:30:00Z

alter table medication_schedules
  drop constraint if exists medication_schedules_date_range_check;

alter table medication_schedules
  drop column if exists start_date,
  drop column if exists end_date;
