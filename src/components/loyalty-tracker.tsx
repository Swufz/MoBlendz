export function LoyaltyProgressCard({
  className = "",
  completed,
  freeHaircutsAvailable = 0,
  required = 5,
  variant = "personal",
}: {
  className?: string;
  completed: number;
  freeHaircutsAvailable?: number;
  required?: number;
  variant?: "personal" | "promo";
}) {
  const paidNeeded = Math.max(1, required - 1);
  const clamped = Math.min(completed, paidNeeded);
  const progressPercent = freeHaircutsAvailable
    ? 100
    : Math.round((clamped / paidNeeded) * 100);

  if (variant === "promo") {
    return (
      <section
        className={`rounded-lg border border-gold/30 bg-surface/95 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.34)] backdrop-blur ${className}`}
      >
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted">
          LOYALTY REWARD
        </p>
        <div className="mt-3 flex items-center gap-2 text-sm font-extrabold uppercase text-foreground">
          <span>{paidNeeded} PAID CUTS</span>
          <span className="text-gold">-&gt;</span>
          <span className="rounded-md bg-gold px-2 py-1 text-background">
            {formatOrdinal(required)} CUT FREE
          </span>
        </div>
        <div
          className="mt-4 grid items-center gap-1.5"
          style={{ gridTemplateColumns: `repeat(${paidNeeded}, minmax(0, 1fr)) auto` }}
        >
          {Array.from({ length: paidNeeded }).map((_, index) => (
            <span
              key={index}
              className="h-2 rounded-full border border-line bg-secondary-card"
            />
          ))}
          <span className="rounded-md border border-gold/45 bg-gold/10 px-2 py-1 text-[11px] font-extrabold uppercase text-gold">
            Free
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted">
          Your progress starts after your first paid visit.
        </p>
      </section>
    );
  }

  return (
    <section
      className={`rounded-lg border border-line bg-surface p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)] ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold uppercase tracking-normal text-foreground">
            YOUR FREE CUT PROGRESS
          </h2>
        </div>
        <div className="text-right">
          {freeHaircutsAvailable ? (
            <span className="inline-flex rounded-md border border-gold/35 bg-gold/10 px-2 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-gold">
              FREE CUT AVAILABLE
            </span>
          ) : (
            <span className="text-sm font-extrabold text-gold">
              {clamped}/{paidNeeded}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-secondary-card">
        <div
          className="h-full rounded-full bg-gold shadow-[0_0_18px_rgba(214,168,79,0.42)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <p className="mt-3 text-sm leading-6 text-muted">
        Your 5th cut is <span className="font-bold text-foreground">FREE</span>{" "}
        after 4 paid visits.
      </p>
    </section>
  );
}

function formatOrdinal(value: number) {
  const suffix = value % 10 === 1 && value % 100 !== 11
    ? "ST"
    : value % 10 === 2 && value % 100 !== 12
      ? "ND"
      : value % 10 === 3 && value % 100 !== 13
        ? "RD"
        : "TH";

  return `${value}${suffix}`;
}

export function LoyaltyTracker({
  completed,
  freeHaircutsAvailable = 0,
  required = 5,
}: {
  completed: number;
  freeHaircutsAvailable?: number;
  required?: number;
}) {
  return (
    <LoyaltyProgressCard
      completed={completed}
      freeHaircutsAvailable={freeHaircutsAvailable}
      required={required}
    />
  );
}
