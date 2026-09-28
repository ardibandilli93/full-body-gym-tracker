alter table public.mobile_profiles
  drop constraint if exists mobile_profiles_age_check;

alter table public.mobile_profiles
  add constraint mobile_profiles_age_check check (age between 18 and 120);
