import { Resend } from "resend";
import { serviceLabels } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Booking, Profile } from "@/lib/types";

type BookingEmailArgs = {
  booking: Booking;
  profile: Profile;
};

type BookingEmailView = {
  service: string;
  date: string;
  time: string;
  dateTime: string;
  cashDue: string;
  status: string;
  referralDiscount: string | null;
  notes: string | null;
};

const timezone = "America/Los_Angeles";
const locationLines = ["238 Hayes Street", "Irvine, CA 92620"];

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

  const emailView = createBookingEmailView(booking);

  if (profile.email && !currentBooking?.customer_email_sent_at) {
    try {
      const { error: sendError } = await resend.emails.send({
        from,
        to: profile.email,
        subject: "Your MoBlendz appointment is confirmed",
        html: renderCustomerBookingEmail(emailView),
        text: renderCustomerBookingText(emailView),
      });

      if (sendError) {
        throw sendError;
      }

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
      const { error: sendError } = await resend.emails.send({
        from,
        to: adminEmail,
        subject: "New MoBlendz booking",
        html: renderAdminBookingEmail(emailView, profile),
        text: renderAdminBookingText(emailView, profile),
      });

      if (sendError) {
        throw sendError;
      }

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

export function renderCustomerBookingEmail(emailView: BookingEmailView) {
  return renderShell(`
    <p style="${badgeStyle}">MoBlendz booking</p>
    <h1 style="${headingStyle}">Appointment confirmed</h1>
    <p style="${bodyStyle}">You're booked. Please arrive at your scheduled time and pay cash when you arrive.</p>
    ${renderDetailsCard([
      ["Service", emailView.service],
      ["Date", emailView.date],
      ["Time", emailView.time],
      ...(emailView.referralDiscount
        ? [["Referral discount applied", `-${emailView.referralDiscount}`] as [string, string]]
        : []),
      ["Cash due", `$${emailView.cashDue}`],
      ["Status", emailView.status],
    ])}
    ${renderLocationBlock()}
    <p style="${smallTextStyle}">Please arrive at your scheduled appointment time.</p>
    <p style="${smallTextStyle}">If you need to cancel or change your appointment, contact MoBlendz as soon as possible.</p>
  `);
}

export function renderAdminBookingEmail(
  emailView: BookingEmailView,
  profile: Profile,
) {
  return renderShell(`
    <p style="${badgeStyle}">Admin notification</p>
    <h1 style="${headingStyle}">New booking received.</h1>
    ${renderDetailsCard([
      ["Customer", profile.full_name],
      ["Email", profile.email],
      ["Phone", profile.phone ?? "No phone"],
      ["Service", emailView.service],
      ["Date/Time", emailView.dateTime],
      ...(emailView.referralDiscount
        ? [["Referral discount", `-${emailView.referralDiscount}`] as [string, string]]
        : []),
      ["Cash due", `$${emailView.cashDue}`],
      ["Status", emailView.status],
      ...(emailView.notes ? [["Notes", emailView.notes] as [string, string]] : []),
    ])}
    ${renderLocationBlock()}
  `);
}

function renderCustomerBookingText(emailView: BookingEmailView) {
  return [
    "Your MoBlendz appointment is confirmed.",
    "",
    "You're booked. Please arrive at your scheduled time and pay cash when you arrive.",
    "",
    `Service: ${emailView.service}`,
    `Date: ${emailView.date}`,
    `Time: ${emailView.time}`,
    ...(emailView.referralDiscount
      ? [`Referral discount applied: -${emailView.referralDiscount}`]
      : []),
    `Cash due: $${emailView.cashDue}`,
    `Status: ${emailView.status}`,
    "",
    "Location:",
    ...locationLines,
    "",
    "Please arrive at your scheduled appointment time.",
    "If you need to cancel or change your appointment, contact MoBlendz as soon as possible.",
    "",
    "MoBlendz - Private cuts by appointment.",
  ].join("\n");
}

function renderAdminBookingText(emailView: BookingEmailView, profile: Profile) {
  return [
    "New booking received.",
    "",
    `Customer: ${profile.full_name}`,
    `Email: ${profile.email}`,
    `Phone: ${profile.phone ?? "No phone"}`,
    `Service: ${emailView.service}`,
    `Date/Time: ${emailView.dateTime}`,
    ...(emailView.referralDiscount
      ? [`Referral discount: -${emailView.referralDiscount}`]
      : []),
    `Cash due: $${emailView.cashDue}`,
    `Status: ${emailView.status}`,
    ...(emailView.notes ? [`Notes: ${emailView.notes}`] : []),
    "",
    "Location:",
    ...locationLines,
  ].join("\n");
}

function createBookingEmailView(booking: Booking): BookingEmailView {
  const cashDue = Number(
    booking.final_price ??
      Math.max(0, Number(booking.base_price) - Number(booking.discount_amount ?? 0)),
  );
  const discountAmount = Number(booking.discount_amount ?? 0);

  return {
    service: formatServiceName(booking.service_type),
    date: formatBookingDate(booking.date_time),
    time: formatBookingTime(booking.date_time),
    dateTime: formatBookingDateTime(booking.date_time),
    cashDue: formatCashAmount(cashDue),
    status: formatStatus(booking.status),
    referralDiscount:
      booking.discount_type === "referral" && discountAmount > 0
        ? `$${formatCashAmount(discountAmount)}`
        : null,
    notes: booking.notes,
  };
}

function renderShell(content: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#080A09;padding:24px 12px;font-family:Inter,Arial,sans-serif;color:#F7F1E5;">
    <div style="display:none;max-height:0;overflow:hidden;">MoBlendz booking confirmation</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:collapse;background:#121514;border:1px solid rgba(214,168,79,0.25);border-radius:24px;overflow:hidden;box-shadow:0 22px 60px rgba(0,0,0,0.45);">
            <tr>
              <td style="padding:28px 24px 12px;">
                <div style="font-family:Georgia,serif;font-size:32px;line-height:1;color:#F0C978;letter-spacing:0.3px;">MoBlendz</div>
                <div style="height:1px;background:linear-gradient(90deg,#D6A84F,rgba(214,168,79,0));margin-top:18px;"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 24px 28px;">
                ${content}
                <div style="height:1px;background:rgba(214,168,79,0.18);margin:26px 0 18px;"></div>
                <p style="${footerStyle}">MoBlendz &mdash; Private cuts by appointment.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderDetailsCard(rows: [string, string][]) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;background:#1C201D;border:1px solid rgba(214,168,79,0.22);border-radius:18px;margin:24px 0;overflow:hidden;">
      ${rows
        .map(
          ([label, value]) => `
          <tr>
            <td style="padding:14px 16px;border-bottom:1px solid rgba(247,241,229,0.08);font-size:13px;line-height:1.4;color:#A9A39A;">${escapeHtml(label)}</td>
            <td align="right" style="padding:14px 16px;border-bottom:1px solid rgba(247,241,229,0.08);font-size:15px;line-height:1.4;color:#F7F1E5;font-weight:700;">${escapeHtml(value)}</td>
          </tr>`,
        )
        .join("")}
    </table>`;
}

function renderLocationBlock() {
  return `
    <div style="background:#0B0D0C;border:1px solid rgba(214,168,79,0.18);border-radius:18px;padding:18px;margin:22px 0;">
      <p style="margin:0 0 8px;color:#D6A84F;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;">Location</p>
      <p style="margin:0;color:#F7F1E5;font-size:16px;line-height:1.55;">238 Hayes Street<br />Irvine, CA 92620</p>
    </div>`;
}

export function formatBookingDateTime(value: string) {
  return `${formatBookingDate(value)} at ${formatBookingTime(value)}`;
}

function formatBookingDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatBookingTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatServiceName(serviceType: Booking["service_type"]) {
  return serviceLabels[serviceType];
}

function formatStatus(status: Booking["status"]) {
  return status
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatCashAmount(value: number) {
  return value.toFixed(2).replace(/\.00$/, "");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const badgeStyle =
  "display:inline-block;margin:0 0 14px;padding:7px 10px;border-radius:999px;background:rgba(214,168,79,0.12);border:1px solid rgba(214,168,79,0.35);color:#F0C978;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;";
const headingStyle =
  "margin:0 0 12px;color:#F7F1E5;font-size:30px;line-height:1.12;font-weight:900;letter-spacing:0;";
const bodyStyle =
  "margin:0;color:#A9A39A;font-size:16px;line-height:1.6;";
const smallTextStyle =
  "margin:12px 0 0;color:#A9A39A;font-size:14px;line-height:1.55;";
const footerStyle =
  "margin:0;color:#A9A39A;font-size:13px;line-height:1.5;text-align:center;";
