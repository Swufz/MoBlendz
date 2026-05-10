"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, CalendarDays, Crown, Home, Menu, Scissors, Star, UserRound, X } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { BRAND_NAME } from "@/lib/config";
import type { Profile } from "@/lib/types";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/#services", label: "Services", icon: Scissors },
];

const customerNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/booking", label: "Book", icon: CalendarDays },
  { href: "/profile", label: "My Bookings", icon: CalendarDays },
  { href: "/#loyalty", label: "Rewards", icon: Star },
  { href: "/profile", label: "Profile", icon: UserRound },
];

const adminNavItems = [
  { href: "/admin", label: "Admin Dashboard", icon: Crown },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/admin/customers", label: "Customers", icon: UserRound },
  { href: "/admin/stats", label: "Stats", icon: Star },
  { href: "/admin/settings", label: "Settings", icon: Scissors },
  { href: "/admin/availability", label: "Availability", icon: CalendarDays },
];

export function SiteHeader({ profile }: { profile?: Profile | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const isAdmin = profile?.role === "admin";
  const isCustomer = profile?.role === "customer";
  const desktopNavItems = isAdmin ? adminNavItems : isCustomer ? customerNavItems : navItems;
  const mobileNavItems = isAdmin ? adminNavItems : isCustomer ? customerNavItems : navItems;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-background/88 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setIsOpen(true)}
              className="grid size-11 place-items-center rounded-full border border-line bg-surface text-foreground lg:hidden"
            >
              <Menu size={20} />
            </button>
            <Link href="/" className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl border border-gold/35 bg-gold/10 text-gold">
                <Crown size={22} />
              </span>
              <span className="font-brand text-4xl text-foreground">
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
              <LogoutButton className="hidden h-11 rounded-full border border-line bg-surface px-4 text-sm font-bold text-muted transition hover:text-foreground lg:inline-flex lg:items-center" />
            ) : null}
            <Link
              href="/booking"
              className="gold-gradient hidden h-11 items-center rounded-full px-5 text-sm font-black shadow-[0_10px_35px_rgba(214,168,79,0.25)] sm:inline-flex"
            >
              Book Appointment
            </Link>
            <button
              aria-label="Notifications"
              className="hidden size-11 place-items-center rounded-full border border-line bg-surface text-muted sm:grid"
            >
              <Bell size={18} />
            </button>
            <Link
              href={profile ? "/profile" : "/login"}
              aria-label={profile ? "Open profile" : "Login"}
              className="grid size-11 place-items-center overflow-hidden rounded-full border border-gold/30 bg-secondary-card text-gold"
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
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsOpen(false)}
      />
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-80 max-w-[85vw] border-r border-line bg-surface p-5 shadow-2xl transition-transform lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
            <span className="grid size-10 place-items-center rounded-2xl border border-gold/35 bg-gold/10 text-gold">
              <Crown size={20} />
            </span>
            <span className="font-brand text-3xl">{BRAND_NAME}</span>
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setIsOpen(false)}
            className="grid size-10 place-items-center rounded-full border border-line text-muted"
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
                className="flex items-center gap-3 rounded-2xl border border-line bg-background px-4 py-3 text-sm font-bold text-foreground"
              >
                <Icon size={18} className="text-gold" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/booking"
          onClick={() => setIsOpen(false)}
          className="gold-gradient mt-6 flex h-12 items-center justify-center rounded-full text-sm font-black"
        >
          Book Appointment
        </Link>
        {profile ? (
          <LogoutButton className="mt-3 h-12 w-full rounded-full border border-line text-sm font-bold text-muted" />
        ) : null}
      </aside>

      <nav className="fixed bottom-3 left-1/2 z-40 grid w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 grid-cols-4 rounded-[1.5rem] border border-line bg-surface/95 p-2 shadow-2xl backdrop-blur-xl lg:hidden">
        {[
          { href: "/", label: "Home", icon: Home },
          { href: isAdmin ? "/admin/bookings" : "/booking", label: isAdmin ? "Bookings" : "Book", icon: CalendarDays },
          { href: isAdmin ? "/admin/stats" : profile ? "/#loyalty" : "/#services", label: isAdmin ? "Stats" : profile ? "Rewards" : "Services", icon: Star },
          { href: profile ? "/profile" : "/login", label: "Profile", icon: UserRound },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="grid place-items-center gap-1 rounded-2xl py-2 text-[11px] font-bold text-muted">
              <Icon size={18} className="text-gold" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
