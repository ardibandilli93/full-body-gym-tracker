-- Integration test: temporary users and workouts are always rolled back.
begin;
select set_config('test.owner', gen_random_uuid()::text, true);
select set_config('test.other', gen_random_uuid()::text, true);
insert into auth.users(id) values (current_setting('test.owner')::uuid), (current_setting('test.other')::uuid);
insert into public.workout_days(user_id, workout_date, session)
values (current_setting('test.other')::uuid, '2026-01-01', 'A');
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', current_setting('test.owner'), 'role', 'authenticated')::text, true);
do $$
declare affected integer;
begin
  if has_table_privilege(current_user, 'public.workout_days', 'TRUNCATE')
     or has_table_privilege(current_user, 'public.workout_days', 'TRIGGER')
     or has_table_privilege(current_user, 'public.workout_days', 'REFERENCES') then
    raise exception 'Excessive privileges';
  end if;
  if exists(select 1 from public.workout_days where user_id = current_setting('test.other')::uuid) then raise exception 'Cross-account read allowed'; end if;
  update public.workout_days set session = 'B' where user_id = current_setting('test.other')::uuid;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Cross-account update allowed'; end if;
  delete from public.workout_days where user_id = current_setting('test.other')::uuid;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Cross-account delete allowed'; end if;
  begin
    insert into public.workout_days(user_id, workout_date) values(current_setting('test.other')::uuid, '2026-01-02');
    raise exception 'Cross-account insert allowed';
  exception when insufficient_privilege then null;
  end;
  insert into public.workout_days(user_id, workout_date) values(current_setting('test.owner')::uuid, '2026-01-02');
  if not exists(select 1 from public.workout_days where user_id = current_setting('test.owner')::uuid) then raise exception 'Own read denied'; end if;
  update public.workout_days set session = 'C' where user_id = current_setting('test.owner')::uuid;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Own update denied'; end if;
  begin
    update public.workout_days set user_id = current_setting('test.other')::uuid where user_id = current_setting('test.owner')::uuid;
    raise exception 'Owner reassignment allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.workout_days set exercises = '[]'::jsonb where user_id = current_setting('test.owner')::uuid;
    raise exception 'Invalid payload allowed';
  exception when check_violation then null;
  end;
  begin
    update public.workout_days set exercises = jsonb_build_object('oversized', repeat('x', 65537)) where user_id = current_setting('test.owner')::uuid;
    raise exception 'Oversized payload allowed';
  exception when check_violation then null;
  end;
  delete from public.workout_days where user_id = current_setting('test.owner')::uuid;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Own delete denied'; end if;
end $$;
set local role anon;
do $$
begin
  if has_table_privilege(current_user, 'public.workout_days', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') then raise exception 'Anonymous privileges remain'; end if;
  begin
    perform 1 from public.workout_days limit 1;
    raise exception 'Anonymous read allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
rollback;
select 'PASS: owner CRUD, cross-account isolation, anonymous denial, payload limits, least privilege; fixtures rolled back' as result;
