-- Additive mobile schema for the offline-first Expo application.
create table if not exists public.mobile_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_name text not null check (char_length(preferred_name) between 1 and 80),
  gender text not null check (gender in ('male', 'female', 'other')),
  age smallint not null check (age between 16 and 120),
  unit_system text not null check (unit_system in ('metric', 'imperial')),
  height_cm numeric(5, 1) not null check (height_cm between 100 and 250),
  current_weight_kg numeric(6, 2) not null check (current_weight_kg between 25 and 400),
  goal_weight_kg numeric(6, 2) not null check (goal_weight_kg between 25 and 400),
  onboarding_complete boolean not null default false,
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 65536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.routine_plans (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null check (char_length(id) between 1 and 128),
  name text not null check (char_length(name) between 1 and 120),
  days_per_week smallint not null check (days_per_week between 1 and 7),
  is_active boolean not null default true,
  revision bigint not null default 1 check (revision > 0),
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 131072),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists routine_plans_user_active_updated_idx
  on public.routine_plans (user_id, is_active, updated_at desc);

create table if not exists public.mobile_workout_sessions (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null check (char_length(id) between 1 and 128),
  local_date date not null check (local_date between date '1900-01-01' and date '2200-12-31'),
  plan_day_id text not null check (char_length(plan_day_id) between 1 and 128),
  status text not null check (status in ('in_progress', 'complete')),
  calories_burned numeric(8, 2) check (calories_burned is null or calories_burned between 0 and 100000),
  revision bigint not null default 1 check (revision > 0),
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 524288),
  started_at timestamptz not null,
  finished_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  check (status = 'in_progress' or finished_at is not null)
);

create index if not exists mobile_sessions_user_started_idx
  on public.mobile_workout_sessions (user_id, started_at desc);
create index if not exists mobile_sessions_user_day_started_idx
  on public.mobile_workout_sessions (user_id, plan_day_id, started_at desc);
create index if not exists mobile_sessions_user_status_updated_idx
  on public.mobile_workout_sessions (user_id, status, updated_at desc);

alter table public.mobile_profiles enable row level security;
alter table public.routine_plans enable row level security;
alter table public.mobile_workout_sessions enable row level security;

revoke all on public.mobile_profiles, public.routine_plans, public.mobile_workout_sessions from public, anon, authenticated;
grant select, insert, update, delete on public.mobile_profiles, public.routine_plans, public.mobile_workout_sessions to authenticated;

drop policy if exists "Users read their mobile profile" on public.mobile_profiles;
create policy "Users read their mobile profile" on public.mobile_profiles
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users create their mobile profile" on public.mobile_profiles;
create policy "Users create their mobile profile" on public.mobile_profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users update their mobile profile" on public.mobile_profiles;
create policy "Users update their mobile profile" on public.mobile_profiles
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users delete their mobile profile" on public.mobile_profiles;
create policy "Users delete their mobile profile" on public.mobile_profiles
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users read their routine plans" on public.routine_plans;
create policy "Users read their routine plans" on public.routine_plans
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users create their routine plans" on public.routine_plans;
create policy "Users create their routine plans" on public.routine_plans
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users update their routine plans" on public.routine_plans;
create policy "Users update their routine plans" on public.routine_plans
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users delete their routine plans" on public.routine_plans;
create policy "Users delete their routine plans" on public.routine_plans
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users read their mobile workouts" on public.mobile_workout_sessions;
create policy "Users read their mobile workouts" on public.mobile_workout_sessions
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users create their mobile workouts" on public.mobile_workout_sessions;
create policy "Users create their mobile workouts" on public.mobile_workout_sessions
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users update their mobile workouts" on public.mobile_workout_sessions;
create policy "Users update their mobile workouts" on public.mobile_workout_sessions
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users delete their mobile workouts" on public.mobile_workout_sessions;
create policy "Users delete their mobile workouts" on public.mobile_workout_sessions
  for delete to authenticated using ((select auth.uid()) = user_id);
