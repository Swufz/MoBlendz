create extension if not exists pgcrypto;

create type user_role as enum ('customer', 'admin');
create type service_type as enum ('haircut', 'haircut_beard');
create type booking_status as enum ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
create type discount_type as enum ('none', 'referral', 'free_haircut', 'manual');
create type referral_status as enum ('pending', 'completed', 'rewarded');
create type credit_status as enum ('unused', 'used', 'expired');

create table profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  role user_role not null default 'customer',
  referral_code text not null unique,
  referred_by_user_id uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint no_self_referral check (id is distinct from referred_by_user_id)
);

create table admin_settings (
  id uuid primary key default gen_random_uuid(),
  haircut_price numeric(10,2) not null default 30,
  haircut_beard_price numeric(10,2) not null default 35,
  loyalty_required_haircuts integer not null default 5,
  referral_discount_amount numeric(10,2) not null default 5,
  haircut_duration_minutes integer not null default 30,
  haircut_beard_duration_minutes integer not null default 45,
  cancellation_window_hours integer not null default 4,
  allow_customer_cancellation boolean not null default true,
  allow_customer_reschedule boolean not null default true,
  business_hours jsonb not null default '{
    "monday": {"enabled": true, "start": "09:00", "end": "18:00"},
    "tuesday": {"enabled": true, "start": "09:00", "end": "18:00"},
    "wednesday": {"enabled": true, "start": "09:00", "end": "18:00"},
    "thursday": {"enabled": true, "start": "09:00", "end": "18:00"},
    "friday": {"enabled": true, "start": "09:00", "end": "18:00"},
    "saturday": {"enabled": true, "start": "10:00", "end": "16:00"},
    "sunday": {"enabled": false, "start": "10:00", "end": "16:00"}
  }',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  service_type service_type not null,
  base_price numeric(10,2) not null,
  final_price numeric(10,2),
  discount_type discount_type not null default 'none',
  discount_amount numeric(10,2) not null default 0,
  date_time timestamptz not null,
  duration_minutes integer not null default 30,
  status booking_status not null default 'pending',
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_date_time_idx on bookings(date_time);
create index bookings_status_idx on bookings(status);
create index bookings_user_id_idx on bookings(user_id);
create index bookings_status_date_time_idx on bookings(status, date_time);
create index profiles_auth_user_id_idx on profiles(auth_user_id);
create index profiles_phone_idx on profiles(phone);
create index profiles_role_created_at_idx on profiles(role, created_at);

create table haircut_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  booking_id uuid not null unique references bookings(id) on delete cascade,
  service_type service_type not null,
  base_price numeric(10,2) not null,
  discount_amount numeric(10,2) not null default 0,
  final_price numeric(10,2) not null,
  was_free_haircut boolean not null default false,
  used_referral_credit boolean not null default false,
  completed_at timestamptz not null default now()
);

create index haircut_history_user_id_idx on haircut_history(user_id);
create index haircut_history_completed_at_idx on haircut_history(completed_at);
create index haircut_history_service_type_idx on haircut_history(service_type);

create table loyalty (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  paid_haircuts_since_last_free integer not null default 0,
  free_haircuts_available integer not null default 0,
  total_free_haircuts_used integer not null default 0,
  updated_at timestamptz not null default now()
);

create table referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references profiles(id) on delete cascade,
  referred_user_id uuid not null unique references profiles(id) on delete cascade,
  status referral_status not null default 'pending',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint no_referral_self_pair check (referrer_user_id <> referred_user_id)
);

create index referrals_referrer_user_id_idx on referrals(referrer_user_id);
create index referrals_referred_user_id_idx on referrals(referred_user_id);

create table discount_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null default 'referral',
  amount numeric(10,2) not null,
  status credit_status not null default 'unused',
  source_referral_id uuid references referrals(id),
  used_booking_id uuid references bookings(id),
  created_at timestamptz not null default now(),
  used_at timestamptz
);

create index discount_credits_user_id_idx on discount_credits(user_id);
create index discount_credits_user_status_idx on discount_credits(user_id, status);

create table blocked_times (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint blocked_time_positive check (ends_at > starts_at)
);

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

