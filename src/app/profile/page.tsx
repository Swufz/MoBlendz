import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Gift, TicketPercent } from "lucide-react";
import { cancelBooking } from "@/app/actions";
import { LoyaltyTracker } from "@/components/loyalty-tracker";
import { LogoutButton } from "@/components/logout-button";
import { SiteHeader } from "@/components/site-header";
import { formatBookingDate, formatBookingTime } from "@/lib/business-logic";
import {
  getAdminSettings,
  getMyBookings,
  getMyLoyalty,
  getSessionProfile,
  getUnusedReferralCredits,
} from "@/lib/data";
import { serviceLabels } from "@/lib/config";

export default async function ProfilePage() {
  const { profile } = await getSessionProfile();
  if (!profile) {
    redirect("/login?next=/profile");
  }

  const [settings, loyalty, bookings, credits] = await Promise.all([
    getAdminSettings(),
    getMyLoyalty(profile.id),
    getMyBookings(profile.id),
    getUnusedReferralCredits(profile.id),
  ]);
  const upcoming = bookings.filter((booking) =>
    ["pending", "confirmed"].includes(booking.status),
  );
  const completed = bookings.filter((booking) => booking.status === "completed");

  return (
    <>
      <SiteHeader profile={profile} />
      <main className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-8 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="space-y-5">
          <div className="rounded-[2rem] border border-line bg-surface p-5 shadow-sm">
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.avatar_url ?? "/file.svg"}
                alt=""
                className="size-16 rounded-full object-cover"
              />
              <div>
                <h1 className="text-2xl font-semibold">{profile.full_name}</h1>
                <p className="text-sm text-muted">{profile.email}</p>
                <p className="text-sm text-muted">{profile.phone ?? "Phone needed"}</p>
              </div>
            </div>
            <LogoutButton
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-line bg-background px-4 text-sm font-semibold text-muted sm:hidden"
              showIcon
            />
          </div>
          <LoyaltyTracker
            completed={loyalty?.paid_haircuts_since_last_free ?? 0}
            required={settings.loyalty_required_haircuts}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-surface p-5 ring-1 ring-line">
              <Gift className="text-gold" />
              <p className="mt-3 text-sm text-muted">Free cuts available</p>
              <p className="text-3xl font-semibold">
                {loyalty?.free_haircuts_available ?? 0}
              </p>
            </div>
            <div className="rounded-3xl bg-surface p-5 ring-1 ring-line">
              <TicketPercent className="text-barber-blue-strong" />
              <p className="mt-3 text-sm text-muted">$5 credits</p>
              <p className="text-3xl font-semibold">{credits.length}</p>
            </div>
          </div>
          <div className="rounded-3xl bg-foreground p-5 text-background">
            <p className="text-sm text-background/70">Referral code</p>
            <p className="mt-2 text-2xl font-semibold tracking-[0.18em]">
              {profile.referral_code}
            </p>
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Upcoming bookings</h2>
            <Link
              href="/booking"
              className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background"
            >
              Book
            </Link>
          </div>
          <div className="grid gap-3">
            {upcoming.length ? (
              upcoming.map((booking) => (
                <article
                  key={booking.id}
                  className="rounded-3xl border border-line bg-surface p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{serviceLabels[booking.service_type]}</p>
                      <p className="mt-1 text-sm text-muted">
                        {formatBookingDate(booking.date_time)} at{" "}
                        {formatBookingTime(booking.date_time)}
                      </p>
                    </div>
                    <span className="rounded-full bg-barber-blue px-3 py-1 text-xs font-semibold">
                      {booking.status}
                    </span>
                  </div>
                  {settings.allow_customer_cancellation ? (
                    <form action={cancelBooking.bind(null, booking.id)} className="mt-4">
                      <button className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-muted">
                        Cancel booking
                      </button>
                    </form>
                  ) : null}
                </article>
              ))
            ) : (
              <div className="rounded-3xl bg-surface p-8 text-center text-muted ring-1 ring-line">
                <CalendarDays className="mx-auto mb-3" />
                No upcoming bookings.
              </div>
            )}
          </div>

          <h2 className="pt-4 text-xl font-semibold">Past completed haircuts</h2>
          <div className="grid gap-3">
            {completed.slice(0, 6).map((booking) => (
              <article key={booking.id} className="rounded-3xl bg-surface p-5 ring-1 ring-line">
                <p className="font-semibold">{serviceLabels[booking.service_type]}</p>
                <p className="mt-1 text-sm text-muted">
                  {formatBookingDate(booking.date_time)} · Cash paid ${booking.final_price}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
