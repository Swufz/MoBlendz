import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck, DollarSign, Scissors, UsersRound } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { getSessionProfile, getSupabaseOrNull } from "@/lib/data";

export default async function AdminPage() {
  const { profile } = await getSessionProfile();
  if (profile?.role !== "admin") {
    redirect("/");
  }

  const supabase = await getSupabaseOrNull();
  const [{ count: completedCount }, { count: customerCount }, { data: history }] =
    await Promise.all([
      supabase!
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed"),
      supabase!
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "customer"),
      supabase!
        .from("haircut_history")
        .select("final_price, service_type")
        .order("completed_at", { ascending: false }),
    ]);

  const earnings =
    history?.reduce((total, row) => total + Number(row.final_price ?? 0), 0) ?? 0;
  const beardCount = history?.filter((row) => row.service_type === "haircut_beard").length ?? 0;

  return (
    <>
      <SiteHeader profile={profile} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
              Admin dashboard
            </p>
            <h1 className="text-3xl font-semibold">Business overview</h1>
          </div>
          <div className="flex gap-2">
            <Link className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background" href="/admin/bookings">
              Bookings
            </Link>
            <Link className="rounded-full bg-barber-blue px-4 py-2 text-sm font-semibold" href="/admin/settings">
              Settings
            </Link>
          </div>
        </div>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<DollarSign />} label="Total earnings" value={`$${earnings}`} />
          <StatCard icon={<CalendarCheck />} label="Completed cuts" value={completedCount ?? 0} />
          <StatCard icon={<Scissors />} label="Cut + beard" value={beardCount} />
          <StatCard icon={<UsersRound />} label="Customers" value={customerCount ?? 0} />
        </section>
      </main>
    </>
  );
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
