export function AdminPageSkeleton({
  title = "Loading admin",
}: {
  title?: string;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="h-4 w-32 animate-pulse rounded-md bg-line" />
      <div className="mt-3 h-9 w-64 animate-pulse rounded-md bg-line" />
      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-lg bg-surface p-5 ring-1 ring-line">
            <div className="size-7 animate-pulse rounded-md bg-line" />
            <div className="mt-4 h-4 w-24 animate-pulse rounded-md bg-line" />
            <div className="mt-3 h-8 w-20 animate-pulse rounded-md bg-line" />
          </div>
        ))}
      </section>
      <section className="mt-6 rounded-lg border border-line bg-surface p-5">
        <div className="h-5 w-40 animate-pulse rounded-md bg-line" />
        <p className="sr-only">{title}</p>
        <div className="mt-5 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-md bg-background" />
          ))}
        </div>
      </section>
    </main>
  );
}
