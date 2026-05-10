import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck, Clock, DollarSign, Scissors, UsersRound } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { formatBookingDate, formatBookingTime } from "@/lib/business-logic";
import { serviceLabels } from "@/lib/config";
import { getSessionProfile, getSupabaseOrNull } from "@/lib/data";
import type { Booking } from "@/lib/types";

type AdminDashboardStats = {
  total_earnings: number;
  month_earnings: number;
  completed_haircuts: number;
  haircut_only_count: number;
  haircut_beard_count: number;
  active_customers: number;
};

type DashboardBooking = Pick<
  Booking,
  "id" | "service_type" | "date_time" | "status" | "duration_minutes"
> & {
  profiles?: {
    full_name: string;
    phone: string | null;
  } | null;
};

export default async function AdminPage() {
  console.time("admin auth check");
  const { profile } = await getSessionProfile();
  console.timeEnd("admin auth check");

  console.time("admin profile role check");
  if (profile?.role !== "admin") {
    console.timeEnd("admin profile role check");
    redirect("/");
  }
  console.timeEnd("admin profile role check");

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    redirect("/");
  }

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  console.time("admin dashboard data");
  const [statsResult, todaysBookingsResult] = await Promise.all([
    fetchDashboardStats(supabase),
    fetchTodaysBookings(supabase, startOfToday, endOfToday),
  ]);
  console.timeEnd("admin dashboard data");

  const stats = statsResult.data;
  const todaysBookings = todaysBookingsResult.data ?? [];

  return (
    <>
      <SiteHeader profile={profile} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
              Admin dashboard
            </p>
            <h1 className="text-3xl font-semibold">Today at a glance</h1>
          </div>
          <div className="flex gap-2">
            <Link className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background" href="/admin/bookings">
              Bookings
            </Link>
            <Link className="rounded-full bg-barber-blue px-4 py-2 text-sm font-semibold" href="/admin/customers">
              Customers
            </Link>
            <Link className="rounded-full bg-surface px-4 py-2 text-sm font-semibold ring-1 ring-line" href="/admin/stats">
              Stats
            </Link>
            <Link className="rounded-full bg-surface px-4 py-2 text-sm font-semibold ring-1 ring-line" href="/admin/availability">
              Availability
            </Link>
          </div>
        </div>

        {statsResult.error ? (
          <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">
            Stats could not load: {statsResult.error.message}
          </p>
        ) : null}

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<DollarSign />} label="Total earnings" value={formatCurrency(stats.total_earnings)} />
          <StatCard icon={<CalendarCheck />} label="Completed cuts" value={stats.completed_haircuts ?? 0} />
          <StatCard icon={<Scissors />} label="Cut + beard" value={stats.haircut_beard_count ?? 0} />
          <StatCard icon={<UsersRound />} label="Customers" value={stats.active_customers ?? 0} />
        </section>

        <section className="mt-6 rounded-[2rem] border border-line bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Today&apos;s bookings</h2>
              <p className="text-sm text-muted">Loaded first and limited for fast admin entry.</p>
            </div>
            <Clock className="text-barber-blue-strong" />
          </div>
          <div className="mt-4 divide-y divide-line">
            {todaysBookings.length ? (
              todaysBookings.map((booking) => (
                <article key={booking.id} className="grid gap-2 py-4 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
                  <div>
                    <p className="font-semibold">{booking.profiles?.full_name ?? "Customer"}</p>
                    <p className="text-sm text-muted">{booking.profiles?.phone ?? "No phone"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">{serviceLabels[booking.service_type]}</p>
                    <p className="text-sm text-muted">
                      {formatBookingDate(booking.date_time)} at {formatBookingTime(booking.date_time)}
                    </p>
                  </div>
                  <Link
                    href={`/admin/bookings/${booking.id}/complete`}
                    className="w-fit rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background"
                  >
                    Open
                  </Link>
                </article>
              ))
            ) : (
              <p className="py-8 text-center text-muted">No bookings today.</p>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

function formatCurrency(value: number | string | null | undefined) {
  return `$${Number(value ?? 0).toFixed(0)}`;
}

async function fetchDashboardStats(supabase: Awaited<ReturnType<typeof getSupabaseOrNull>>) {
  console.time("stats fetch");
  const result = await supabase!.rpc("admin_dashboard_stats").single<AdminDashboardStats>();
  console.timeEnd("stats fetch");

  return {
    data:
      result.data ??
      ({
        total_earnings: 0,
        month_earnings: 0,
        completed_haircuts: 0,
        haircut_only_count: 0,
        haircut_beard_count: 0,
        active_customers: 0,
      } satisfies AdminDashboardStats),
    error: result.error,
  };
}

async function fetchTodaysBookings(
  supabase: Awaited<ReturnType<typeof getSupabaseOrNull>>,
  startOfToday: Date,
  endOfToday: Date,
) {
  console.time("bookings fetch");
  const result = await supabase!
    .from("bookings")
    .select("id, service_type, date_time, status, duration_minutes, profiles(full_name, phone)")
    .gte("date_time", startOfToday.toISOString())
    .lte("date_time", endOfToday.toISOString())
    .in("status", ["pending", "confirmed"])
    .order("date_time", { ascending: true })
    .limit(12)
    .returns<DashboardBooking[]>();
  console.timeEnd("bookings fetch");

  return result;
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-3xl bg-surface p-5 ring-1 ring-line">
      <div className="text-barber-blue-strong">{icon}</div>
      <p className="mt-4 text-sm text-muted">{label}</p>
      <p className="text-3xl font-semibold">{value}</p>
    </div>
  );
}
