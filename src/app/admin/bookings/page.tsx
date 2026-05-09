import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { formatBookingDate, formatBookingTime } from "@/lib/business-logic";
import { serviceLabels } from "@/lib/config";
import { getSessionProfile, getSupabaseOrNull } from "@/lib/data";
import type { Booking } from "@/lib/types";

export default async function AdminBookingsPage() {
  const { profile } = await getSessionProfile();
  if (profile?.role !== "admin") {
    redirect("/");
  }

  const supabase = await getSupabaseOrNull();
  const { data: bookings } = await supabase!
    .from("bookings")
    .select("*, profiles(full_name, email, phone, avatar_url)")
    .order("date_time", { ascending: true })
    .returns<Booking[]>();

  return (
    <>
      <SiteHeader profile={profile} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
              Admin
            </p>
            <h1 className="text-3xl font-semibold">Bookings</h1>
          </div>
          <Link href="/admin" className="rounded-full bg-barber-blue px-4 py-2 text-sm font-semibold">
            Stats
          </Link>
        </div>

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
          </div>
        </div>
      </main>
    </>
  );
}
