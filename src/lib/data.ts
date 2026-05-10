import { unstable_noStore as noStore } from "next/cache";
import { defaultAdminSettings, defaultWeeklyAvailability } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminSettings, BlockedTime, Booking, DiscountCredit, Loyalty, Profile, WeeklyAvailability } from "@/lib/types";

export async function getSupabaseOrNull() {
  try {
    return await createSupabaseServerClient();
  } catch {
    return null;
  }
}

export async function getSessionProfile() {
  noStore();
  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return { user: null, profile: null };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle<Profile>();

  return { user, profile };
}

export async function getAdminSettings() {
  noStore();
  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return defaultAdminSettings;
  }

  const { data } = await supabase
    .from("admin_settings")
    .select("*")
    .limit(1)
    .maybeSingle<AdminSettings>();

  return data ?? defaultAdminSettings;
}

export async function getMyLoyalty(userId?: string | null) {
  noStore();
  if (!userId) {
    return null;
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("loyalty")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle<Loyalty>();

  return data;
}

export async function getMyBookings(userId?: string | null) {
  noStore();
  if (!userId) {
    return [];
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", userId)
    .order("date_time", { ascending: true })
    .returns<Booking[]>();

  return data ?? [];
}

export async function getUnusedReferralCredits(userId?: string | null) {
  noStore();
  if (!userId) {
    return [];
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("discount_credits")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "unused")
    .order("created_at", { ascending: true })
    .returns<DiscountCredit[]>();

  return data ?? [];
}

export async function getWeeklyAvailability() {
  noStore();
  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return defaultWeeklyAvailability.map((item, index) => ({
      ...item,
      id: `default-${index}`,
      created_at: new Date(0).toISOString(),
      updated_at: new Date(0).toISOString(),
    })) satisfies WeeklyAvailability[];
  }

  const { data } = await supabase
    .from("weekly_availability")
    .select("id, day_of_week, is_available, start_time, end_time, break_start, break_end, created_at, updated_at")
    .order("day_of_week", { ascending: true })
    .returns<WeeklyAvailability[]>();

  if (data?.length) {
    return data;
  }

  return defaultWeeklyAvailability.map((item, index) => ({
    ...item,
    id: `default-${index}`,
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  })) satisfies WeeklyAvailability[];
}

export async function getBlockedTimes() {
  noStore();
  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("blocked_times")
    .select("id, date, start_time, end_time, all_day, reason, starts_at, ends_at, created_at, updated_at")
    .order("date", { ascending: true })
    .returns<BlockedTime[]>();

  return data ?? [];
}

export async function getActiveBookingsForAvailability() {
  noStore();
  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("bookings")
    .select("id, user_id, service_type, base_price, final_price, discount_type, discount_amount, date_time, duration_minutes, status, notes, cancelled_at, completed_at, created_at, updated_at")
    .in("status", ["pending", "confirmed"])
    .gte("date_time", new Date().toISOString())
    .returns<Booking[]>();

  return data ?? [];
}
