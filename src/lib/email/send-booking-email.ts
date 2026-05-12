import { Resend } from "resend";
import { serviceLabels } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Booking, Profile } from "@/lib/types";

type BookingEmailArgs = {
  booking: Booking;
  profile: Profile;
};

const timezone = "America/Los_Angeles";

export async function sendBookingConfirmationEmails({
  booking,
  profile,
}: BookingEmailArgs) {
  if (process.env.EMAIL_ENABLED !== "true") {
    console.log("Email disabled. Skipping booking emails.");
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!apiKey || !from) {
    console.warn("Booking emails skipped: RESEND_API_KEY or EMAIL_FROM is missing.");
    return;
  }

  const resend = new Resend(apiKey);
  const supabase = await createSupabaseServerClient();
  const { data: currentBooking, error } = await supabase
    .from("bookings")
    .select("id, customer_email_sent_at, admin_email_sent_at")
    .eq("id", booking.id)
    .maybeSingle<Pick<Booking, "id" | "customer_email_sent_at" | "admin_email_sent_at">>();

  if (error) {
    console.warn("Booking emails skipped: could not check email status.", error.message);
    return;
  }

  const dateTime = formatBookingDateTime(booking.date_time);
  const service = serviceLabels[booking.service_type];
  const cashDue = Number(
    booking.final_price ??
      Math.max(0, Number(booking.base_price) - Number(booking.discount_amount ?? 0)),
  );
  const cashDueText = formatCashAmount(cashDue);

  if (profile.email && !currentBooking?.customer_email_sent_at) {
    try {
      await resend.emails.send({
        from,
        to: profile.email,
        subject: "MoBlendz appointment confirmed",
        text: [
          "Your MoBlendz appointment is confirmed.",
          "",
          `Service: ${service}`,
          `Date/Time: ${dateTime}`,
          `Cash due: $${cashDueText}`,
          "",
          "Pay cash when you arrive.",
        ].join("\n"),
      });

      await supabase
        .from("bookings")
        .update({ customer_email_sent_at: new Date().toISOString() })
        .eq("id", booking.id)
        .is("customer_email_sent_at", null);
    } catch (sendError) {
      console.error("Customer booking email failed.", sendError);
    }
  }

  if (adminEmail && !currentBooking?.admin_email_sent_at) {
    try {
      await resend.emails.send({
        from,
        to: adminEmail,
        subject: "New MoBlendz booking",
        text: [
          "New booking received.",
          "",
          `Customer: ${profile.full_name}`,
          `Email: ${profile.email}`,
            `Phone: ${profile.phone ?? "No phone"}`,
            `Service: ${service}`,
            `Date/Time: ${dateTime}`,
            `Cash due: $${cashDueText}`,
          ].join("\n"),
        });

      await supabase
        .from("bookings")
        .update({ admin_email_sent_at: new Date().toISOString() })
        .eq("id", booking.id)
        .is("admin_email_sent_at", null);
    } catch (sendError) {
      console.error("Admin booking email failed.", sendError);
    }
  } else if (!adminEmail) {
    console.warn("Admin booking email skipped: ADMIN_EMAIL is missing.");
  }
}

function formatBookingDateTime(value: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).formatToParts(new Date(value));

  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${getPart("weekday")}, ${getPart("month")} ${getPart("day")} at ${getPart(
    "hour",
  )}:${getPart("minute")} ${getPart("dayPeriod")}`;
}

function formatCashAmount(value: number) {
  return value.toFixed(2).replace(/\.00$/, "");
}
