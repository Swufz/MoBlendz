import { Star } from "lucide-react";

export function LoyaltyTracker({
  completed,
  required = 5,
}: {
  completed: number;
  required?: number;
}) {
  const paidNeeded = Math.max(1, required - 1);
  const clamped = Math.min(completed, paidNeeded);

  return (
    <section className="rounded-lg border border-line bg-surface p-5 ">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
        Loyalty Rewards
      </p>
      <h2 className="mt-2 text-2xl font-semibold">Track to FREE haircut</h2>
      <div className="mt-4 flex items-center gap-3">
        {Array.from({ length: paidNeeded }).map((_, index) => {
          const filled = index < clamped;
          return (
            <Star
              key={index}
              size={34}
              className={filled ? "fill-gold text-gold" : "text-secondary-card"}
            />
          );
        })}
      </div>
      <p className="mt-4 text-sm text-muted">
        <span className="font-semibold text-foreground">{clamped}</span> of{" "}
        {paidNeeded} paid cuts completed
      </p>
    </section>
  );
}
