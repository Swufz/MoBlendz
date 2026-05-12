export function LoyaltyProgressCard({
  className = "",
  completed,
  freeHaircutsAvailable = 0,
  required = 5,
}: {
  className?: string;
  completed: number;
  freeHaircutsAvailable?: number;
  required?: number;
}) {
  const paidNeeded = Math.max(1, required - 1);
  const clamped = Math.min(completed, paidNeeded);
  const progressPercent = freeHaircutsAvailable
    ? 100
    : Math.round((clamped / paidNeeded) * 100);

  return (
    <section
      className={`rounded-lg border border-line bg-surface p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)] ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold uppercase tracking-normal text-foreground">
            FREE CUT PROGRESS
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
