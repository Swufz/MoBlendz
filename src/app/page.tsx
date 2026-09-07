import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeDollarSign,
  CalendarCheck,
  Scissors,
  Sparkles,
  UserRound,
} from "lucide-react";
import { LoyaltyProgressCard } from "@/components/loyalty-tracker";
import { DarkCard, GoldButton, SectionHeader } from "@/components/luxury-ui";
import { ReferralCard } from "@/components/referral-card";
import { RecentCutsSlideshow } from "@/components/recent-cuts-slideshow";
import { SiteHeader } from "@/components/site-header";
import {
  getAdminSettings,
  getMyLoyalty,
  getSessionProfile,
  getUnusedReferralCredits,
} from "@/lib/data";
import type { Loyalty, Profile } from "@/lib/types";

const recentCuts = [
  { title: "Scissor Work", image: "/images/haircut 1.jpg" },
  { title: "Low Taper Mullet", image: "/images/haircut 2.jpg" },
  { title: "Low taper fade", image: "/images/haircut 3.jpg" },
  { title: "Fresh blend", image: "/images/haircut 4.jpg" },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  const { profile } = await getSessionProfile();
  const settings = await getAdminSettings();

  if (profile?.role === "admin") {
    return <AdminHome profile={profile} />;
  }

  if (profile?.role === "customer") {
    const [loyalty, credits] = await Promise.all([
      getMyLoyalty(profile.id),
      getUnusedReferralCredits(profile.id),
    ]);

    return (
      <CustomerHome
        activeCredits={credits.length}
        loyalty={loyalty}
        paidNeeded={settings.loyalty_required_haircuts - 1}
        profile={profile}
      />
    );
  }

  return (
    <LoggedOutHome
      paidNeeded={settings.loyalty_required_haircuts - 1}
      referralCode={ref ?? ""}
    />
  );
}

function LoggedOutHome({
  paidNeeded,
  referralCode,
}: {
  paidNeeded: number;
  referralCode: string;
}) {
  const bookingHref = referralCode
    ? `/booking?ref=${encodeURIComponent(referralCode)}`
    : "/booking";

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-4 pb-24 pt-6 sm:pt-8 lg:pb-12">
        <section className="border border-line bg-surface p-5 sm:p-6 lg:p-7">
          <div className="grid gap-7 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
            <div className="relative z-10">
              <h1 className="text-3xl font-semibold text-foreground sm:text-5xl">
                Private cuts by appointment.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-muted">
                Choose your service, pick a time, and pay cash when you arrive.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href={bookingHref}>
                  <GoldButton className="w-full sm:w-auto">
                    Book Appointment <ArrowRight size={17} className="ml-2" />
                  </GoldButton>
                </Link>
                <Link
                  href="#recent-cuts"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-line px-4 text-sm font-semibold text-foreground transition hover:border-gold/60 hover:text-gold"
                >
                  View Recent Cuts
                </Link>
              </div>
            </div>

            <div className="relative min-h-[310px] sm:min-h-[350px] lg:min-h-[360px]">
              <div className="absolute inset-0 overflow-hidden rounded-lg border border-line bg-secondary-card">
                <Image
                  src="/images/haircut 1.jpg"
                  alt="Fresh MoBlendz haircut"
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/10" />
              </div>

              <LoyaltyProgressCard
                className="absolute bottom-4 left-4 right-4 sm:left-auto sm:w-72"
                completed={0}
                required={paidNeeded + 1}
                variant="promo"
              />
            </div>
          </div>
        </section>

        <section id="services" className="grid gap-6">
          <SectionHeader
            title="Services"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <ServiceCard title="Haircut" price="$30" copy="Clean cut, fade, and lineup." icon={<Scissors />} href={bookingHref} />
            <ServiceCard title="Haircut + Beard" price="$35" copy="Cut, beard trim, shaping, and lineup." icon={<Sparkles />} href={bookingHref} />
          </div>
        </section>

        <RecentCutsSection bookingHref={bookingHref} />
      </main>
    </>
  );
}

