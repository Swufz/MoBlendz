import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeDollarSign,
  CalendarCheck,
  Gift,
  Scissors,
  Sparkles,
  Star,
  UserRound,
  Wallet,
} from "lucide-react";
import { DarkCard, GoldButton, SectionHeader, StatusBadge } from "@/components/luxury-ui";
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
import type { Booking, Loyalty, Profile } from "@/lib/types";

const recentCuts = [
  { title: "Scissor Work", image: "/images/haircut 1.jpg" },
  { title: "Low Taper Mullet", image: "/images/haircut 2.jpg" },
  { title: "Low taper fade", image: "/images/haircut 3.jpg" },
  { title: "Haircut + beard", image: "/images/beard cut.jpg" },
  { title: "Clean lineup", image: null },
  { title: "Textured top", image: null },
];

export default async function Home() {
  const { profile } = await getSessionProfile();
  const settings = await getAdminSettings();

  if (profile?.role === "admin") {
    return <AdminHome profile={profile} />;
  }

  if (profile?.role === "customer") {
    const [loyalty, bookings, credits] = await Promise.all([
      getMyLoyalty(profile.id),
      getMyBookings(profile.id),
      getUnusedReferralCredits(profile.id),
    ]);

    return (
      <CustomerHome
        activeCredits={credits.length}
        bookings={bookings}
        loyalty={loyalty}
        paidNeeded={settings.loyalty_required_haircuts - 1}
        profile={profile}
      />
    );
  }

  return <LoggedOutHome paidNeeded={settings.loyalty_required_haircuts - 1} />;
}

