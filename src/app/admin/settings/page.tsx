import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getAdminSettings, getSessionProfile } from "@/lib/data";

export default async function SettingsPage() {
  const { profile } = await getSessionProfile();
  if (profile?.role !== "admin") {
    redirect("/");
  }

  const settings = await getAdminSettings();

  return (
    <>
      <SiteHeader profile={profile} />
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
          Admin settings
        </p>
        <h1 className="text-3xl font-semibold">Pricing, durations, and hours</h1>
        <section className="mt-6 grid gap-4 rounded-lg border border-line bg-surface p-5 shadow-sm sm:grid-cols-2">
          <Setting label="Haircut price" value={`$${settings.haircut_price}`} />
          <Setting label="Haircut + beard price" value={`$${settings.haircut_beard_price}`} />
          <Setting label="Loyalty requirement" value={`${settings.loyalty_required_haircuts}th cut free`} />
          <Setting label="Referral discount" value={`$${settings.referral_discount_amount}`} />
          <Setting label="Haircut duration" value={`${settings.haircut_duration_minutes} min`} />
          <Setting label="Haircut + beard duration" value={`${settings.haircut_beard_duration_minutes} min`} />
          <Setting label="Cancellation window" value={`${settings.cancellation_window_hours} hours`} />
          <Setting
            label="Customer changes"
            value={`${settings.allow_customer_cancellation ? "Cancel" : "No cancel"} / ${
              settings.allow_customer_reschedule ? "Reschedule" : "No reschedule"
            }`}
          />
        </section>
        <section className="mt-5 rounded-lg border border-line bg-surface p-5 shadow-sm">
          <h2 className="font-semibold">Business hours</h2>
          <div className="mt-4 grid gap-2">
            {Object.entries(settings.business_hours).map(([day, hours]) => (
              <div key={day} className="flex items-center justify-between rounded-md bg-background px-4 py-3">
                <span className="capitalize">{day}</span>
                <span className="text-sm font-semibold text-muted">
                  {hours.enabled ? `${hours.start} - ${hours.end}` : "Closed"}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted">
            Editing forms are intentionally separated from the defaults in the
            database schema so the admin can change these values safely after
            Supabase is connected.
          </p>
        </section>
      </main>
    </>
  );
}

function Setting({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-background p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
