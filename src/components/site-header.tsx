"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CalendarDays, Crown, Home, Menu, Scissors, Star, UserRound, X } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import type { Profile } from "@/lib/types";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/#services", label: "Services", icon: Scissors },
  { href: "/#recent-cuts", label: "Gallery", icon: Star },
];

const customerNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/bookings", label: "My Bookings", icon: CalendarDays },
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
  const pathname = usePathname();
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
        ]
      : [
          { href: "/", label: "Home", icon: Home },
          { href: bookingHref, label: "Book", icon: CalendarDays },
          { href: "/#services", label: "Services", icon: Scissors },
          { href: "/login", label: "Sign In", icon: UserRound },
        ];

  return (
    <>
      <header
        className={`${["/", "/booking", "/bookings", "/profile"].includes(pathname) ? "fixed" : "sticky"} inset-x-0 top-0 z-40 pointer-events-none px-3 pt-3 sm:px-5`}
      >
        <div className="liquid-glass-shell pointer-events-auto mx-auto flex min-h-14 w-fit max-w-full items-center gap-1 rounded-full p-1.5">
          {isCustomer || isAdmin ? <Link href={isAdmin ? "/admin" : "/"} className="px-4 text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-outfit)" }}>MoBlendz</Link> : null}
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setIsOpen(true)}
            className="liquid-glass-control grid size-11 shrink-0 place-items-center rounded-full text-foreground lg:hidden"
          >
            <Menu size={19} />
          </button>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
            {desktopNavItems.map((item) => (
              <NavigationLink
                key={item.href}
                href={item.href}
                className="liquid-glass-control rounded-full px-4 py-2.5 text-sm font-semibold text-muted hover:text-foreground"
              >
                {item.label}
              </NavigationLink>
            ))}
          </nav>

          <span className="mx-1 hidden h-5 w-px bg-white/15 lg:block" aria-hidden="true" />

          <div className="flex items-center gap-1">
            {profile ? (
              <LogoutButton className="liquid-glass-control hidden h-10 items-center rounded-full px-4 text-sm font-semibold text-muted hover:text-foreground lg:inline-flex" />
            ) : null}
            {!isAdmin ? (
              <Link
                href={ctaHref}
                className="liquid-glass-control liquid-glass-cta hidden h-10 items-center rounded-full px-5 text-sm font-semibold text-background sm:inline-flex"
              >
                {isCustomer ? "Book" : "Book Now"}
              </Link>
            ) : null}
            <Link
              href={profileHref}
              aria-label={profile ? (isAdmin ? "Open admin dashboard" : "Open profile") : "Login"}
              title={profile ? (isAdmin ? "Admin dashboard" : "Profile") : "Sign in"}
              className="liquid-glass-control grid size-11 shrink-0 place-items-center overflow-hidden rounded-full text-gold"
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
        className={`fixed inset-0 z-50 bg-black/55 backdrop-blur-sm transition lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsOpen(false)}
      />
      <aside
        className={`liquid-glass-panel fixed left-3 top-3 z-50 h-[calc(100%-1.5rem)] w-72 max-w-[85vw] rounded-2xl p-4 transition-transform lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-[calc(100%+1.5rem)]"
        }`}
      >
        <div className="flex items-center justify-between">
          <p className="px-2 text-sm font-semibold text-muted">Navigation</p>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setIsOpen(false)}
            className="liquid-glass-control grid size-10 place-items-center rounded-full text-muted"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="mt-8 grid gap-2">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavigationLink
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="liquid-glass-control flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground"
              >
                <Icon size={18} className="text-gold" />
                {item.label}
              </NavigationLink>
            );
          })}
        </nav>
        {!isAdmin ? (
          <Link
            href={ctaHref}
            onClick={() => setIsOpen(false)}
            className="liquid-glass-control liquid-glass-cta mt-5 flex h-11 items-center justify-center rounded-full text-sm font-semibold text-background"
          >
            {isCustomer ? "Book" : "Book Now"}
          </Link>
        ) : null}
        {profile ? (
          <LogoutButton className="liquid-glass-control mt-3 h-11 w-full rounded-full text-sm font-semibold text-muted" />
        ) : null}
      </aside>

      <nav
        className={`liquid-glass-shell fixed bottom-3 left-1/2 z-40 grid w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 ${isCustomer ? "grid-cols-3" : "grid-cols-4"} rounded-full p-1.5 lg:hidden`}
        aria-label="Quick navigation"
      >
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavigationLink key={item.href} href={item.href} className="liquid-glass-control grid min-w-0 place-items-center gap-1 rounded-full py-2 text-[11px] font-semibold text-muted">
              <Icon size={18} className="text-gold" />
              {item.label}
            </NavigationLink>
          );
        })}
      </nav>
    </>
  );
}

function NavigationLink({
  children,
  className,
  href,
  onClick,
}: {
  children: React.ReactNode;
  className: string;
  href: string;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = !href.includes("#") && pathname === href.split("?")[0];
  const activeClassName = `${className} ${isActive ? "bg-white/10 text-foreground" : ""}`;
  if (href === "/" || href.startsWith("/#")) {
    return (
      <a href={href} className={activeClassName} aria-current={isActive ? "page" : undefined} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={activeClassName} aria-current={isActive ? "page" : undefined} onClick={onClick}>
      {children}
    </Link>
  );
}
