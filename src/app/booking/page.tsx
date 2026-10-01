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
      <main className="account-home account-flow">
        <div className="account-flow-content">
        <section className="account-page-intro" aria-labelledby="booking-title">
          <div className="account-wordmark" aria-hidden="true">MoBlendz</div>
          <div className="account-page-portrait" aria-hidden="true">
            <Image src="/images/landing-hero.png" alt="" fill preload sizes="(min-width: 701px) 280px, 140px" className="object-contain object-bottom -scale-x-100" />
          </div>
          <div className="account-page-heading">
            <h1 id="booking-title">
              Reserve your chair.
            </h1>
            <p>
              Pick a service, choose a time, and confirm. Cash is collected in person.
            </p>
          </div>
        </section>

        <div className="account-booking-form">
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
        </div>
      </main>
    </>
  );
}
