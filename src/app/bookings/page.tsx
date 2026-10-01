import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarDays, Scissors } from "lucide-react";
import { cancelBooking } from "@/app/actions";
import { SiteHeader } from "@/components/site-header";
import { StatusBadge } from "@/components/luxury-ui";
import { formatBookingDate, formatBookingTime } from "@/lib/business-logic";
import { getAdminSettings, getMyBookings, getSessionProfile } from "@/lib/data";
import {
  formatServiceLabel,
  getCustomerBookingNotes,
  hasScalpNeckMassageAddon,
} from "@/lib/config";
import type { Booking } from "@/lib/types";

export default async function MyBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ cancel?: string }>;
}) {
  const { cancel } = await searchParams;
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
      <main className="account-home account-flow">
        <div className="account-flow-content">
        {cancel ? (
          <p
            role="status"
            className={`mb-6 rounded-md border px-4 py-3 text-sm ${
              cancel === "success"
                ? "border-success/35 bg-success/10 text-success"
                : "border-danger/35 bg-danger/10 text-danger"
            }`}
          >
            {cancel === "success"
              ? "Booking cancelled."
              : cancel === "too-late"
                ? `Online cancellation closes ${settings.cancellation_window_hours} hours before the appointment.`
                : "This booking is no longer available to cancel."}
          </p>
        ) : null}
        <section className="account-page-intro" aria-labelledby="bookings-title">
          <div className="account-wordmark" aria-hidden="true">MoBlendz</div>
          <div className="account-page-portrait" aria-hidden="true">
            <Image src="/images/landing-hero.png" alt="" fill preload sizes="(min-width: 701px) 280px, 140px" className="object-contain object-bottom -scale-x-100" />
          </div>
          <div className="account-page-heading">
            <h1 id="bookings-title">Your appointments.</h1>
            <p>
              View upcoming cuts, past visits, status, and expected cash due.
            </p>
          <Link
            href="/book"
            className="account-button account-button-gold mt-5"
          >
            Book Appointment <ArrowRight size={18} />
          </Link>
          </div>
        </section>

        <section className="bookings-section space-y-4">
          <div className="bookings-section-heading"><h2>Upcoming</h2><span>{upcoming.length} {upcoming.length === 1 ? "appointment" : "appointments"}</span></div>
          {upcoming.length ? (
            <div className="grid gap-3">
              {upcoming.map((booking) => (
                <BookingCard
                  key={booking.id}
                  canCancel={settings.allow_customer_cancellation}
                  booking={booking}
                />
              ))}
            </div>
          ) : (
            <EmptyState label="No upcoming appointments." />
          )}
        </section>

        <section className="bookings-section space-y-4">
          <div className="bookings-section-heading"><h2>Past visits</h2><span>{past.length} {past.length === 1 ? "booking" : "bookings"}</span></div>
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
        </div>
      </main>
    </>
  );
}

function BookingCard({
  canCancel = false,
  booking,
}: {
  canCancel?: boolean;
  booking: Booking;
}) {
  const cashDue = getCashDue(booking);
  const customerNotes = getCustomerBookingNotes(booking.notes);

  return (
    <article className="appointment-card">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="appointment-details">
          <span className="account-icon" aria-hidden="true"><Scissors size={23} strokeWidth={1.5} /></span>
          <div>
          <p className="appointment-service">
            {formatServiceLabel(
              booking.service_type,
              hasScalpNeckMassageAddon(booking.notes),
            )}
          </p>
          <p className="mt-1 text-sm text-muted">
            {formatBookingDate(booking.date_time)} at {formatBookingTime(booking.date_time)}
          </p>
          {customerNotes ? (
            <p className="mt-3 text-sm leading-6 text-muted">{customerNotes}</p>
          ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:flex-col sm:items-end">
          <StatusBadge status={booking.status} />
          <p className="appointment-price">${cashDue}<span>Expected cash due</span></p>
        </div>
      </div>

      {booking.discount_amount > 0 ? (
        <p className="mt-3 text-sm font-bold text-success">
          {booking.discount_type === "referral" ? "Referral discount" : "Discount"}: -$
          {Number(booking.discount_amount)}
        </p>
      ) : null}

      {canCancel ? (
        <form action={cancelBooking.bind(null, booking.id)} className="appointment-cancel">
          <button className="rounded-md border border-danger/35 px-4 py-2 text-sm font-bold text-danger transition hover:bg-danger/10">
            Cancel booking
          </button>
        </form>
      ) : null}
    </article>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="appointments-empty">
      <span className="account-icon" aria-hidden="true"><CalendarDays size={25} strokeWidth={1.5} /></span>
      <p>{label}</p>
    </div>
  );
}

function getCashDue(booking: Booking) {
  return Number(
    booking.final_price ??
      Math.max(0, Number(booking.base_price) - Number(booking.discount_amount ?? 0)),
  );
}
