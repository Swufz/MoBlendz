import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getSessionProfile, getSupabaseOrNull } from "@/lib/data";

type CustomerRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  referral_code: string;
  created_at: string;
  loyalty?: {
    paid_haircuts_since_last_free: number;
    free_haircuts_available: number;
  } | null;
};

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  console.time("admin customers auth check");
  const { profile } = await getSessionProfile();
  console.timeEnd("admin customers auth check");

  console.time("admin customers profile role check");
  if (profile?.role !== "admin") {
    console.timeEnd("admin customers profile role check");
    redirect("/");
  }
  console.timeEnd("admin customers profile role check");

  const { q = "", page = "1" } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const pageSize = 50;
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    redirect("/");
  }

  console.time("customers fetch");
  let query = supabase
    .from("profiles")
    .select("id, full_name, email, phone, referral_code, created_at, loyalty(paid_haircuts_since_last_free, free_haircuts_available)", {
      count: "exact",
    })
    .eq("role", "customer")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q.trim()) {
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  const { data: customers, error, count } = await query.returns<CustomerRow[]>();
  console.timeEnd("customers fetch");

  return (
    <>
      <SiteHeader profile={profile} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
              Admin
            </p>
            <h1 className="text-3xl font-semibold">Customers</h1>
          </div>
          <Link href="/admin" className="rounded-md bg-barber-blue px-4 py-2 text-sm font-semibold">
            Dashboard
          </Link>
        </div>

        <form className="mt-6 grid gap-3 rounded-lg border border-line bg-surface p-4 sm:grid-cols-[1fr_auto]">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, phone, or email"
            className="h-11 rounded-md border border-line bg-background px-4"
          />
          <button className="h-11 rounded-md bg-foreground px-5 font-semibold text-background">
            Search
          </button>
        </form>

        {error ? (
          <p className="mt-4 rounded-md bg-red-50 p-4 text-sm font-medium text-red-700">
            Customers could not load: {error.message}
          </p>
        ) : null}

        <section className="mt-6 overflow-hidden rounded-lg border border-line bg-surface">
          <div className="grid grid-cols-[1.2fr_1fr_0.8fr_0.8fr] gap-3 border-b border-line px-5 py-3 text-sm font-semibold text-muted max-md:hidden">
            <span>Customer</span>
            <span>Phone</span>
            <span>Loyalty</span>
            <span>Referral</span>
          </div>
          <div className="divide-y divide-line">
            {(customers ?? []).map((customer) => (
              <article key={customer.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1.2fr_1fr_0.8fr_0.8fr]">
                <div>
                  <p className="font-semibold">{customer.full_name}</p>
                  <p className="text-sm text-muted">{customer.email}</p>
                </div>
                <p className="text-sm text-muted">{customer.phone ?? "Missing phone"}</p>
                <p className="text-sm font-semibold">
                  {customer.loyalty?.paid_haircuts_since_last_free ?? 0}/4
                  {customer.loyalty?.free_haircuts_available ? " · free available" : ""}
                </p>
                <p className="text-sm font-semibold tracking-[0.12em]">{customer.referral_code}</p>
              </article>
            ))}
            {!customers?.length ? (
              <p className="px-5 py-10 text-center text-muted">No customers found.</p>
            ) : null}
          </div>
        </section>

        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          <span>Showing up to {pageSize} of {count ?? 0} customers</span>
          <div className="flex gap-2">
            {currentPage > 1 ? (
              <Link className="rounded-md bg-surface px-4 py-2 ring-1 ring-line" href={`/admin/customers?q=${q}&page=${currentPage - 1}`}>
                Previous
              </Link>
            ) : null}
            {(count ?? 0) > to + 1 ? (
              <Link className="rounded-md bg-surface px-4 py-2 ring-1 ring-line" href={`/admin/customers?q=${q}&page=${currentPage + 1}`}>
                Next
              </Link>
            ) : null}
          </div>
        </div>
      </main>
    </>
  );
}
