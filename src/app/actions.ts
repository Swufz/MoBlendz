"use server";

import { addMinutes } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  calculateCompletionSummary,
  combineDateAndTime,
  createReferralCode,
  getDefaultAvatarUrl,
  isWithinBusinessHours,
  rangesOverlap,
} from "@/lib/business-logic";
import { getServiceDuration, getServicePrice } from "@/lib/config";
import { getAdminSettings } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Booking, DiscountCredit, Loyalty, Profile } from "@/lib/types";

const bookingSchema = z.object({
  serviceType: z.enum(["haircut", "haircut_beard"]),
  date: z.string().min(1),
  time: z.string().min(1),
  notes: z.string().max(500).optional(),
  phone: z.string().max(30).optional(),
});

const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Name is required.").max(120),
  phone: z.string().trim().min(1, "Phone number is required."),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

const weeklyAvailabilitySchema = z.object({
  days: z.array(
    z.object({
      day_of_week: z.number().int().min(0).max(6),
      is_available: z.boolean(),
      start_time: z.string().regex(/^\d{2}:\d{2}$/),
      end_time: z.string().regex(/^\d{2}:\d{2}$/),
      break_start: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
      break_end: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
    }),
  ),
});

const blockedTimeSchema = z.object({
  date: z.string().min(1),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  all_day: z.boolean(),
  reason: z.string().max(200).optional(),
});

export async function signOut() {
  const supabase = await getConfiguredSupabaseClient();
  if (!supabase) {
    redirect("/");
  }
  await supabase.auth.signOut();
  redirect("/");
}

export async function createBooking(formData: FormData) {
  const parsed = bookingSchema.safeParse({
    serviceType: formData.get("serviceType"),
    date: formData.get("date"),
    time: formData.get("time"),
    notes: formData.get("notes")?.toString() ?? "",
    phone: formData.get("phone")?.toString() ?? "",
  });

  if (!parsed.success) {
    return { ok: false, message: "Please choose a service, date, and time." };
  }

  const supabase = await getConfiguredSupabaseClient();
  if (!supabase) {
    return {
      ok: false,
      message:
        "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
    };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, authRequired: true, message: "Sign in with Google to book." };
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle<Profile>();

  const fullName =
    user.user_metadata?.full_name ?? user.user_metadata?.name ?? "Mo Blendz Client";
  const email = user.email ?? "";
  const avatarUrl =
    user.user_metadata?.avatar_url ??
    user.user_metadata?.picture ??
    getDefaultAvatarUrl(fullName);

  let profile = existingProfile;
  if (!profile) {
    const { data: insertedProfile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        auth_user_id: user.id,
        full_name: fullName,
        email,
        phone: parsed.data.phone || null,
        avatar_url: avatarUrl,
        role: "customer",
        referral_code: createReferralCode(`${fullName}${user.id}`),
      })
      .select("*")
      .single<Profile>();

    if (profileError) {
      return { ok: false, message: profileError.message };
    }

    profile = insertedProfile;
  } else if (parsed.data.phone && !profile.phone) {
    const { data: updatedProfile, error: phoneError } = await supabase
      .from("profiles")
      .update({ phone: parsed.data.phone, updated_at: new Date().toISOString() })
      .eq("id", profile.id)
      .select("*")
      .single<Profile>();

    if (phoneError) {
      return { ok: false, message: phoneError.message };
    }

    profile = updatedProfile;
  }

  if (!profile.phone) {
    return {
      ok: false,
      phoneRequired: true,
      message: "Add your phone number before confirming.",
    };
  }

  const settings = await getAdminSettings();
  const { getWeeklyAvailability } = await import("@/lib/data");
  const weeklyAvailability = await getWeeklyAvailability();
  const startsAt = combineDateAndTime(parsed.data.date, parsed.data.time);
  const duration = getServiceDuration(parsed.data.serviceType, settings);

  if (!isWithinBusinessHours(startsAt, duration, settings, weeklyAvailability)) {
    return { ok: false, message: "That time is outside available business hours." };
  }

  const rangeEnd = addMinutes(startsAt, duration).toISOString();
  const [{ data: possibleConflicts }, { data: blockedTimes }] = await Promise.all([
    supabase
      .from("bookings")
      .select("*")
      .in("status", ["pending", "confirmed"])
      .lt("date_time", rangeEnd)
      .returns<Booking[]>(),
    supabase
      .from("blocked_times")
      .select("date, start_time, end_time, all_day, starts_at, ends_at")
      .or(
        `and(date.eq.${parsed.data.date}),and(starts_at.lt.${rangeEnd},ends_at.gt.${startsAt.toISOString()})`,
      )
      .returns<{
        date?: string;
        start_time?: string | null;
        end_time?: string | null;
        all_day?: boolean;
        starts_at?: string | null;
        ends_at?: string | null;
      }[]>(),
  ]);

  const hasConflict = (possibleConflicts ?? []).some((booking) =>
    rangesOverlap(
      startsAt,
      duration,
      new Date(booking.date_time),
      booking.duration_minutes,
    ),
  );

  const isBlocked = (blockedTimes ?? []).some((block) => {
    if (block.starts_at && block.ends_at) {
      return rangesOverlap(startsAt, duration, new Date(block.starts_at), (new Date(block.ends_at).getTime() - new Date(block.starts_at).getTime()) / 60000);
    }

    if (block.all_day) {
      return true;
    }

    if (block.start_time && block.end_time) {
      const blockStart = combineDateAndTime(parsed.data.date, block.start_time.slice(0, 5));
      const blockEnd = combineDateAndTime(parsed.data.date, block.end_time.slice(0, 5));
      return rangesOverlap(startsAt, duration, blockStart, (blockEnd.getTime() - blockStart.getTime()) / 60000);
    }

    return false;
  });

  if (hasConflict || isBlocked) {
    return { ok: false, message: "That time is unavailable. Pick another slot." };
  }

  const basePrice = getServicePrice(parsed.data.serviceType, settings);

  const { data: booking, error } = await supabase.from("bookings").insert({
    user_id: profile.id,
    service_type: parsed.data.serviceType,
    base_price: basePrice,
    final_price: null,
    discount_type: "none",
    discount_amount: 0,
    date_time: startsAt.toISOString(),
    duration_minutes: duration,
    status: "pending",
    notes: parsed.data.notes || null,
  }).select("*").single<Booking>();

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/");
  revalidatePath("/booking");
  revalidatePath("/profile");
  return {
    ok: true,
    booking: {
      id: booking.id,
      serviceType: booking.service_type,
      dateTime: booking.date_time,
      finalPrice: basePrice,
      status: booking.status,
      durationMinutes: booking.duration_minutes,
    },
  };
}

