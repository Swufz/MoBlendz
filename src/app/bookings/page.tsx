import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { cancelBooking } from "@/app/actions";
import { SiteHeader } from "@/components/site-header";
import { StatusBadge } from "@/components/luxury-ui";
import { formatBookingDate, formatBookingTime } from "@/lib/business-logic";
import { getAdminSettings, getMyBookings, getSessionProfile } from "@/lib/data";
import { serviceLabels } from "@/lib/config";
import type { Booking } from "@/lib/types";

export default async function MyBookingsPage() {
  const { profile } = await getSessionProfile();

  if (!profile) {
    redirect("/login?next=/bookings");
  }

  if (profile.role === "admin") {
    redirect("/admin/bookings");
  }

  const [settings, bookings] = await Promise.all([
    getAdminSettings(),
    getMyBookings(profile.id),
  ]);
  const upcoming = bookings.filter((booking) =>
    ["pending", "confirmed"].includes(booking.status),
  );
  const past = bookings.filter((booking) =>
    ["completed", "cancelled", "no_show"].includes(booking.status),
  );

  return (
    <>
      <SiteHeader profile={profile} />
      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-8 lg:pb-12">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-gold">
              My Bookings
            </p>
            <h1 className="mt-2 text-4xl font-black">Your appointments.</h1>
            <p className="mt-2 text-sm text-muted">
              View upcoming cuts, past visits, status, and expected cash due.
            </p>
          </div>
          <Link
            href="/book"
            className="gold-gradient inline-flex h-12 items-center justify-center rounded-full px-5 text-sm font-black"
          >
            Book
          </Link>
        </div>

        <section className="mt-8 space-y-4">
          <h2 className="text-2xl font-black">Upcoming</h2>
          {upcoming.length ? (
            <div className="grid gap-3">
              {upcoming.map((booking) => (
                <BookingCard
                  key={booking.id}
                  allowCancel={settings.allow_customer_cancellation}
                  booking={booking}
                />
              ))}
            </div>
          ) : (
            <EmptyState label="No upcoming appointments." />
          )}
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-black">Past</h2>
          {past.length ? (
            <div className="grid gap-3">
              {past.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <EmptyState label="No past bookings yet." />
          )}
        </section>
      </main>
    </>
  );
}

function BookingCard({
  allowCancel = false,
  booking,
}: {
  allowCancel?: boolean;
  booking: Booking;
}) {
  const cashDue = getCashDue(booking);
  const canCancel = allowCancel && ["pending", "confirmed"].includes(booking.status);

  return (
    <article className="rounded-3xl border border-line bg-surface p-5 luxury-glow">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-lg font-black">{serviceLabels[booking.service_type]}</p>
          <p className="mt-1 text-sm text-muted">
            {formatBookingDate(booking.date_time)} at {formatBookingTime(booking.date_time)}
          </p>
          {booking.notes ? (
            <p className="mt-3 text-sm leading-6 text-muted">{booking.notes}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 sm:flex-col sm:items-end">
          <StatusBadge status={booking.status} />
          <p className="text-lg font-black text-gold">${cashDue}</p>
        </div>
      </div>

      {booking.discount_amount > 0 ? (
        <p className="mt-3 text-sm font-bold text-success">
          {booking.discount_type === "referral" ? "Referral discount" : "Discount"}: -$
          {Number(booking.discount_amount)}
        </p>
      ) : null}

      {canCancel ? (
        <form action={cancelBooking.bind(null, booking.id)} className="mt-4">
          <button className="rounded-full border border-danger/35 px-4 py-2 text-sm font-bold text-danger transition hover:bg-danger/10">
            Cancel booking
          </button>
        </form>
      ) : null}
    </article>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-3xl border border-line bg-surface p-8 text-center text-muted luxury-glow">
      <CalendarDays className="mx-auto mb-3 text-gold" />
      {label}
    </div>
  );
}

function getCashDue(booking: Booking) {
  return Number(
    booking.final_price ??
      Math.max(0, Number(booking.base_price) - Number(booking.discount_amount ?? 0)),
  );
}
