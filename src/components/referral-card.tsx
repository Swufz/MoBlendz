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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      className="scroll-mt-28 rounded-lg border border-line bg-surface p-5"
    >
      <p className="text-sm font-semibold text-muted">
        Refer a friend
      </p>
      <h2 className="mt-2 text-2xl font-semibold">Give $5, get $5.</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        When your friend completes their first cut, you both get $5 off your
        next cut.
      </p>

      <div className="mt-5 grid gap-3">
        <div className="rounded-md border border-line bg-background p-4">
          <p className="text-sm font-semibold text-muted">
            Referral code
          </p>
          <p className="mt-2 text-2xl font-semibold text-gold">
            {code}
          </p>
        </div>
        <div className="rounded-md border border-line bg-background p-4">
          <p className="text-sm font-semibold text-muted">
            Referral link
          </p>
          <p className="mt-2 break-all text-sm font-semibold text-foreground">
            {link}
          </p>
        </div>
      </div>

      {typeof activeCredits === "number" ? (
        <p className="mt-3 text-sm text-muted">
          Active $5 credits: <span className="font-semibold text-gold">{activeCredits}</span>
        </p>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => copy(code, "code")}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-background px-3 text-sm font-semibold transition hover:border-gold/60"
        >
          {copied === "code" ? <Check size={17} /> : <Copy size={17} />}
          Copy Code
        </button>
        <button
          type="button"
          onClick={() => copy(link, "link")}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-gold px-3 text-sm font-semibold text-background"
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