export async function cancelBooking(bookingId: string) {
  const supabase = await getConfiguredSupabaseClient();
  if (!supabase) {
    redirect("/login");
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle<Profile>();

  if (!profile) {
    redirect("/login");
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("user_id", profile.id)
    .in("status", ["pending", "confirmed"])
    .maybeSingle<Booking>();

  if (!booking) {
    return;
  }

  const settings = await getAdminSettings();
  const cutoff = addMinutes(new Date(), settings.cancellation_window_hours * 60);
  if (!settings.allow_customer_cancellation || new Date(booking.date_time) < cutoff) {
    throw new Error("This booking can no longer be cancelled online.");
  }

  await supabase.from("bookings").update({
    status: "cancelled",
    updated_at: new Date().toISOString(),
  }).eq("id", booking.id);

  revalidatePath("/profile");
}

export async function adminCancelBooking(bookingId: string) {
  const supabase = await getConfiguredSupabaseClient();
  if (!supabase) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "You must be logged in as admin." };
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("auth_user_id", user.id)
    .eq("role", "admin")
    .maybeSingle<Pick<Profile, "id" | "role">>();

  if (!adminProfile) {
    return { ok: false, message: "Only admins can cancel bookings." };
  }

  const cancelledAt = new Date().toISOString();
  const { data: updatedBooking, error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_at: cancelledAt,
      updated_at: cancelledAt,
    })
    .eq("id", bookingId)
    .in("status", ["pending", "confirmed"])
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    const fallback = await supabase
      .from("bookings")
      .update({
        status: "cancelled",
        updated_at: cancelledAt,
      })
      .eq("id", bookingId)
      .in("status", ["pending", "confirmed"])
      .select("id")
      .maybeSingle<{ id: string }>();

    if (fallback.error) {
      return { ok: false, message: fallback.error.message };
    }

    if (!fallback.data) {
      return {
        ok: false,
        message: "This booking is no longer active or was already cancelled.",
      };
    }
  } else if (!updatedBooking) {
    return {
      ok: false,
      message: "This booking is no longer active or was already cancelled.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  return { ok: true, message: "Booking cancelled." };
}

export async function updateMyProfile(formData: FormData) {
  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    avatarUrl: formData.get("avatarUrl")?.toString() ?? "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Profile details are invalid.",
    };
  }

  const normalizedPhone = normalizeUsPhone(parsed.data.phone);
  if (!normalizedPhone) {
    return {
      ok: false,
      message: "Enter a valid 10-digit US phone number.",
    };
  }

  const supabase = await getConfiguredSupabaseClient();
  if (!supabase) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "You must be logged in to edit your profile." };
  }

  const updatePayload: {
    full_name: string;
    phone: string;
    updated_at: string;
    avatar_url?: string;
  } = {
    full_name: parsed.data.fullName,
    phone: normalizedPhone,
    updated_at: new Date().toISOString(),
  };

  if (parsed.data.avatarUrl) {
    updatePayload.avatar_url = parsed.data.avatarUrl;
  }

  const { error } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("auth_user_id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/");
  revalidatePath("/profile");
  return { ok: true, message: "Profile updated." };
}

