import Image from "next/image";
import { BookingWizard } from "@/components/booking-wizard";
import { SiteHeader } from "@/components/site-header";
import { getAdminSettings, getSessionProfile, getWeeklyAvailability } from "@/lib/data";
import type { ServiceType } from "@/lib/types";

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ addon?: string; ref?: string; resume?: string; service?: string }>;
}) {
  const { addon, ref, resume, service } = await searchParams;
  const initialServiceType: ServiceType = service === "haircut_beard" ? service : "haircut";
  const shouldStartFresh = service === "haircut" || service === "haircut_beard";
  const [{ profile }, settings, weeklyAvailability] = await Promise.all([
    getSessionProfile(),
    getAdminSettings(),
    getWeeklyAvailability(),
  ]);

  return (
    <>
      <SiteHeader profile={profile} />
      <main className="flex-1 pb-28 lg:pb-16">
        <section className="relative isolate flex min-h-72 items-end overflow-hidden border-b border-line">
          <Image
            src="/images/haircut 3.jpg"
            alt="Fresh taper finished by MoBlendz"
            fill
            priority
            sizes="100vw"
            className="-z-20 object-cover object-[50%_58%]"
          />
          <div className="absolute inset-0 -z-10 bg-black/65" />
          <div className="mx-auto w-full max-w-6xl px-4 pb-9 sm:px-6">
            <p className="text-sm font-semibold text-gold">Private appointments</p>
            <h1 className="mt-2 max-w-2xl font-heading text-5xl font-semibold text-white sm:text-6xl">
              Reserve your chair.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">
              Pick a service, choose a time, and confirm. Cash is collected in person.
            </p>
          </div>
        </section>

        <div className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6">
          <BookingWizard
            initialIsLoggedIn={Boolean(profile)}
            initialReferralCode={ref ?? ""}
            initialScalpNeckMassage={addon === "scalp_neck_massage"}
            initialServiceType={initialServiceType}
            settings={settings}
            shouldStartFresh={shouldStartFresh}
            shouldResume={resume === "1"}
            weeklyAvailability={weeklyAvailability}
          />
        </div>
      </main>
    </>
  );
}