create or replace function admin_dashboard_stats()
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
    coalesce(sum(h.final_price), 0) as total_earnings,
    coalesce(sum(h.final_price) filter (
      where h.completed_at >= date_trunc('month', now())
    ), 0) as month_earnings,
    count(h.id) as completed_haircuts,
    count(h.id) filter (where h.service_type = 'haircut') as haircut_only_count,
    count(h.id) filter (where h.service_type = 'haircut_beard') as haircut_beard_count,
    case
      when public.is_admin()
      then (select count(*) from public.profiles p where p.role = 'customer')
      else 0
    end as active_customers
  from haircut_history h
  where public.is_admin();
$$;

alter table profiles enable row level security;
alter table bookings enable row level security;
alter table haircut_history enable row level security;
alter table loyalty enable row level security;
alter table referrals enable row level security;
alter table discount_credits enable row level security;
alter table admin_settings enable row level security;
alter table blocked_times enable row level security;

drop policy if exists "profiles_select_own_or_admin" on profiles;
drop policy if exists "profiles_update_own_phone_or_admin" on profiles;
drop policy if exists "profiles_insert_self" on profiles;
drop policy if exists "profiles_select_own" on profiles;
drop policy if exists "profiles_select_admin" on profiles;
drop policy if exists "profiles_update_own" on profiles;
drop policy if exists "profiles_update_admin" on profiles;
drop policy if exists "profiles_insert_own" on profiles;

create policy "profiles_select_own" on profiles
for select using (auth_user_id = auth.uid());

create policy "profiles_select_admin" on profiles
for select using (public.is_admin());

create policy "profiles_update_own" on profiles
for update using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());

create policy "profiles_update_admin" on profiles
for update using (public.is_admin())
with check (public.is_admin());

create policy "profiles_insert_own" on profiles
for insert with check (auth_user_id = auth.uid());

drop policy if exists "bookings_select_own_or_admin" on bookings;
drop policy if exists "bookings_insert_own" on bookings;
drop policy if exists "bookings_update_own_or_admin" on bookings;
drop policy if exists "bookings_select_own" on bookings;
drop policy if exists "bookings_select_admin" on bookings;
drop policy if exists "bookings_insert_customer" on bookings;
drop policy if exists "bookings_update_own" on bookings;
drop policy if exists "bookings_update_admin" on bookings;
drop policy if exists "bookings_delete_admin" on bookings;

create policy "bookings_select_own" on bookings
for select using (public.owns_profile(user_id));

create policy "bookings_select_admin" on bookings
for select using (public.is_admin());

create policy "bookings_insert_customer" on bookings
for insert with check (public.owns_profile(user_id));

create policy "bookings_update_own" on bookings
for update using (public.owns_profile(user_id))
with check (public.owns_profile(user_id));

create policy "bookings_update_admin" on bookings
for update using (public.is_admin())
with check (public.is_admin());

create policy "bookings_delete_admin" on bookings
for delete using (public.is_admin());

create policy "history_select_own_or_admin" on haircut_history
for select using (public.owns_profile(user_id) or public.is_admin());

create policy "history_insert_admin" on haircut_history
for insert with check (public.is_admin());

create policy "loyalty_select_own_or_admin" on loyalty
for select using (public.owns_profile(user_id) or public.is_admin());

create policy "loyalty_write_admin" on loyalty
for all using (public.is_admin()) with check (public.is_admin());

create policy "referrals_select_own_or_admin" on referrals
for select using (
  public.owns_profile(referrer_user_id) or public.owns_profile(referred_user_id) or public.is_admin()
);

create policy "referrals_insert_own_referred" on referrals
for insert with check (public.owns_profile(referred_user_id));

create policy "referrals_update_admin" on referrals
for update using (public.is_admin()) with check (public.is_admin());

create policy "credits_select_own_or_admin" on discount_credits
for select using (public.owns_profile(user_id) or public.is_admin());

create policy "credits_write_admin" on discount_credits
for all using (public.is_admin()) with check (public.is_admin());

create policy "settings_select_authenticated" on admin_settings
for select using (auth.role() = 'authenticated');

create policy "settings_write_admin" on admin_settings
for all using (public.is_admin()) with check (public.is_admin());

create policy "blocked_select_authenticated" on blocked_times
for select using (auth.role() = 'authenticated');

create policy "blocked_write_admin" on blocked_times
for all using (public.is_admin()) with check (public.is_admin());

insert into admin_settings default values;
