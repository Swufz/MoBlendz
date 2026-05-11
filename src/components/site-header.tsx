"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { CalendarDays, Crown, Home, Menu, Scissors, Star, UserRound, X } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { BRAND_NAME } from "@/lib/config";
import type { Profile } from "@/lib/types";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/#services", label: "Services", icon: Scissors },
];

const customerNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/book", label: "Book", icon: CalendarDays },
  { href: "/bookings", label: "My Bookings", icon: CalendarDays },
  { href: "/profile", label: "Profile", icon: UserRound },
];

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: Crown },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/admin/customers", label: "Customers", icon: UserRound },
  { href: "/admin/stats", label: "Stats", icon: Star },
  { href: "/admin/availability", label: "Availability", icon: CalendarDays },
  { href: "/admin/settings", label: "Settings", icon: Scissors },
];

export function SiteHeader({ profile }: { profile?: Profile | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  const isAdmin = profile?.role === "admin";
  const isCustomer = profile?.role === "customer";
  const desktopNavItems = isAdmin ? adminNavItems : isCustomer ? customerNavItems : navItems;
  const mobileNavItems = isAdmin ? adminNavItems : isCustomer ? customerNavItems : navItems;
  const referralCode = searchParams.get("ref");
  const bookingHref = referralCode
    ? `/booking?ref=${encodeURIComponent(referralCode)}`
    : "/booking";
  const navBookingHref = referralCode
    ? `/book?ref=${encodeURIComponent(referralCode)}`
    : "/book";
  const profileHref = isAdmin ? "/admin" : profile ? "/profile" : "/login";
  const ctaHref = isCustomer ? navBookingHref : bookingHref;
  const bottomNavItems = isAdmin
    ? [
        { href: "/admin", label: "Dashboard", icon: Crown },
        { href: "/admin/bookings", label: "Bookings", icon: CalendarDays },
        { href: "/admin/stats", label: "Stats", icon: Star },
        { href: "/admin/customers", label: "Customers", icon: UserRound },
      ]
    : isCustomer
      ? [
          { href: "/", label: "Home", icon: Home },
          { href: navBookingHref, label: "Book", icon: CalendarDays },
          { href: "/bookings", label: "Bookings", icon: Star },
          { href: "/profile", label: "Profile", icon: UserRound },
        ]
      : [
          { href: "/", label: "Home", icon: Home },
          { href: bookingHref, label: "Book", icon: CalendarDays },
          { href: "/#services", label: "Services", icon: Scissors },
          { href: "/login", label: "Sign In", icon: UserRound },
        ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-background">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setIsOpen(true)}
              className="grid size-10 place-items-center rounded-md border border-line bg-surface text-foreground lg:hidden"
            >
              <Menu size={20} />
            </button>
            <Link href="/" className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-md border border-line bg-surface text-gold">
                <Crown size={22} />
              </span>
              <span className="font-brand text-3xl text-foreground">
                {BRAND_NAME}
              </span>
            </Link>
          </div>

          <nav className="hidden items-center gap-7 lg:flex">
            {desktopNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-muted transition hover:text-gold"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {profile ? (
              <LogoutButton className="hidden h-10 rounded-md border border-line bg-surface px-3 text-sm font-semibold text-muted transition hover:text-foreground lg:inline-flex lg:items-center" />
            ) : null}
            {!isAdmin ? (
              <Link
                href={ctaHref}
                className="hidden h-10 items-center rounded-md bg-gold px-4 text-sm font-semibold text-background sm:inline-flex"
              >
                {isCustomer ? "Book" : "Book Now"}
              </Link>
            ) : null}
            <Link
              href={profileHref}
              aria-label={profile ? (isAdmin ? "Open admin dashboard" : "Open profile") : "Login"}
              className="grid size-10 place-items-center overflow-hidden rounded-md border border-line bg-secondary-card text-gold"
            >
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="" className="size-full object-cover" />
              ) : (
                <UserRound size={19} />
              )}
            </Link>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-50 bg-black/60 transition lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsOpen(false)}
      />
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-72 max-w-[85vw] border-r border-line bg-surface p-4 shadow-sm transition-transform lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
            <span className="grid size-9 place-items-center rounded-md border border-line bg-background text-gold">
              <Crown size={20} />
            </span>
            <span className="font-brand text-3xl">{BRAND_NAME}</span>
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setIsOpen(false)}
            className="grid size-10 place-items-center rounded-md border border-line text-muted"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="mt-8 grid gap-2">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-md border border-line bg-background px-3 py-2 text-sm font-semibold text-foreground"
              >
                <Icon size={18} className="text-gold" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        {!isAdmin ? (
          <Link
            href={ctaHref}
            onClick={() => setIsOpen(false)}
            className="mt-5 flex h-10 items-center justify-center rounded-md bg-gold text-sm font-semibold text-background"
          >
            {isCustomer ? "Book" : "Book Now"}
          </Link>
        ) : null}
        {profile ? (
          <LogoutButton className="mt-3 h-10 w-full rounded-md border border-line text-sm font-semibold text-muted" />
        ) : null}
      </aside>

      <nav className="fixed bottom-0 left-0 z-40 grid w-full grid-cols-4 border-t border-line bg-surface lg:hidden">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="grid place-items-center gap-1 py-2 text-[11px] font-semibold text-muted">
              <Icon size={18} className="text-gold" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
