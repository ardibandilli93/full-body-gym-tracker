-- Run in the SQL editor of the Supabase project used by this app.
create table if not exists public.workout_days (
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_date date not null,
  session text not null default '' check (session in ('', 'A', 'B', 'C')),
  exercises jsonb not null default '{}'::jsonb constraint workout_days_payload_check check (jsonb_typeof(exercises) = 'object' and octet_length(exercises::text) <= 65536),
  updated_at timestamptz not null default now(),
  primary key (user_id, workout_date),
  constraint workout_days_date_check check (workout_date between date '1900-01-01' and date '2200-12-31')
);

alter table public.workout_days enable row level security;

revoke all on public.workout_days from public, anon, authenticated;
grant select, insert, update, delete on public.workout_days to authenticated;

create policy "Users read their own workout days"
  on public.workout_days for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users create their own workout days"
  on public.workout_days for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users update their own workout days"
  on public.workout_days for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users delete their own workout days"
  on public.workout_days for delete to authenticated
  using ((select auth.uid()) = user_id);
