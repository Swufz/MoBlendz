import { redirect } from "next/navigation";
import { CompleteBookingForm } from "@/components/complete-booking-form";
import { SiteHeader } from "@/components/site-header";
import { calculateCompletionSummary, formatBookingDate, formatBookingTime } from "@/lib/business-logic";
import { getAdminSettings, getSessionProfile, getSupabaseOrNull } from "@/lib/data";
import type { Booking, DiscountCredit, Loyalty, Profile } from "@/lib/types";

export default async function CompleteBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await getSessionProfile();
  if (profile?.role !== "admin") {
    redirect("/");
  }

  const supabase = await getSupabaseOrNull();
  const { data: booking } = await supabase!
    .from("bookings")
    .select("id, user_id, service_type, base_price, final_price, discount_type, discount_amount, date_time, duration_minutes, status, notes, completed_at, created_at, updated_at, profiles(full_name, email, phone, avatar_url)")
    .eq("id", id)
    .maybeSingle<Booking>();

  if (!booking) {
    redirect("/admin/bookings");
  }

  const [settings, loyaltyResponse, creditResponse] = await Promise.all([
    getAdminSettings(),
    supabase!
      .from("loyalty")
      .select("id, user_id, paid_haircuts_since_last_free, free_haircuts_available, total_free_haircuts_used, updated_at")
      .eq("user_id", booking.user_id)
      .maybeSingle<Loyalty>(),
    supabase!
      .from("discount_credits")
      .select("id, user_id, type, amount, status, source_referral_id, used_booking_id, created_at, used_at")
      .eq("user_id", booking.user_id)
      .eq("status", "unused")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle<DiscountCredit>(),
  ]);
  const loyalty =
    loyaltyResponse.data ??
    ({
      paid_haircuts_since_last_free: 0,
      free_haircuts_available: 0,
    } as Loyalty);
  const hasBookingReferralDiscount =
    booking.discount_type === "referral" && Number(booking.discount_amount) > 0;
  const summary = calculateCompletionSummary({
    booking,
    loyalty,
    referralCredit: hasBookingReferralDiscount ? null : creditResponse.data,
    settings,
  });
  const referralDiscountAmount =
    hasBookingReferralDiscount && !summary.freeHaircutApplied
      ? Number(booking.discount_amount)
      : summary.referralCreditAmount;
  const finalCashDue =
    hasBookingReferralDiscount && !summary.freeHaircutApplied
      ? Math.max(0, Number(booking.base_price) - referralDiscountAmount)
      : summary.finalCashDue;
  const customer = booking.profiles as Profile | undefined;

  return (
    <>
      <SiteHeader profile={profile} />
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
            Confirm completion
          </p>
          <h1 className="text-3xl font-semibold">Review cash due before saving</h1>
          <p className="mt-2 text-muted">
            This is the required confirmation summary before the booking is marked completed.
          </p>
        </div>

        <section className="mt-6 rounded-lg border border-line bg-surface p-5 shadow-sm">
          <div className="border-b border-line pb-4">
            <p className="text-sm text-muted">Customer</p>
            <p className="text-xl font-semibold">{customer?.full_name ?? "Customer"}</p>
            <p className="text-sm text-muted">
              {formatBookingDate(booking.date_time)} at {formatBookingTime(booking.date_time)}
            </p>
          </div>
          <dl className="mt-5 grid gap-3">
            <SummaryRow label="Service booked" value={summary.serviceLabel} />
            <SummaryRow label="Base price" value={`$${summary.basePrice}`} />
            <SummaryRow
              label="Loyalty/free haircut status"
              value={summary.freeHaircutApplied ? "Free haircut applied" : "No free haircut used"}
            />
            <SummaryRow
              label="Referral credit applied"
              value={
                hasBookingReferralDiscount
                  ? `$${referralDiscountAmount} referral discount`
                  : summary.referralCreditApplied
                    ? `$${summary.referralCreditAmount} credit`
                  : "No referral credit"
              }
            />
            <SummaryRow label="Final cash amount due" value={`$${finalCashDue}`} strong />
            <SummaryRow
              label="Updated loyalty progress after completion"
              value={`${summary.loyaltyAfter}/${settings.loyalty_required_haircuts - 1} paid cuts`}
            />
          </dl>

          <CompleteBookingForm
            bookingId={booking.id}
            defaultFinalPrice={finalCashDue}
          />
        </section>
      </main>
    </>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md bg-background px-4 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className={strong ? "text-2xl font-semibold" : "font-semibold"}>{value}</dd>
    </div>
  );
}
