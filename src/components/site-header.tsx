import Link from "next/link";
import { CalendarDays, Menu, UserRound } from "lucide-react";
import { BRAND_NAME } from "@/lib/config";
import type { Profile } from "@/lib/types";

export function SiteHeader({ profile }: { profile?: Profile | null }) {
  const isAdmin = profile?.role === "admin";

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <button
          type="button"
          aria-label="Open menu"
          className="grid size-10 place-items-center rounded-full border border-line bg-surface text-foreground"
        >
          <Menu size={20} />
        </button>

        <Link href="/" className="text-lg font-semibold tracking-[0.08em]">
          {BRAND_NAME}
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            aria-label="Booking"
            href="/booking"
            className="hidden size-10 place-items-center rounded-full bg-foreground text-background sm:grid"
          >
            <CalendarDays size={18} />
          </Link>
          {isAdmin ? (
            <Link className="text-sm font-medium" href="/admin">
              Admin
            </Link>
          ) : null}
          <Link
            href={profile ? "/profile" : "/login"}
            aria-label={profile ? "Open profile" : "Login"}
            className="grid size-10 place-items-center overflow-hidden rounded-full bg-barber-blue text-foreground"
          >
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <UserRound size={18} />
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
