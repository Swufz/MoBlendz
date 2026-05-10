create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where auth_user_id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.owns_profile(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = profile_id
      and auth_user_id = auth.uid()
  );
$$;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_update_own_phone_or_admin" on public.profiles;
drop policy if exists "profiles_insert_self" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_admin" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;

create policy "profiles_select_own" on public.profiles
for select using (auth_user_id = auth.uid());

create policy "profiles_select_admin" on public.profiles
for select using (public.is_admin());

create policy "profiles_update_own" on public.profiles
for update using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());

create policy "profiles_update_admin" on public.profiles
for update using (public.is_admin())
with check (public.is_admin());

create policy "profiles_insert_own" on public.profiles
for insert with check (auth_user_id = auth.uid());

drop policy if exists "bookings_select_own_or_admin" on public.bookings;
drop policy if exists "bookings_insert_own" on public.bookings;
drop policy if exists "bookings_update_own_or_admin" on public.bookings;
drop policy if exists "bookings_select_own" on public.bookings;
drop policy if exists "bookings_select_admin" on public.bookings;
drop policy if exists "bookings_insert_customer" on public.bookings;
drop policy if exists "bookings_update_own" on public.bookings;
drop policy if exists "bookings_update_admin" on public.bookings;
drop policy if exists "bookings_delete_admin" on public.bookings;

create policy "bookings_select_own" on public.bookings
for select using (public.owns_profile(user_id));

create policy "bookings_select_admin" on public.bookings
for select using (public.is_admin());

create policy "bookings_insert_customer" on public.bookings
for insert with check (public.owns_profile(user_id));

create policy "bookings_update_own" on public.bookings
for update using (public.owns_profile(user_id))
with check (public.owns_profile(user_id));

create policy "bookings_update_admin" on public.bookings
for update using (public.is_admin())
with check (public.is_admin());

create policy "bookings_delete_admin" on public.bookings
for delete using (public.is_admin());

create or replace function public.admin_dashboard_stats()
returns table (
  total_earnings numeric,
  month_earnings numeric,
  completed_haircuts bigint,
  haircut_only_count bigint,
  haircut_beard_count bigint,
  active_customers bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(sum(coalesce(b.final_price, b.base_price - b.discount_amount)), 0) as total_earnings,
    coalesce(sum(coalesce(b.final_price, b.base_price - b.discount_amount)) filter (
      where b.completed_at >= date_trunc('month', now())
    ), 0) as month_earnings,
    count(b.id) as completed_haircuts,
    count(b.id) filter (where b.service_type = 'haircut') as haircut_only_count,
    count(b.id) filter (where b.service_type = 'haircut_beard') as haircut_beard_count,
    case
      when public.is_admin()
      then (select count(*) from public.profiles p where p.role = 'customer')
      else 0
    end as active_customers
  from public.bookings b
  where public.is_admin()
    and b.status = 'completed';
$$;

create index if not exists bookings_user_id_idx on public.bookings(user_id);
create index if not exists bookings_date_time_idx on public.bookings(date_time);
create index if not exists bookings_status_idx on public.bookings(status);
create index if not exists profiles_auth_user_id_idx on public.profiles(auth_user_id);
create index if not exists profiles_phone_idx on public.profiles(phone);
create index if not exists haircut_history_user_id_idx on public.haircut_history(user_id);
create unique index if not exists haircut_history_booking_id_uidx on public.haircut_history(booking_id);
create index if not exists referrals_referrer_user_id_idx on public.referrals(referrer_user_id);
create index if not exists referrals_referred_user_id_idx on public.referrals(referred_user_id);
create index if not exists discount_credits_user_id_idx on public.discount_credits(user_id);

alter table public.bookings
add column if not exists cancelled_at timestamptz;

create table if not exists public.weekly_availability (
  id uuid primary key default gen_random_uuid(),
  day_of_week integer not null unique check (day_of_week between 0 and 6),
  is_available boolean not null default false,
  start_time time not null default '15:00',
  end_time time not null default '20:00',
  break_start time,
  break_end time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weekly_availability_time_order check (end_time > start_time),
  constraint weekly_availability_break_order check (
    break_start is null
    or break_end is null
    or break_end > break_start
  )
);

alter table public.weekly_availability enable row level security;

drop policy if exists "weekly_availability_select_authenticated" on public.weekly_availability;
drop policy if exists "weekly_availability_write_admin" on public.weekly_availability;

create policy "weekly_availability_select_authenticated" on public.weekly_availability
for select using (auth.role() in ('anon', 'authenticated'));

create policy "weekly_availability_write_admin" on public.weekly_availability
for all using (public.is_admin()) with check (public.is_admin());

insert into public.weekly_availability (day_of_week, is_available, start_time, end_time)
values
  (0, false, '10:00', '18:00'),
  (1, true, '15:00', '20:00'),
  (2, true, '15:00', '20:00'),
  (3, true, '15:00', '20:00'),
  (4, true, '15:00', '20:00'),
  (5, true, '15:00', '20:00'),
  (6, true, '10:00', '18:00')
on conflict (day_of_week) do nothing;

alter table public.blocked_times
add column if not exists date date;

alter table public.blocked_times
add column if not exists start_time time;

alter table public.blocked_times
add column if not exists end_time time;

alter table public.blocked_times
add column if not exists all_day boolean not null default false;

alter table public.blocked_times
add column if not exists updated_at timestamptz not null default now();

alter table public.blocked_times
alter column starts_at drop not null;

alter table public.blocked_times
alter column ends_at drop not null;

drop policy if exists "blocked_select_authenticated" on public.blocked_times;
drop policy if exists "blocked_write_admin" on public.blocked_times;

create policy "blocked_select_authenticated" on public.blocked_times
for select using (auth.role() in ('anon', 'authenticated'));

create policy "blocked_write_admin" on public.blocked_times
for all using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "avatars_public_read" on storage.objects;
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_delete_own_or_admin" on storage.objects;

create policy "avatars_public_read" on storage.objects
for select using (bucket_id = 'avatars');

create policy "avatars_insert_own" on storage.objects
for insert with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "avatars_update_own" on storage.objects
for update using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
) with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "avatars_delete_own_or_admin" on storage.objects
for delete using (
  bucket_id = 'avatars'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or public.is_admin()
  )
);
