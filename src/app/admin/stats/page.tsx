import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck, DollarSign, Scissors, TrendingUp } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { getSessionProfile, getSupabaseOrNull } from "@/lib/data";

type AdminDashboardStats = {
  total_earnings: number;
  month_earnings: number;
  completed_haircuts: number;
  haircut_only_count: number;
  haircut_beard_count: number;
  active_customers: number;
};

export default async function AdminStatsPage() {
  console.time("admin stats auth check");
  const { profile } = await getSessionProfile();
  console.timeEnd("admin stats auth check");

  console.time("admin stats profile role check");
  if (profile?.role !== "admin") {
    console.timeEnd("admin stats profile role check");
    redirect("/");
  }
  console.timeEnd("admin stats profile role check");

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    redirect("/");
  }

  console.time("stats fetch");
  const { data, error } = await supabase
    .rpc("admin_dashboard_stats")
    .single<AdminDashboardStats>();
  console.timeEnd("stats fetch");

  const stats =
    data ??
    ({
      total_earnings: 0,
      month_earnings: 0,
      completed_haircuts: 0,
      haircut_only_count: 0,
      haircut_beard_count: 0,
      active_customers: 0,
    } satisfies AdminDashboardStats);

  return (
    <>
      <SiteHeader profile={profile} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
              Admin stats
            </p>
            <h1 className="text-3xl font-semibold">Performance</h1>
          </div>
          <Link href="/admin" className="rounded-md bg-barber-blue px-4 py-2 text-sm font-semibold">
            Dashboard
          </Link>
        </div>

        {error ? (
          <p className="mt-4 rounded-md bg-red-50 p-4 text-sm font-medium text-red-700">
            Stats could not load: {error.message}
          </p>
        ) : null}

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard icon={<DollarSign />} label="Total earnings" value={formatCurrency(stats.total_earnings)} />
          <StatCard icon={<TrendingUp />} label="Monthly earnings" value={formatCurrency(stats.month_earnings)} />
          <StatCard icon={<CalendarCheck />} label="Completed haircuts" value={stats.completed_haircuts ?? 0} />
          <StatCard icon={<Scissors />} label="Haircut only" value={stats.haircut_only_count ?? 0} />
          <StatCard icon={<Scissors />} label="Haircut + beard" value={stats.haircut_beard_count ?? 0} />
          <StatCard icon={<CalendarCheck />} label="Active customers" value={stats.active_customers ?? 0} />
        </section>
      </main>
    </>
  );
}

function formatCurrency(value: number | string | null | undefined) {
  return `$${Number(value ?? 0).toFixed(0)}`;
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
    <div className="rounded-lg bg-surface p-5 ring-1 ring-line">
      <div className="text-barber-blue-strong">{icon}</div>
      <p className="mt-4 text-sm text-muted">{label}</p>
      <p className="text-3xl font-semibold">{value}</p>
    </div>
  );
}
