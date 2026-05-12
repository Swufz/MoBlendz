import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Gift, TicketPercent } from "lucide-react";
import { LoyaltyTracker } from "@/components/loyalty-tracker";
import { LogoutButton } from "@/components/logout-button";
import { ProfileEditForm } from "@/components/profile-edit-form";
import { ReferralCard } from "@/components/referral-card";
import { SiteHeader } from "@/components/site-header";
import { formatBookingDate, formatBookingTime } from "@/lib/business-logic";
import { serviceLabels } from "@/lib/config";
import {
  getAdminSettings,
  getMyBookings,
  getMyLoyalty,
  getSessionProfile,
  getUnusedReferralCredits,
} from "@/lib/data";

export default async function ProfilePage() {
  const { profile } = await getSessionProfile();
  if (!profile) {
    redirect("/login?next=/profile");
  }

  if (profile.role === "admin") {
    redirect("/admin");
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
  const recentBookings = [...upcoming, ...completed].slice(0, 4);

  return (
    <>
      <SiteHeader profile={profile} />
      <main className="mx-auto grid w-full max-w-6xl gap-5 px-4 pb-28 pt-8 lg:grid-cols-[0.8fr_1.2fr] lg:pb-12">
        <section className="space-y-5">
          <div>
            <ProfileEditForm profile={profile} />
            <LogoutButton
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-line bg-background px-4 text-sm font-bold text-muted sm:hidden"
              showIcon
            />
          </div>

          <div id="loyalty" className="scroll-mt-28">
            <LoyaltyTracker
              completed={loyalty?.paid_haircuts_since_last_free ?? 0}
              freeHaircutsAvailable={loyalty?.free_haircuts_available ?? 0}
              required={settings.loyalty_required_haircuts}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-surface p-5 ">
              <Gift className="text-gold" />
              <p className="mt-3 text-sm text-muted">Free cuts available</p>
              <p className="text-3xl font-semibold">
                {loyalty?.free_haircuts_available ?? 0}
              </p>
            </div>
            <div className="rounded-lg bg-surface p-5 ">
              <TicketPercent className="text-barber-blue-strong" />
              <p className="mt-3 text-sm text-muted">$5 credits</p>
              <p className="text-3xl font-semibold">{credits.length}</p>
            </div>
          </div>

          <ReferralCard activeCredits={credits.length} referralCode={profile.referral_code} />
        </section>

        <section className="space-y-5">
          <div className="rounded-lg border border-line bg-surface p-5 ">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              Account
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Profile details</h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              Manage your contact info, rewards, referral code, and active credits here.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/book"
                className="bg-gold text-background inline-flex h-11 items-center justify-center rounded-md px-4 text-sm font-semibold"
              >
                Book
              </Link>
              <Link
                href="/bookings"
                className="inline-flex h-11 items-center justify-center rounded-md border border-line px-4 text-sm font-semibold text-foreground"
              >
                My Bookings
              </Link>
            </div>
          </div>

          <h2 className="pt-2 text-xl font-semibold">Recent bookings</h2>
          <div className="grid gap-3">
            {recentBookings.length ? (
              recentBookings.map((booking) => (
                <article key={booking.id} className="rounded-lg bg-surface p-5 ring-1 ring-line">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{serviceLabels[booking.service_type]}</p>
                      <p className="mt-1 text-sm text-muted">
                        {formatBookingDate(booking.date_time)} at {formatBookingTime(booking.date_time)}
                      </p>
                    </div>
                    <span className="rounded-md border border-gold/35 bg-gold/10 px-3 py-1 text-xs font-bold text-gold">
                      {booking.status}
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-lg bg-surface p-8 text-center text-muted ring-1 ring-line">
                <CalendarDays className="mx-auto mb-3" />
                No bookings yet.
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
