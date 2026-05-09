import { BookingWizard } from "@/components/booking-wizard";
import { SiteHeader } from "@/components/site-header";
import { getAdminSettings, getSessionProfile } from "@/lib/data";

export default async function BookingPage() {
  const { profile } = await getSessionProfile();
  const settings = await getAdminSettings();

  return (
    <>
      <SiteHeader profile={profile} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <BookingWizard settings={settings} />
      </main>
    </>
  );
}