export async function saveWeeklyAvailability(formData: FormData) {
  const supabase = await getConfiguredSupabaseClient();
  if (!supabase) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "You must be logged in as admin." };
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("auth_user_id", user.id)
    .eq("role", "admin")
    .maybeSingle<Pick<Profile, "id" | "role">>();

  if (!adminProfile) {
    return { ok: false, message: "Only admins can update availability." };
  }

  const days = Array.from({ length: 7 }).map((_, day) => ({
    day_of_week: day,
    is_available: formData.get(`day-${day}-available`) === "on",
    start_time: formData.get(`day-${day}-start`)?.toString() ?? "15:00",
    end_time: formData.get(`day-${day}-end`)?.toString() ?? "20:00",
    break_start: formData.get(`day-${day}-break-start`)?.toString() ?? "",
    break_end: formData.get(`day-${day}-break-end`)?.toString() ?? "",
  }));

  const parsed = weeklyAvailabilitySchema.safeParse({ days });
  if (!parsed.success) {
    return { ok: false, message: "Availability details are invalid." };
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("weekly_availability").upsert(
    parsed.data.days.map((day) => ({
      ...day,
      break_start: day.break_start || null,
      break_end: day.break_end || null,
      updated_at: now,
    })),
    { onConflict: "day_of_week" },
  );

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/availability");
  revalidatePath("/booking");
  return { ok: true, message: "Weekly availability saved." };
}

