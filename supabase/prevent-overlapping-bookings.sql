begin;

create or replace function public.prevent_overlapping_bookings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status not in ('pending', 'confirmed') then
    return new;
  end if;

  if new.duration_minutes <= 0 then
    raise exception using errcode = '22023', message = 'BOOKING_DURATION_INVALID';
  end if;

  -- ponytail: one barber means one schedule lock; key by barber if multiple calendars are added.
  perform pg_advisory_xact_lock(78421, 1);

  if exists (
    select 1
    from public.bookings existing
    where existing.id <> new.id
      and existing.status in ('pending', 'confirmed')
      and existing.date_time < new.date_time + make_interval(mins => new.duration_minutes)
      and new.date_time < existing.date_time + make_interval(mins => existing.duration_minutes)
  ) then
    raise exception using errcode = '23P01', message = 'BOOKING_TIME_CONFLICT';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_overlapping_bookings_trigger on public.bookings;
create trigger prevent_overlapping_bookings_trigger
before insert or update of date_time, duration_minutes, status on public.bookings
for each row execute function public.prevent_overlapping_bookings();

commit;
