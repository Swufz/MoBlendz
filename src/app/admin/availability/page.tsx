import { redirect } from "next/navigation";
import { AvailabilityManager } from "@/components/availability-manager";
import { SiteHeader } from "@/components/site-header";
import { getBlockedTimes, getSessionProfile, getWeeklyAvailability } from "@/lib/data";

export default async function AdminAvailabilityPage() {
  const { profile } = await getSessionProfile();
  if (profile?.role !== "admin") {
    redirect("/");
  }

  const [weeklyAvailability, blockedTimes] = await Promise.all([
    getWeeklyAvailability(),
    getBlockedTimes(),
  ]);

  return (
    <>
      <SiteHeader profile={profile} />
      <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-8 lg:pb-16">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            Admin availability
          </p>
          <h1 className="mt-2 text-4xl font-semibold">Control booking hours.</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted">
            Set your weekly schedule and block off dates or time ranges so
            customers only see bookable appointment slots.
          </p>
        </div>
        <AvailabilityManager
          blockedTimes={blockedTimes}
          weeklyAvailability={weeklyAvailability}
        />
      </main>
    </>
  );
}
