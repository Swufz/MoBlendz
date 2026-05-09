import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { formatBookingDate, formatBookingTime } from "@/lib/business-logic";
import { serviceLabels } from "@/lib/config";
import { getSessionProfile, getSupabaseOrNull } from "@/lib/data";
import type { Booking, BookingStatus } from "@/lib/types";

type AdminBookingRow = Pick<
  Booking,
  "id" | "service_type" | "date_time" | "status" | "duration_minutes" | "base_price"
> & {
  profiles?: {
    full_name: string;
    email: string;
    phone: string | null;
  } | null;
};

const validStatuses: BookingStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  console.time("admin bookings auth check");
  const { profile } = await getSessionProfile();
  console.timeEnd("admin bookings auth check");

  console.time("admin bookings profile role check");
  if (profile?.role !== "admin") {
    console.timeEnd("admin bookings profile role check");
    redirect("/");
  }
  console.timeEnd("admin bookings profile role check");

  const { q = "", status = "all", page = "1" } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const pageSize = 50;
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    redirect("/");
  }

  console.time("bookings fetch");
  let query = supabase
    .from("bookings")
    .select("id, service_type, date_time, status, duration_minutes, base_price, profiles(full_name, email, phone)", {
      count: "exact",
    })
    .order("date_time", { ascending: status === "upcoming" })
    .range(from, to);

  if (status === "upcoming") {
    query = query
      .in("status", ["pending", "confirmed"])
      .gte("date_time", new Date().toISOString());
  } else if (validStatuses.includes(status as BookingStatus)) {
    query = query.eq("status", status);
  }

  if (q.trim()) {
    query = query.or(
      `profiles.full_name.ilike.%${q}%,profiles.email.ilike.%${q}%,profiles.phone.ilike.%${q}%`,
    );
  }

  const { data: bookings, error, count } = await query.returns<AdminBookingRow[]>();
  console.timeEnd("bookings fetch");

  return (
    <>
      <SiteHeader profile={profile} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
              Admin
            </p>
            <h1 className="text-3xl font-semibold">Bookings</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/admin" className="rounded-full bg-barber-blue px-4 py-2 text-sm font-semibold">
              Dashboard
            </Link>
            <Link href="/admin/customers" className="rounded-full bg-surface px-4 py-2 text-sm font-semibold ring-1 ring-line">
              Customers
            </Link>
          </div>
        </div>

        <form className="mt-6 grid gap-3 rounded-[2rem] border border-line bg-surface p-4 sm:grid-cols-[1fr_auto_auto]">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, phone, or email"
            className="h-11 rounded-full border border-line bg-background px-4"
          />
          <select
            name="status"
            defaultValue={status}
            className="h-11 rounded-full border border-line bg-background px-4"
          >
            <option value="all">All latest</option>
            <option value="upcoming">Upcoming</option>
            {validStatuses.map((bookingStatus) => (
              <option key={bookingStatus} value={bookingStatus}>
                {bookingStatus}
              </option>
            ))}
          </select>
          <button className="h-11 rounded-full bg-foreground px-5 font-semibold text-background">
            Filter
          </button>
        </form>

        {error ? (
          <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">
            Bookings could not load: {error.message}
          </p>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-[2rem] border border-line bg-surface">
          <div className="grid grid-cols-[1.2fr_1fr_0.8fr_0.7fr] gap-3 border-b border-line px-5 py-3 text-sm font-semibold text-muted max-md:hidden">
            <span>Customer</span>
            <span>Booking</span>
            <span>Status</span>
            <span></span>
          </div>
          <div className="divide-y divide-line">
            {(bookings ?? []).map((booking) => (
              <article
                key={booking.id}
                className="grid gap-3 px-5 py-4 md:grid-cols-[1.2fr_1fr_0.8fr_0.7fr] md:items-center"
              >
                <div>
                  <p className="font-semibold">{booking.profiles?.full_name ?? "Customer"}</p>
                  <p className="text-sm text-muted">{booking.profiles?.phone ?? booking.profiles?.email}</p>
                </div>
                <div>
                  <p className="font-semibold">{serviceLabels[booking.service_type]}</p>
                  <p className="text-sm text-muted">
                    {formatBookingDate(booking.date_time)} at {formatBookingTime(booking.date_time)}
                  </p>
                </div>
                <span className="w-fit rounded-full bg-background px-3 py-1 text-xs font-semibold">
                  {booking.status}
                </span>
                <div className="md:text-right">
                  {booking.status === "pending" || booking.status === "confirmed" ? (
                    <Link
                      href={`/admin/bookings/${booking.id}/complete`}
                      className="inline-flex rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background"
                    >
                      Complete
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
            {!bookings?.length ? (
              <p className="px-5 py-10 text-center text-muted">No bookings found.</p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          <span>Showing up to {pageSize} of {count ?? 0} results</span>
          <div className="flex gap-2">
            {currentPage > 1 ? (
              <Link className="rounded-full bg-surface px-4 py-2 ring-1 ring-line" href={`/admin/bookings?q=${q}&status=${status}&page=${currentPage - 1}`}>
                Previous
              </Link>
            ) : null}
            {(count ?? 0) > to + 1 ? (
              <Link className="rounded-full bg-surface px-4 py-2 ring-1 ring-line" href={`/admin/bookings?q=${q}&status=${status}&page=${currentPage + 1}`}>
                Next
              </Link>
            ) : null}
          </div>
        </div>
      </main>
    </>
  );
}
