import type { ReactNode } from "react";

export function DarkCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-line bg-surface ${className}`}>
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
    <span className={`inline-flex h-10 items-center justify-center rounded-md bg-gold px-4 text-sm font-semibold text-background ${className}`}>
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
        <p className="text-sm font-semibold text-muted">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-1 text-2xl font-semibold text-foreground sm:text-3xl">
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
    <span className={`w-fit rounded-md border px-2 py-1 text-xs font-semibold capitalize ${tone}`}>
      {status.replace("_", " ")}
    </span>
  );
}
