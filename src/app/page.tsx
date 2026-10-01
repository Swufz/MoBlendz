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
import { DarkCard, GoldButton } from "@/components/luxury-ui";
import { ReferralCard } from "@/components/referral-card";
import { RecentCutsSlideshow } from "@/components/recent-cuts-slideshow";
import { SiteHeader } from "@/components/site-header";
import {
  getAdminSettings,
  getMyLoyalty,
  getSessionProfile,
  getUnusedReferralCredits,
} from "@/lib/data";
import type { Loyalty, Profile, ServiceType } from "@/lib/types";

const recentCuts = [
  { title: "Scissor Work", image: "/images/haircut 1.jpg" },
  { title: "Low Taper Mullet", image: "/images/haircut 2.jpg" },
  { title: "Curly taper", image: "/images/gallery-2.jpg" },
  { title: "Textured taper", image: "/images/gallery-1.jpg" },
  { title: "Fresh blend", image: "/images/haircut 4.jpg" },
  { title: "Layered flow", image: "/images/gallery-3.jpg" },
  { title: "Taper finish", image: "/images/gallery-4.jpg" },
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
  const bookingHref = getBookingHref(referralCode);

  return (
    <>
      <SiteHeader />
      <main className="flex w-full flex-1 flex-col">
        <section
          className="relative isolate h-[calc(100svh-7.5rem)] min-h-[560px] max-h-[780px] overflow-hidden border-b border-line bg-[#18201d]"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 70% 80% at 12% 12%, rgba(86, 100, 91, 0.72) 0%, transparent 65%), radial-gradient(ellipse 75% 85% at 92% 32%, rgba(43, 75, 75, 0.68) 0%, transparent 62%), radial-gradient(ellipse 90% 75% at 48% 100%, rgba(31, 55, 46, 0.82) 0%, transparent 70%)",
          }}
        >
          <div className="absolute inset-y-0 left-[8%] w-px bg-white/5" />
          <div className="absolute inset-y-0 right-[8%] w-px bg-white/5" />
          <div className="absolute inset-x-0 top-[42%] h-px bg-white/5" />

          <div className="relative mx-auto h-full w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
            <div className="relative pt-16 sm:pt-14 lg:pt-10">
              <p className="relative z-30 text-sm font-semibold text-gold">Private barbering by appointment</p>
              <h1
                className="relative z-10 mt-2 origin-left scale-x-[1.06] text-[4.25rem] font-black leading-[0.78] tracking-normal text-[#f1eee5] sm:text-[7rem] lg:text-[9.5rem] xl:text-[10.5rem]"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                MoBlendz
              </h1>
            </div>

            <div className="absolute bottom-0 left-[-18%] z-20 h-[84%] w-[136%] sm:left-[-4%] sm:h-[78%] sm:w-[84%] lg:left-[1%] lg:h-[83%] lg:w-[60%]">
              <Image
                src="/images/landing-hero.png"
                alt="MoBlendz haircut in right-facing profile"
                fill
                priority
                unoptimized
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-contain object-bottom"
              />
            </div>

            <div className="absolute bottom-12 right-10 z-20 hidden w-[36%] lg:block">
              <p className="mb-3 text-sm font-semibold text-gold">Choose your service</p>
              <div className="border-t border-white/20">
                <div className="flex items-center justify-between border-b border-white/20 py-4">
                  <span className="font-heading text-2xl text-[#f1eee5]">Haircut</span>
                  <span className="font-heading text-2xl text-[#f1eee5]">$30</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/20 py-4">
                  <span className="font-heading text-2xl text-[#f1eee5]">Haircut + Beard</span>
                  <span className="font-heading text-2xl text-[#f1eee5]">$35</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/20 py-4">
                  <span className="font-heading text-2xl text-[#f1eee5]">Scalp/neck massage</span>
                  <span className="font-heading text-2xl text-[#f1eee5]">+$15</span>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between gap-6">
                <p className="max-w-48 text-sm leading-6 text-white/60">One chair. No rush. Clean work from consultation to finish.</p>
                <Link href={bookingHref}>
                  <GoldButton>
                    Book <ArrowRight size={17} className="ml-2" />
                  </GoldButton>
                </Link>
              </div>
            </div>

            <div className="absolute inset-x-4 bottom-6 z-20 flex flex-col gap-3 lg:hidden">
              <Link href={bookingHref}>
                <GoldButton className="w-full">
                  Book Appointment <ArrowRight size={17} className="ml-2" />
                </GoldButton>
              </Link>
              <a href="#recent-cuts" className="inline-flex h-11 items-center justify-center rounded-md border border-white/25 bg-black/25 px-5 text-sm font-semibold text-white">
                View the gallery
              </a>
            </div>

            <div className="hidden">
              <LoyaltyProgressCard completed={0} required={paidNeeded + 1} variant="promo" />
            </div>
          </div>
        </section>

        <section id="services" className="bg-[#141a14] px-4 py-20 sm:px-6 lg:py-28">
          <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
            <div>
              <p className="text-sm font-semibold text-gold">Services</p>
              <h2 className="mt-3 max-w-md font-heading text-5xl font-semibold leading-none text-foreground sm:text-6xl">
                Classic work, shaped for you.
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-7 text-muted">
                Every appointment starts with the cut you want and ends with the details that make it yours.
              </p>
            </div>
            <div>
              <ServiceCard title="Haircut" price="$30" copy="Clean cut, fade, and lineup." icon={<Scissors />} href={getBookingHref(referralCode, "haircut")} />
              <ServiceCard title="Haircut + Beard" price="$35" copy="Cut, beard trim, shaping, and lineup." icon={<Sparkles />} href={getBookingHref(referralCode, "haircut_beard")} />
              <ServiceCard title="Scalp/neck massage add-on" price="+$15" copy="Add 15 minutes of scalp and neck massage to any cut." icon={<Sparkles />} href={getBookingHref(referralCode, "haircut", true)} />
            </div>
          </div>
        </section>

        <RecentCutsSection bookingHref={bookingHref} />

        <section className="border-t border-line bg-background px-4 py-16 sm:px-6 lg:py-20">
          <div className="mx-auto flex w-full max-w-7xl flex-col justify-between gap-8 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-gold">Your next cut</p>
              <h2 className="mt-3 max-w-2xl font-heading text-5xl font-semibold leading-none sm:text-6xl">
                Ready when you are.
              </h2>
            </div>
            <Link href={bookingHref}>
              <GoldButton>
                Reserve your chair <ArrowRight size={17} className="ml-2" />
              </GoldButton>
            </Link>
          </div>
        </section>
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
    <section id="recent-cuts" className="bg-[#d7d0bf] px-4 py-20 text-[#10130f] sm:px-6 lg:py-28">
      <div className="mx-auto grid w-full max-w-7xl gap-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-[#59604f]">Gallery</p>
            <h2 className="mt-2 font-heading text-5xl font-semibold leading-none sm:text-6xl">Recent work.</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[#59604f]">
              Clean blends, natural movement, and sharp finishes from the chair.
            </p>
          </div>
          <Link href={bookingHref} className="inline-flex text-sm font-semibold text-[#10130f]">
            Book a cut <ArrowRight size={17} className="ml-2" />
          </Link>
        </div>
        <RecentCutsSlideshow cuts={recentCuts} />
      </div>
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
    <div className="border-t border-line py-7 last:border-b">
      <div className="flex items-start justify-between gap-6">
        <div className="flex gap-4">
          <span className="mt-1 text-gold">{icon}</span>
          <div>
            <h3 className="font-heading text-3xl font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{copy}</p>
          </div>
        </div>
        <p className="font-heading text-3xl font-semibold text-foreground">{price}</p>
      </div>
      <Link href={href} className="mt-5 inline-flex items-center text-sm font-semibold text-gold transition hover:text-barber-blue-strong">
        Book service <ArrowRight size={15} className="ml-2" />
      </Link>
    </div>
  );
}

function getBookingHref(
  referralCode: string,
  serviceType?: ServiceType,
  scalpNeckMassage = false,
) {
  const params = new URLSearchParams();
  if (referralCode) params.set("ref", referralCode);
  if (serviceType) params.set("service", serviceType);
  if (scalpNeckMassage) params.set("addon", "scalp_neck_massage");
  return `/booking${params.size ? `?${params}` : ""}`;
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