export async function addBlockedTime(formData: FormData) {
  const supabase = await getConfiguredSupabaseClient();
  if (!supabase) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "You must be logged in as admin." };
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("auth_user_id", user.id)
    .eq("role", "admin")
    .maybeSingle<Pick<Profile, "id" | "role">>();

  if (!adminProfile) {
    return { ok: false, message: "Only admins can block time." };
  }

  const parsed = blockedTimeSchema.safeParse({
    date: formData.get("date"),
    start_time: formData.get("start_time")?.toString() ?? "",
    end_time: formData.get("end_time")?.toString() ?? "",
    all_day: formData.get("all_day") === "on",
    reason: formData.get("reason")?.toString() ?? "",
  });

  if (!parsed.success) {
    return { ok: false, message: "Blocked time details are invalid." };
  }

  if (!parsed.data.all_day && (!parsed.data.start_time || !parsed.data.end_time)) {
    return { ok: false, message: "Choose start and end time, or mark all day." };
  }

  const { error } = await supabase.from("blocked_times").insert({
    date: parsed.data.date,
    start_time: parsed.data.all_day ? null : parsed.data.start_time,
    end_time: parsed.data.all_day ? null : parsed.data.end_time,
    all_day: parsed.data.all_day,
    reason: parsed.data.reason || null,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/availability");
  revalidatePath("/booking");
  return { ok: true, message: "Blocked time added." };
}

export async function deleteBlockedTime(blockedTimeId: string) {
  const supabase = await getConfiguredSupabaseClient();
  if (!supabase) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const { error } = await supabase.from("blocked_times").delete().eq("id", blockedTimeId);
  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/availability");
  revalidatePath("/booking");
  return { ok: true, message: "Blocked time removed." };
}

export async function completeBooking(bookingId: string, formData: FormData) {
  const manualFinal = Number(formData.get("manualFinal") || NaN);
  const supabase = await getConfiguredSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .eq("role", "admin")
    .maybeSingle<Profile>();

  if (!adminProfile) {
    redirect("/");
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle<Booking>();

  if (bookingError || !booking) {
    return {
      ok: false,
      message: bookingError?.message ?? "Booking not found.",
    };
  }

  if (booking.status === "completed") {
    return {
      ok: true,
      message: "This booking was already completed. No changes were made.",
      redirectTo: "/admin/bookings",
    };
  }

  const settings = await getAdminSettings();
  const { data: loyalty } = await supabase
    .from("loyalty")
    .select("*")
    .eq("user_id", booking.user_id)
    .maybeSingle<Loyalty>();
  const currentLoyalty =
    loyalty ??
    ({
      user_id: booking.user_id,
      paid_haircuts_since_last_free: 0,
      free_haircuts_available: 0,
      total_free_haircuts_used: 0,
    } as Loyalty);

  const { data: credit } = await supabase
    .from("discount_credits")
    .select("*")
    .eq("user_id", booking.user_id)
    .eq("status", "unused")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<DiscountCredit>();

  const summary = calculateCompletionSummary({
    booking,
    loyalty: currentLoyalty,
    referralCredit: credit,
    settings,
  });
  const finalPrice = Number.isFinite(manualFinal) ? manualFinal : summary.finalCashDue;
  const completedAt = new Date().toISOString();

  const { data: updatedBooking, error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "completed",
      final_price: finalPrice,
      discount_type: summary.freeHaircutApplied
        ? "free_haircut"
        : summary.referralCreditApplied
          ? "referral"
          : "none",
      discount_amount: summary.discountAmount,
      completed_at: completedAt,
    })
    .eq("id", booking.id)
    .neq("status", "completed")
    .select("id")
    .maybeSingle<{ id: string }>();

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  if (!updatedBooking) {
    return {
      ok: true,
      message: "This booking was already completed. No loyalty or credits were changed.",
      redirectTo: "/admin/bookings",
    };
  }

  const { error: historyError } = await supabase.from("haircut_history").insert({
    user_id: booking.user_id,
    booking_id: booking.id,
    service_type: booking.service_type,
    base_price: booking.base_price,
    discount_amount: summary.discountAmount,
    final_price: finalPrice,
    was_free_haircut: summary.freeHaircutApplied,
    used_referral_credit: summary.referralCreditApplied,
    completed_at: completedAt,
  });

  if (historyError) {
    if (historyError.code === "23505") {
      return {
        ok: true,
        message: "This booking already has haircut history. No duplicate progress was added.",
        redirectTo: "/admin/bookings",
      };
    }

    return { ok: false, message: historyError.message };
  }

  await supabase.from("loyalty").upsert({
    user_id: booking.user_id,
    paid_haircuts_since_last_free: summary.loyaltyAfter,
    free_haircuts_available: summary.freeHaircutsAvailableAfter,
    total_free_haircuts_used:
      (currentLoyalty.total_free_haircuts_used ?? 0) +
      (summary.freeHaircutApplied ? 1 : 0),
    updated_at: completedAt,
  }, { onConflict: "user_id" });

  if (summary.referralCreditApplied && credit) {
    await supabase.from("discount_credits").update({
      status: "used",
      used_booking_id: booking.id,
      used_at: completedAt,
    }).eq("id", credit.id);
  }

  await rewardFirstCompletedReferral(booking.user_id, settings.referral_discount_amount);

  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${booking.id}/complete`);
  return {
    ok: true,
    message: "Booking completed successfully.",
    redirectTo: "/admin/bookings?completed=1",
  };
}

function normalizeUsPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) {
    return digits;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }

  return null;
}

async function rewardFirstCompletedReferral(userId: string, amount: number) {
  const supabase = await getConfiguredSupabaseClient();
  if (!supabase) {
    return;
  }
  const { count } = await supabase
    .from("haircut_history")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (count !== 1) {
    return;
  }

  const { data: referral } = await supabase
    .from("referrals")
    .select("*")
    .eq("referred_user_id", userId)
    .eq("status", "pending")
    .maybeSingle<{ id: string; referrer_user_id: string; referred_user_id: string }>();

  if (!referral || referral.referrer_user_id === referral.referred_user_id) {
    return;
  }

  const createdAt = new Date().toISOString();
  await supabase.from("discount_credits").insert([
    {
      user_id: referral.referrer_user_id,
      type: "referral",
      amount,
      status: "unused",
      source_referral_id: referral.id,
      created_at: createdAt,
    },
    {
      user_id: referral.referred_user_id,
      type: "referral",
      amount,
      status: "unused",
      source_referral_id: referral.id,
      created_at: createdAt,
    },
  ]);

  await supabase.from("referrals").update({
    status: "rewarded",
    completed_at: createdAt,
  }).eq("id", referral.id);
}

async function getConfiguredSupabaseClient() {
  try {
    return await createSupabaseServerClient();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Missing NEXT_PUBLIC_SUPABASE")
    ) {
      return null;
    }

    throw error;
  }
}
