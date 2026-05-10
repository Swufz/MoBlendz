"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { buildReferralLink, normalizeReferralCode } from "@/lib/referrals";

export function ReferralCard({
  activeCredits,
  referralCode,
}: {
  activeCredits?: number;
  referralCode: string;
}) {
  const [origin, setOrigin] = useState<string | null>(null);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const code = normalizeReferralCode(referralCode);
  const link = useMemo(() => buildReferralLink(code, origin), [code, origin]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  async function copy(value: string, type: "code" | "link") {
    await navigator.clipboard.writeText(value);
    setCopied(type);
    window.setTimeout(() => setCopied(null), 1800);
  }

  return (
    <section
      id="referral"
      className="rounded-3xl border border-gold/30 bg-gold/10 p-5 luxury-glow scroll-mt-28"
    >
      <p className="text-xs font-black uppercase tracking-[0.2em] text-gold">
        Refer a friend
      </p>
      <h2 className="mt-3 text-2xl font-black">Give $5, get $5.</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        When your friend completes their first cut, you both get $5 off your
        next cut.
      </p>

      <div className="mt-5 grid gap-3">
        <div className="rounded-2xl border border-line bg-background p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
            Referral code
          </p>
          <p className="mt-2 text-3xl font-black tracking-[0.18em] text-gold">
            {code}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-background p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
            Referral link
          </p>
          <p className="mt-2 break-all text-sm font-semibold text-foreground">
            {link}
          </p>
        </div>
      </div>

      {typeof activeCredits === "number" ? (
        <p className="mt-3 text-sm text-muted">
          Active $5 credits: <span className="font-black text-gold">{activeCredits}</span>
        </p>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => copy(code, "code")}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line bg-background px-4 text-sm font-black transition hover:border-gold/60"
        >
          {copied === "code" ? <Check size={17} /> : <Copy size={17} />}
          Copy Code
        </button>
        <button
          type="button"
          onClick={() => copy(link, "link")}
          className="gold-gradient inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-black"
        >
          {copied === "link" ? <Check size={17} /> : <Copy size={17} />}
          Copy Link
        </button>
      </div>

      {copied ? (
        <p className="mt-3 text-sm font-bold text-success">
          {copied === "code" ? "Referral code copied." : "Referral link copied."}
        </p>
      ) : null}
    </section>
  );
}
