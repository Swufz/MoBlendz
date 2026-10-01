# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary users are MoBlendz clients booking haircut appointments from a mobile-first web experience. They need to choose a service, find an available time, sign in, add contact details, and manage their appointments without friction.

The barber/admin workflow is secondary but part of the product: the admin manages availability, blocked times, bookings, customer records, completed cuts, loyalty progress, referral credits, and cash earnings.

## Product Purpose

MoBlendz lets clients reserve private barber appointments online and keep track of bookings, rewards, and referral credits. Success means clients can confidently book a valid appointment and arrive knowing payment is handled in person.

## Positioning

MoBlendz is positioned around private appointment barbering: one reserved chair, focused service, clean finishes, and a quieter booking experience than walk-in or crowded shop workflows. The product supports that with a streamlined booking flow, visible recent work, loyalty rewards, referrals, and admin tools that keep the barber's schedule accurate.

## Operating Context

Clients use the app to browse services, view recent haircut work, book appointments, maintain profile details, cancel allowed appointments, and track loyalty or referral credits.

The app uses Google login through Supabase Auth. Booking availability is constrained by weekly availability, blocked times, existing pending or confirmed appointments, service duration, and a two-upcoming-appointments limit. Customers pay cash in person; the app does not collect payments.

Admins use the app to review bookings, complete cuts, cancel appointments, manage weekly availability and blocked times, view customer records, and track completed-booking earnings.

## Capabilities and Constraints

Current services are Haircut and Haircut + Beard, with an optional $15, 15-minute scalp/neck massage add-on. Defaults in code are $30 for Haircut, $35 for Haircut + Beard, 45-minute base service durations, a 5-cut loyalty cycle, $5 referral credits, and a 4-hour customer cancellation window.

Only pending and confirmed bookings block future availability. Cancelled and no-show appointments do not count toward loyalty or stats. Completed bookings count toward earnings. After the configured number of paid completed haircuts, a client earns a free haircut; a free haircut does not count toward the next loyalty cycle.

Referral credits are issued after a referred customer's first completed haircut. Booking confirmation emails and 24-hour reminders use Resend when email is enabled. Vercel Cron triggers reminders.

Open decision: any business facts not represented in the repository, such as exact location, long-term service menu, cancellation policy language, and public contact details, are not confirmed by init.

## Brand Commitments

The product name is MoBlendz. Existing durable assets include `public/mb-logo.png`, recent haircut photos in `public/images/`, and the app's current service names, booking language, rewards model, and cash-in-person payment model.

## Evidence on Hand

Repository evidence includes `README.md`, `src/app/page.tsx`, `src/app/booking/page.tsx`, `src/app/profile/page.tsx`, `src/app/actions.ts`, `src/lib/config.ts`, Supabase SQL files, and public image assets. No real testimonials, press, customer counts, location details, or external proof claims were found during init and future work should not fabricate them.

## Product Principles

Make booking feel quick, calm, and reliable for clients.

Preserve the private appointment promise: one reserved chair, focused attention, and no rush.

Keep availability, conflicts, rewards, referrals, and cash due accurate before visual flourish.

Treat admin tools as operational support for the client booking promise, not the primary public experience.
