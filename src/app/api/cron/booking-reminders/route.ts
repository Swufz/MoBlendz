import { NextResponse } from "next/server";
import { sendBookingReminderEmails } from "@/lib/email/send-booking-email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Booking, Profile } from "@/lib/types";

type ReminderBooking = Booking & {
  profiles?: Pick<Profile, "full_name" | "email" | "phone"> | null;
};

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const now = Date.now();
  const windowStart = new Date(now + 23 * 60 * 60 * 1000);
  const windowEnd = new Date(now + 25 * 60 * 60 * 1000);

  console.log("booking reminder cron started", {
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
  });

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      [
        "id",
        "user_id",
        "service_type",
        "base_price",
        "final_price",
        "discount_type",
        "discount_amount",
        "date_time",
        "duration_minutes",
        "status",
        "notes",
        "cancelled_at",
        "completed_at",
        "customer_email_sent_at",
        "admin_email_sent_at",
        "customer_reminder_email_sent_at",
        "admin_reminder_email_sent_at",
        "created_at",
        "updated_at",
        "profiles(full_name, email, phone)",
      ].join(", "),
    )
    .in("status", ["pending", "confirmed"])
    .gte("date_time", windowStart.toISOString())
    .lt("date_time", windowEnd.toISOString())
    .or(
      "customer_reminder_email_sent_at.is.null,admin_reminder_email_sent_at.is.null",
    )
    .order("date_time", { ascending: true })
    .returns<ReminderBooking[]>();

  if (error) {
    console.error("booking reminder cron failed to load bookings", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(`booking reminder cron found ${bookings?.length ?? 0} bookings`);

  const results = [];

  for (const booking of bookings ?? []) {
    const profile = normalizeProfile(booking.profiles);

    if (!profile) {
      console.warn("booking reminder skipped: missing profile", {
        bookingId: booking.id,
      });
      results.push({ bookingId: booking.id, status: "missing_profile" });
      continue;
    }

    console.log("booking reminder processing", {
      bookingId: booking.id,
      customerEmail: profile.email,
      adminEmail: process.env.ADMIN_EMAIL,
      customerReminderSent: Boolean(booking.customer_reminder_email_sent_at),
      adminReminderSent: Boolean(booking.admin_reminder_email_sent_at),
    });

    try {
      await sendBookingReminderEmails({ booking, profile, supabase });
      results.push({ bookingId: booking.id, status: "processed" });
    } catch (sendError) {
      console.error("booking reminder processing failed", {
        bookingId: booking.id,
        error: sendError,
      });
      results.push({ bookingId: booking.id, status: "error" });
    }
  }

  return NextResponse.json({
    ok: true,
    found: bookings?.length ?? 0,
    results,
  });
}

function normalizeProfile(
  profile:
    | Pick<Profile, "full_name" | "email" | "phone">
    | Pick<Profile, "full_name" | "email" | "phone">[]
    | null
    | undefined,
) {
  if (Array.isArray(profile)) {
    return profile[0] ?? null;
  }

  return profile ?? null;
}
