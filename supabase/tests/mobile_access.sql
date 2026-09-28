begin;
select set_config('test.owner', gen_random_uuid()::text, true);
select set_config('test.other', gen_random_uuid()::text, true);
insert into auth.users(id) values (current_setting('test.owner')::uuid), (current_setting('test.other')::uuid);

insert into public.mobile_profiles(user_id, preferred_name, gender, age, unit_system, height_cm, current_weight_kg, goal_weight_kg, onboarding_complete, payload)
values (current_setting('test.other')::uuid, 'Other', 'other', 21, 'metric', 170, 70, 70, true, '{}'::jsonb);
insert into public.routine_plans(user_id, id, name, days_per_week, payload)
values (current_setting('test.other')::uuid, 'other-plan', 'Other plan', 3, '{}'::jsonb);
insert into public.mobile_workout_sessions(user_id, id, local_date, plan_day_id, status, payload, started_at)
values (current_setting('test.other')::uuid, 'other-session', '2026-01-01', 'day-a', 'in_progress', '{}'::jsonb, now());

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', current_setting('test.owner'), 'role', 'authenticated')::text, true);

do $$
declare affected integer;
begin
  if exists(select 1 from public.mobile_profiles where user_id = current_setting('test.other')::uuid)
    or exists(select 1 from public.routine_plans where user_id = current_setting('test.other')::uuid)
    or exists(select 1 from public.mobile_workout_sessions where user_id = current_setting('test.other')::uuid) then
    raise exception 'Cross-account read allowed';
  end if;

  insert into public.mobile_profiles(user_id, preferred_name, gender, age, unit_system, height_cm, current_weight_kg, goal_weight_kg, onboarding_complete, payload)
  values (current_setting('test.owner')::uuid, 'Owner', 'other', 25, 'metric', 175, 75, 72, true, '{}'::jsonb);
  insert into public.routine_plans(user_id, id, name, days_per_week, payload)
  values (current_setting('test.owner')::uuid, 'owner-plan', 'Owner plan', 3, '{}'::jsonb);
  insert into public.mobile_workout_sessions(user_id, id, local_date, plan_day_id, status, payload, started_at)
  values (current_setting('test.owner')::uuid, 'owner-session', '2026-01-02', 'day-a', 'in_progress', '{}'::jsonb, now());

  update public.mobile_profiles set preferred_name = 'Updated' where user_id = current_setting('test.owner')::uuid;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Own update denied'; end if;

  update public.routine_plans set name = 'Blocked' where user_id = current_setting('test.other')::uuid;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Cross-account update allowed'; end if;

  begin
    insert into public.mobile_workout_sessions(user_id, id, local_date, plan_day_id, status, payload, started_at)
    values (current_setting('test.other')::uuid, 'forbidden', '2026-01-03', 'day-a', 'in_progress', '{}'::jsonb, now());
    raise exception 'Cross-account insert allowed';
  exception when insufficient_privilege then null;
  end;

  begin
    update public.mobile_profiles set user_id = current_setting('test.other')::uuid where user_id = current_setting('test.owner')::uuid;
    raise exception 'Owner reassignment allowed';
  exception when insufficient_privilege then null;
  end;
end $$;

set local role anon;
do $$
begin
  if has_table_privilege(current_user, 'public.mobile_profiles', 'SELECT')
    or has_table_privilege(current_user, 'public.routine_plans', 'SELECT')
    or has_table_privilege(current_user, 'public.mobile_workout_sessions', 'SELECT') then
    raise exception 'Anonymous privileges remain';
  end if;
end $$;

rollback;
select 'PASS: mobile profile, routine, and workout owner isolation' as result;
