import { NextResponse } from "next/server";
import { createReferralCode, getDefaultAvatarUrl } from "@/lib/business-logic";
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
        await supabase.from("profiles").insert({
          auth_user_id: user.id,
          full_name: fullName,
          email,
          phone: null,
          avatar_url: avatarUrl,
          role: "customer",
          referral_code: createReferralCode(`${fullName}${user.id}`),
        });
      }
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
