import { BookingWizard } from "@/components/booking-wizard";
import { SiteHeader } from "@/components/site-header";
import {
  getActiveBookingsForAvailability,
  getAdminSettings,
  getBlockedTimes,
  getSessionProfile,
  getWeeklyAvailability,
} from "@/lib/data";

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ resume?: string }>;
}) {
  const { resume } = await searchParams;
  const { profile } = await getSessionProfile();
  const [settings, weeklyAvailability, blockedTimes, activeBookings] = await Promise.all([
    getAdminSettings(),
    getWeeklyAvailability(),
    getBlockedTimes(),
    getActiveBookingsForAvailability(),
  ]);

  return (
    <>
      <SiteHeader profile={profile} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-8 lg:pb-12">
        <div className="mx-auto mb-6 max-w-xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-gold">
            Book Your Appointment
          </p>
          <h1 className="mt-2 text-4xl font-black">Reserve your chair.</h1>
          <p className="mt-3 text-sm text-muted">
            Pick a service, choose a time, and confirm. Cash is collected in person.
          </p>
        </div>
        <BookingWizard
          initialIsLoggedIn={Boolean(profile)}
          activeBookings={activeBookings}
          blockedTimes={blockedTimes}
          settings={settings}
          shouldResume={resume === "1"}
          weeklyAvailability={weeklyAvailability}
        />
      </main>
    </>
  );
}
