import Link from "next/link";
import { ArrowRight, BadgeDollarSign, Gift } from "lucide-react";
import { LoyaltyTracker } from "@/components/loyalty-tracker";
import { SiteHeader } from "@/components/site-header";
import { BRAND_NAME } from "@/lib/config";
import { getAdminSettings, getMyLoyalty, getSessionProfile } from "@/lib/data";

export default async function Home() {
  const { profile } = await getSessionProfile();
  const settings = await getAdminSettings();
  const loyalty = await getMyLoyalty(profile?.id);
  const progress = loyalty?.paid_haircuts_since_last_free ?? 0;

  return (
    <>
      <SiteHeader profile={profile} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-8 sm:py-12">
        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-5">
            <LoyaltyTracker
              completed={progress}
              required={settings.loyalty_required_haircuts}
            />
            <Link
              href="/booking"
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 text-base font-semibold text-background sm:w-auto"
            >
              Book Now
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="rounded-[2.25rem] bg-surface p-6 shadow-sm ring-1 ring-line sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
              Premium cuts, simple booking
            </p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight sm:text-6xl">
              {BRAND_NAME}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
              Book your next cut in a few taps, track your reward progress, and
              pay cash in person when you arrive.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-background p-5">
                <Gift className="text-gold" />
                <h2 className="mt-4 font-semibold">Every 5th cut is free</h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Complete 4 paid haircuts and your next haircut is covered.
                </p>
              </div>
              <div className="rounded-3xl bg-background p-5">
                <BadgeDollarSign className="text-barber-blue-strong" />
                <h2 className="mt-4 font-semibold">$5 referral credits</h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Refer a friend and both credits activate after their first cut.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
