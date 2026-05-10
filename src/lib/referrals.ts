export function normalizeReferralCode(value: string) {
  return value.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

export function baseReferralCodeFromName(name: string) {
  const [firstName] = name.trim().split(/\s+/);
  const base = normalizeReferralCode(firstName || name);
  return base || "CLIENT";
}

export function buildReferralLink(code: string, origin?: string | null) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    origin?.replace(/\/$/, "") ||
    "https://www.moblendz.co";

  return `${base}/?ref=${encodeURIComponent(normalizeReferralCode(code))}`;
}