function LoggedOutHome({ paidNeeded }: { paidNeeded: number }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-16 px-4 pb-28 pt-8 sm:pt-10 lg:pb-16">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-line bg-[radial-gradient(circle_at_70%_20%,rgba(214,168,79,0.22),transparent_28rem),linear-gradient(135deg,#121514,#080a09_60%,#171a18)] p-5 luxury-glow sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div className="relative z-10">
              <span className="inline-flex rounded-full border border-gold/35 bg-gold/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-gold">
                Fresh cuts. Clean fades. Easy booking.
              </span>
              <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.95] tracking-tight text-foreground sm:text-7xl">
                Look Sharp. <br />
                Feel Confident.
              </h1>
              <p className="mt-4 text-3xl font-semibold italic text-gold sm:text-5xl">
                Book Your Next Cut.
              </p>
              <p className="mt-6 max-w-xl text-base leading-8 text-muted sm:text-lg">
                Schedule your haircut in minutes, track your free-cut progress,
                and pay cash when you arrive.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/booking">
                  <GoldButton className="w-full sm:w-auto">
                    Book Now <ArrowRight size={17} className="ml-2" />
                  </GoldButton>
                </Link>
                <Link
                  href="#recent-cuts"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-line px-5 text-sm font-bold text-foreground transition hover:border-gold/60 hover:text-gold"
                >
                  View Recent Cuts
                </Link>
              </div>
            </div>

            <div className="relative min-h-[380px] lg:min-h-[410px]">
              <div className="absolute inset-0 overflow-hidden rounded-[2.25rem] border border-line bg-secondary-card luxury-glow">
                <Image
                  src="/images/haircut 1.jpg"
                  alt="Fresh MoBlendz haircut"
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/15 to-transparent" />
                <div className="absolute left-5 top-5 rounded-full border border-gold/30 bg-background/75 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-gold backdrop-blur">
                  Your Next Cut Starts Here
                </div>
              </div>

              <DarkCard className="absolute bottom-5 left-5 right-5 p-5 sm:left-auto sm:w-80">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-gold">
                      Free Cut Progress
                    </p>
                    <p className="mt-3 text-4xl font-black">2 / {paidNeeded}</p>
                    <p className="mt-1 text-sm text-muted">paid visits</p>
                  </div>
                  <div className="grid size-16 place-items-center rounded-3xl bg-gold/10 text-gold">
                    <Star className="fill-gold" />
                  </div>
                </div>
                <div className="mt-5 flex gap-2">
                  {Array.from({ length: paidNeeded }).map((_, index) => (
                    <span
                      key={index}
                      className={`h-3 flex-1 rounded-full ${
                        index < 2 ? "bg-gold" : "bg-secondary-card"
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-4 text-sm text-muted">
                  Your 5th cut is free after 4 paid visits.
                </p>
              </DarkCard>
            </div>
          </div>
        </section>

        <RecentCutsSection />

        <section id="services" className="grid gap-6">
          <SectionHeader
            eyebrow="Services"
            title="Haircuts by appointment."
            copy="Book your next haircut in seconds. Pay cash when you arrive."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <ServiceCard title="Haircut" price="$30" copy="Clean fade, lineup, and style." icon={<Scissors />} />
            <ServiceCard title="Haircut + Beard" price="$35" copy="Full cut with beard trim, shaping, and lineup." icon={<Sparkles />} />
          </div>
        </section>

        <LocalBarberSection />
        <RewardsSection />
        <BookingCta />
      </main>
    </>
  );
}

function CustomerHome({
  activeCredits,
  bookings,
  loyalty,
  paidNeeded,
  profile,
}: {
  activeCredits: number;
  bookings: Booking[];
  loyalty: Loyalty | null;
  paidNeeded: number;
  profile: Profile;
}) {
  const firstName = profile.full_name.split(" ")[0] || "there";
  const upcoming = bookings.find((booking) =>
    ["pending", "confirmed"].includes(booking.status),
  );
  const progress = Math.min(loyalty?.paid_haircuts_since_last_free ?? 0, paidNeeded);

  return (
    <>
      <SiteHeader profile={profile} />
      <main className="mx-auto grid w-full max-w-7xl gap-5 px-4 pb-28 pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:pb-16">
        <section className="space-y-5">
          <DarkCard className="p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-gold">
              MoBlendz dashboard
            </p>
            <h1 className="mt-3 text-4xl font-black sm:text-5xl">
              Welcome back, {firstName}.
            </h1>
            <p className="mt-3 text-lg text-muted">Ready for your next cut?</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/booking">
                <GoldButton className="w-full sm:w-auto">Book Appointment</GoldButton>
              </Link>
              <Link
                href="/profile"
                className="inline-flex h-12 items-center justify-center rounded-full border border-line px-5 text-sm font-bold text-foreground"
              >
                My Bookings
              </Link>
            </div>
          </DarkCard>

          <DarkCard className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-gold">
                  Next appointment
                </p>
                {upcoming ? (
                  <>
                    <h2 className="mt-3 text-2xl font-black">
                      {serviceLabels[upcoming.service_type]}
                    </h2>
                    <p className="mt-2 text-sm text-muted">
                      {formatBookingDate(upcoming.date_time)} at{" "}
                      {formatBookingTime(upcoming.date_time)}
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="mt-3 text-2xl font-black">No upcoming appointment</h2>
                    <p className="mt-2 text-sm text-muted">
                      Lock in your next spot when you are ready.
                    </p>
                  </>
                )}
              </div>
              {upcoming ? <StatusBadge status={upcoming.status} /> : null}
            </div>
            <Link href={upcoming ? "/profile" : "/booking"} className="mt-5 inline-flex">
              <GoldButton>{upcoming ? "View Booking" : "Book Appointment"}</GoldButton>
            </Link>
          </DarkCard>
        </section>

        <section className="space-y-5">
          <DarkCard className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-gold">
                  Loyalty Rewards
                </p>
                <h2 className="mt-2 text-3xl font-black">{progress} / {paidNeeded}</h2>
                <p className="text-sm text-muted">paid cuts toward your free cut</p>
              </div>
              {loyalty?.free_haircuts_available ? (
                <span className="rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-xs font-black text-gold">
                  Free cut available
                </span>
              ) : null}
            </div>
            <div className="mt-5 flex gap-2">
              {Array.from({ length: paidNeeded }).map((_, index) => (
                <span
                  key={index}
                  className={`h-3 flex-1 rounded-full ${
                    index < progress ? "bg-gold" : "bg-secondary-card"
                  }`}
                />
              ))}
            </div>
          </DarkCard>

          <DarkCard className="p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-gold">
              Referral
            </p>
            <p className="mt-3 text-3xl font-black tracking-[0.18em]">
              {profile.referral_code}
            </p>
            <p className="mt-2 text-sm text-muted">
              Active $5 credits: <span className="font-black text-gold">{activeCredits}</span>
            </p>
          </DarkCard>

          <div className="grid gap-3 sm:grid-cols-2">
            <QuickAction href="/booking" label="Book Appointment" icon={<CalendarCheck />} />
            <QuickAction href="/profile" label="Edit Profile" icon={<UserRound />} />
            <QuickAction href="/profile" label="My Bookings" icon={<Scissors />} />
            <QuickAction href="/profile" label="Refer a Friend" icon={<BadgeDollarSign />} />
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
          <p className="text-xs font-black uppercase tracking-[0.22em] text-gold">
            Admin
          </p>
          <h1 className="mt-3 text-5xl font-black">MoBlendz command center.</h1>
          <p className="mt-4 max-w-2xl text-muted">
            Manage today&apos;s bookings, complete cuts, cancel appointments,
            view customers, and track cash earnings.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/admin">
              <GoldButton>Admin Dashboard</GoldButton>
            </Link>
            <Link className="inline-flex h-12 items-center justify-center rounded-full border border-line px-5 text-sm font-bold" href="/admin/bookings">
              View Bookings
            </Link>
          </div>
        </DarkCard>
      </main>
    </>
  );
}

function RecentCutsSection() {
  return (
    <section id="recent-cuts" className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <SectionHeader
          eyebrow="Recent Cuts"
          title="Real cuts, clean blends, and sharp finishes."
        />
        <Link href="/booking" className="inline-flex">
          <GoldButton>Like this style? Book your cut.</GoldButton>
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recentCuts.map((cut) => (
          <RecentCutCard key={cut.title} title={cut.title} image={cut.image} />
        ))}
      </div>
    </section>
  );
}

function ServiceCard({
  title,
  price,
  copy,
  icon,
}: {
  title: string;
  price: string;
  copy: string;
  icon: React.ReactNode;
}) {
  return (
    <DarkCard className="group p-6 transition hover:-translate-y-1 hover:border-gold/60 hover:shadow-[0_20px_70px_rgba(214,168,79,0.12)]">
      <div className="flex items-start justify-between gap-4">
        <div className="grid size-14 place-items-center rounded-3xl bg-gold/10 text-gold">
          {icon}
        </div>
        <p className="text-3xl font-black text-gold">{price}</p>
      </div>
      <h3 className="mt-6 text-2xl font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{copy}</p>
      <Link href="/booking" className="mt-6 inline-flex rounded-full border border-line px-4 py-2 text-sm font-bold text-gold transition group-hover:border-gold/70">
        Book service
      </Link>
    </DarkCard>
  );
}

function RecentCutCard({ title, image }: { title: string; image: string | null }) {
  return (
    <div className="group relative min-h-[340px] overflow-hidden rounded-[2rem] border border-line bg-secondary-card luxury-glow">
      {image ? (
        <Image
          src={image}
          alt={title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(214,168,79,0.18),transparent_16rem),linear-gradient(135deg,#171a18,#080a09)]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4">
        <p className="rounded-full border border-gold/30 bg-background/75 px-4 py-2 text-sm font-black text-gold backdrop-blur">
          {title}
        </p>
      </div>
    </div>
  );
}

function LocalBarberSection() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-stretch">
      <DarkCard className="relative min-h-[360px] overflow-hidden">
        <Image
          src="/images/beard cut.jpg"
          alt="MoBlendz haircut and beard setup"
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="absolute bottom-5 left-5 right-5 rounded-3xl border border-line bg-background/75 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-gold">
            Private appointment setup
          </p>
          <h2 className="mt-2 text-3xl font-black">Fresh cuts by appointment</h2>
        </div>
      </DarkCard>

      <DarkCard className="p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-gold">
          Local barber
        </p>
        <h2 className="mt-3 text-4xl font-black">Cut by MoBlendz</h2>
        <p className="mt-4 text-base leading-8 text-muted">
          Private cuts, clean fades, and a simple booking experience. Choose a
          time, pull up, and pay cash after your cut.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <InfoPill icon={<Wallet />} label="Cash payment" />
          <InfoPill icon={<CalendarCheck />} label="Appointment-only" />
          <InfoPill icon={<Gift />} label="Loyalty rewards" />
          <InfoPill icon={<BadgeDollarSign />} label="Referral discount" />
        </div>
      </DarkCard>
    </section>
  );
}

function RewardsSection() {
  return (
    <section id="loyalty" className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      <SectionHeader
        eyebrow="Rewards"
        title="Fresh cuts come with rewards."
        copy="Your 5th cut is free after 4 paid visits. Refer a friend and both of you get $5 off."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <DarkCard className="p-6">
          <Gift className="text-gold" />
          <h3 className="mt-5 text-2xl font-black">Every 5th cut is free</h3>
          <p className="mt-3 text-sm leading-6 text-muted">
            Your 5th cut is free after 4 paid visits.
          </p>
        </DarkCard>
        <DarkCard className="p-6">
          <BadgeDollarSign className="text-gold" />
          <h3 className="mt-5 text-2xl font-black">$5 referral credit</h3>
          <p className="mt-3 text-sm leading-6 text-muted">
            Refer a friend and both of you get $5 off.
          </p>
        </DarkCard>
      </div>
    </section>
  );
}

function BookingCta() {
  return (
    <section className="rounded-[2.5rem] border border-line bg-secondary-card p-6 luxury-glow sm:p-10">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-gold">
            Book by appointment
          </p>
          <h2 className="mt-3 text-4xl font-black">Ready for a fresh cut?</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Choose your service, pick a time, and confirm your appointment.
          </p>
          <Link href="/booking" className="mt-6 inline-flex">
            <GoldButton>Book Appointment</GoldButton>
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["1", "Choose Service"],
            ["2", "Pick Time"],
            ["3", "Confirm Booking"],
          ].map(([number, label]) => (
            <div key={number} className="rounded-3xl border border-line bg-background p-5">
              <span className="grid size-10 place-items-center rounded-full bg-gold/15 text-sm font-black text-gold">
                {number}
              </span>
              <p className="mt-4 font-black">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function InfoPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-line bg-background p-4">
      <span className="grid size-10 place-items-center rounded-2xl bg-gold/10 text-gold">
        {icon}
      </span>
      <span className="text-sm font-black">{label}</span>
    </div>
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
    <Link href={href} className="flex items-center gap-3 rounded-3xl border border-line bg-surface p-4 font-black transition hover:border-gold/60">
      <span className="grid size-10 place-items-center rounded-2xl bg-gold/10 text-gold">
        {icon}
      </span>
      {label}
    </Link>
  );
}
