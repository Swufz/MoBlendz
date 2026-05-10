create or replace function public.normalize_referral_code(input_code text)
returns text
language sql
immutable
as $$
  select regexp_replace(upper(coalesce(input_code, '')), '[^A-Z0-9]', '', 'g');
$$;

create or replace function public.generate_referral_code(base_code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_base text := coalesce(nullif(public.normalize_referral_code(base_code), ''), 'CLIENT');
  candidate text;
  suffix integer := 1;
begin
  loop
    candidate := case
      when suffix = 1 then clean_base
      else clean_base || suffix::text
    end;

    if not exists (select 1 from public.profiles where referral_code = candidate) then
      return candidate;
    end if;

    suffix := suffix + 1;

    if suffix > 99 then
      candidate := clean_base || upper(substr(md5(random()::text), 1, 3));
      if not exists (select 1 from public.profiles where referral_code = candidate) then
        return candidate;
      end if;
    end if;
  end loop;
end;
$$;

with duplicate_codes as (
  select
    id,
    row_number() over (
      partition by public.normalize_referral_code(referral_code)
      order by created_at, id
    ) as duplicate_rank
  from public.profiles
)
update public.profiles p
set referral_code = public.generate_referral_code(p.full_name),
    updated_at = now()
from duplicate_codes d
where p.id = d.id
  and d.duplicate_rank > 1;

create unique index if not exists profiles_referral_code_uidx
on public.profiles(referral_code);

create unique index if not exists discount_credits_referral_user_uidx
on public.discount_credits(source_referral_id, user_id)
where source_referral_id is not null;

create or replace function public.get_referrer_by_code(input_code text)
returns table(id uuid, referral_code text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.referral_code
  from public.profiles p
  where p.referral_code = public.normalize_referral_code(input_code)
  limit 1;
$$;

create or replace function public.link_referral_code(input_code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile public.profiles%rowtype;
  referrer_id uuid;
begin
  select *
  into current_profile
  from public.profiles
  where auth_user_id = auth.uid()
  limit 1;

  if current_profile.id is null then
    return 'not_authenticated';
  end if;

  select p.id
  into referrer_id
  from public.profiles p
  where p.referral_code = public.normalize_referral_code(input_code)
  limit 1;

  if referrer_id is null then
    return 'not_found';
  end if;

  if referrer_id = current_profile.id then
    return 'self_referral';
  end if;

  if current_profile.referred_by_user_id is not null then
    if current_profile.referred_by_user_id = referrer_id then
      return 'already_linked_same_referrer';
    end if;

    return 'already_referred';
  end if;

  update public.profiles
  set referred_by_user_id = referrer_id,
      updated_at = now()
  where id = current_profile.id
    and referred_by_user_id is null;

  insert into public.referrals(referrer_user_id, referred_user_id, status)
  values (referrer_id, current_profile.id, 'pending')
  on conflict (referred_user_id) do nothing;

  return 'linked';
end;
$$;

create or replace function public.prevent_referred_by_change()
returns trigger
language plpgsql
as $$
begin
  if old.referred_by_user_id is not null
    and new.referred_by_user_id is distinct from old.referred_by_user_id then
    raise exception 'referred_by_user_id cannot be changed after it is set';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_referred_by_change_trigger on public.profiles;
create trigger prevent_referred_by_change_trigger
before update on public.profiles
for each row execute function public.prevent_referred_by_change();
