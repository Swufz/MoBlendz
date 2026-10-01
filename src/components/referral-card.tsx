"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Link as LinkIcon, UsersRound } from "lucide-react";
import { buildReferralLink, normalizeReferralCode } from "@/lib/referrals";

export function ReferralCard({
  activeCredits,
  referralCode,
  dashboard = false,
}: {
  activeCredits?: number;
  referralCode: string;
  dashboard?: boolean;
}) {
  const [origin, setOrigin] = useState<string | null>(null);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [copyError, setCopyError] = useState(false);
  const code = normalizeReferralCode(referralCode);
  const link = useMemo(() => buildReferralLink(code, origin), [code, origin]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
  }, []);

  async function copy(value: string, type: "code" | "link") {
    try {
      await navigator.clipboard.writeText(value);
      setCopyError(false);
      setCopied(type);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopyError(true);
    }
  }

  return (
    <section
      id="referral"
      className={`scroll-mt-28 rounded-lg border border-line bg-surface p-5 ${dashboard ? "account-referral" : ""}`}
    >
      {dashboard ? <span className="account-icon referral-icon" aria-hidden="true"><UsersRound size={25} strokeWidth={1.5} /></span> : null}
      {dashboard ? <span className="referral-decoration" aria-hidden="true"><UsersRound size={37} strokeWidth={1} /><span>$5</span></span> : null}
      <p className="text-sm font-semibold text-muted">
        Refer a friend
      </p>
      <h2 className="mt-2 text-2xl font-semibold">Give $5, get $5.</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        When your friend completes their first cut, you both get $5 off your
        next cut.
      </p>

      <div className={dashboard ? "referral-balance" : "mt-5 grid gap-3"}>
        <div className="rounded-md border border-line bg-background p-4">
          <p className="text-sm font-semibold text-muted">
            Your referral code
          </p>
          <p className="mt-2 text-2xl font-semibold text-gold">
            {code || "Not available"}
          </p>
        </div>
        <div className="rounded-md border border-line bg-background p-4">
          <p className="text-sm font-semibold text-muted">
            {dashboard ? "Available credits" : "Referral link"}
          </p>
          <p className="mt-2 break-all text-sm font-semibold text-foreground">
            {dashboard ? `$${(activeCredits ?? 0) * 5}` : link}
          </p>
        </div>
      </div>

      {!dashboard && typeof activeCredits === "number" ? (
        <p className="mt-3 text-sm text-muted">
          Active $5 credits: <span className="font-semibold text-gold">{activeCredits}</span>
        </p>
      ) : null}

      <div className={`mt-5 grid gap-3 sm:grid-cols-2 ${dashboard ? "referral-actions" : ""}`}>
        <button
          type="button"
          disabled={!code}
          onClick={() => copy(code, "code")}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-background px-3 text-sm font-semibold transition hover:border-gold/60"
        >
          {copied === "code" ? <Check size={17} /> : <Copy size={17} />}
          {copied === "code" ? "Copied!" : "Copy Code"}
        </button>
        <button
          type="button"
          disabled={!code}
          onClick={() => copy(link, "link")}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-gold px-3 text-sm font-semibold text-background"
        >
          {copied === "link" ? <Check size={17} /> : <LinkIcon size={17} />}
          {copied === "link" ? "Copied!" : "Copy Referral Link"}
        </button>
      </div>

      {copied ? (
        <p role="status" className="mt-3 text-sm font-bold text-success">
          {copied === "code" ? "Referral code copied." : "Referral link copied."}
        </p>
      ) : null}
      {copyError ? <p role="alert" className="mt-3 break-all text-sm text-foreground">Couldn&apos;t copy. Select and copy this link: {link}</p> : null}
    </section>
  );
}
