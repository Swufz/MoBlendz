import { unstable_noStore as noStore } from "next/cache";
import { defaultAdminSettings } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminSettings, Booking, DiscountCredit, Loyalty, Profile } from "@/lib/types";

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
