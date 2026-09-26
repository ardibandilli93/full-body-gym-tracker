revoke all on public.workout_days from public, anon, authenticated;
grant select, insert, update, delete on public.workout_days to authenticated;
alter table public.workout_days enable row level security;
alter table public.workout_days add constraint workout_days_payload_check
  check (jsonb_typeof(exercises) = 'object' and octet_length(exercises::text) <= 65536);
alter table public.workout_days add constraint workout_days_date_check
  check (workout_date between date '1900-01-01' and date '2200-12-31');
