import { NextResponse } from "next/server";
import { createReferralCode, getDefaultAvatarUrl } from "@/lib/business-logic";
import { baseReferralCodeFromName } from "@/lib/referrals";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const fullName =
        user.user_metadata?.full_name ?? user.user_metadata?.name ?? "Mo Blendz Client";
      const email = user.email ?? "";
      const avatarUrl =
        user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? getDefaultAvatarUrl(fullName);

      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (!existing) {
        const referralCode = await getUniqueReferralCode(supabase, fullName);
        await supabase.from("profiles").insert({
          auth_user_id: user.id,
          full_name: fullName,
          email,
          phone: null,
          avatar_url: avatarUrl,
          role: "customer",
          referral_code: referralCode,
        });
      }
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

async function getUniqueReferralCode(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  fullName: string,
) {
  const baseCode = baseReferralCodeFromName(fullName);
  const { data, error } = await supabase.rpc("generate_referral_code", {
    base_code: baseCode,
  });

  if (!error && typeof data === "string" && data) {
    return data;
  }

  return createReferralCode(`${baseCode}${crypto.randomUUID()}`);
}
