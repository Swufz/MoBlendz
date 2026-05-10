import type { ReactNode } from "react";

export function DarkCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`luxury-glow rounded-[2rem] border border-line bg-surface ${className}`}>
      {children}
    </div>
  );
}

export function GoldButton({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`gold-gradient inline-flex h-12 items-center justify-center rounded-full px-5 text-sm font-bold shadow-[0_10px_35px_rgba(214,168,79,0.25)] ${className}`}>
      {children}
    </span>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  copy,
}: {
  eyebrow?: string;
  title: string;
  copy?: string;
}) {
  return (
    <div>
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {copy ? <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{copy}</p> : null}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "completed"
      ? "border-success/40 bg-success/10 text-success"
      : status === "cancelled" || status === "no_show"
        ? "border-danger/40 bg-danger/10 text-danger"
        : "border-gold/40 bg-gold/10 text-gold";

  return (
    <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold capitalize ${tone}`}>
      {status.replace("_", " ")}
    </span>
  );
}