function CustomerHome({
  activeCredits,
  loyalty,
  paidNeeded,
  profile,
}: {
  activeCredits: number;
  loyalty: Loyalty | null;
  paidNeeded: number;
  profile: Profile;
}) {
  const firstName = profile.full_name.split(" ")[0] || "there";

  return (
    <>
      <SiteHeader profile={profile} />
      <main className="mx-auto grid w-full max-w-7xl gap-5 px-4 pb-28 pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:pb-16">
        <section className="space-y-5">
          <DarkCard className="p-6 sm:p-8">
            <p className="text-sm font-semibold text-muted">
              MoBlendz dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
              Welcome back, {firstName}.
            </h1>
            <p className="mt-3 text-lg text-muted">Ready for your next cut?</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/book">
                <GoldButton className="w-full sm:w-auto">Book Appointment</GoldButton>
              </Link>
              <Link
                href="/bookings"
                className="inline-flex h-10 items-center justify-center rounded-md border border-line px-4 text-sm font-semibold text-foreground"
              >
                My Bookings
              </Link>
            </div>
          </DarkCard>

        </section>

        <section className="space-y-5">
          <div id="loyalty">
            <LoyaltyProgressCard
              completed={loyalty?.paid_haircuts_since_last_free ?? 0}
              freeHaircutsAvailable={loyalty?.free_haircuts_available ?? 0}
              required={paidNeeded + 1}
            />
          </div>

          <ReferralCard activeCredits={activeCredits} referralCode={profile.referral_code} />

          <div className="grid gap-3 sm:grid-cols-2">
            <QuickAction href="/book" label="Book Appointment" icon={<CalendarCheck />} />
            <QuickAction href="/profile" label="Edit Profile" icon={<UserRound />} />
            <QuickAction href="/bookings" label="My Bookings" icon={<Scissors />} />
            <QuickAction href="/profile#referral" label="Refer a Friend" icon={<BadgeDollarSign />} />
          </div>
        </section>
      </main>
    </>
  );
}

function AdminHome({ profile }: { profile: Profile }) {
  return (
    <>
      <SiteHeader profile={profile} />
      <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-8 lg:pb-16">
        <DarkCard className="p-6 sm:p-10">
          <p className="text-sm font-semibold text-muted">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-semibold">MoBlendz admin</h1>
          <p className="mt-4 max-w-2xl text-muted">
            Manage today&apos;s bookings, complete cuts, cancel appointments,
            view customers, and track cash earnings.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/admin">
              <GoldButton>Admin Dashboard</GoldButton>
            </Link>
            <Link className="inline-flex h-10 items-center justify-center rounded-md border border-line px-4 text-sm font-semibold" href="/admin/bookings">
              View Bookings
            </Link>
          </div>
        </DarkCard>
      </main>
    </>
  );
}

function RecentCutsSection({ bookingHref = "/booking" }: { bookingHref?: string }) {
  return (
    <section id="recent-cuts" className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <SectionHeader
          title="Recent Cuts"
          copy="Clean blends, tapers, and sharp finishes."
        />
        <Link href={bookingHref} className="inline-flex">
          <GoldButton>Like this style? Book your cut.</GoldButton>
        </Link>
      </div>
      <RecentCutsSlideshow cuts={recentCuts} />
    </section>
  );
}

function ServiceCard({
  title,
  price,
  copy,
  icon,
  href = "/booking",
}: {
  title: string;
  price: string;
  copy: string;
  icon: React.ReactNode;
  href?: string;
}) {
  return (
    <DarkCard className="p-5 transition-colors hover:border-gold/60">
      <div className="flex items-start justify-between gap-4">
        <div className="text-gold">
          {icon}
        </div>
        <p className="text-2xl font-semibold text-gold">{price}</p>
      </div>
      <h3 className="mt-4 text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{copy}</p>
      <Link href={href} className="mt-5 inline-flex rounded-md border border-line px-3 py-2 text-sm font-semibold text-gold transition hover:border-gold/70">
        Book service
      </Link>
    </DarkCard>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-lg border border-line bg-surface p-3 font-semibold transition hover:border-gold/60">
      <span className="text-gold">
        {icon}
      </span>
      {label}
    </Link>
  );
}
