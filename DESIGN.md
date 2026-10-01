---
name: MoBlendz Customer Account
description: Forest green and champagne home, booking, appointments, and profile
colors:
  forest-base: "#0b1713"
  forest-glow: "#34483d"
  forest-secondary: "#233e31"
  foreground: "#f1eee5"
  muted: "#a8aa9f"
  account-muted: "#b4bdb5"
  champagne: "#d4b974"
  gold-light: "#e1c98b"
  gold-deep: "#bda163"
  button-ink: "#10170f"
  focus: "#dec58a"
typography:
  display:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(56px, 5.7vw, 82px)"
    fontWeight: 600
    lineHeight: 0.9
    letterSpacing: "-.025em"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 600
    letterSpacing: ".19em"
  wordmark:
    fontFamily: "Outfit, sans-serif"
    fontSize: "clamp(95px, 12vw, 175px)"
    fontWeight: 800
    letterSpacing: "-.035em"
rounded:
  control: "8px"
  action: "10px"
  reward: "12px"
  pill: "9999px"
spacing:
  tight: "12px"
  compact: "16px"
  grid: "20px"
  card: "30px"
components:
  booking-action:
    backgroundColor: "linear-gradient(120deg, #e1c98b, #bda163)"
    textColor: "{colors.button-ink}"
    rounded: "{rounded.action}"
    padding: "12px 30px"
  reward-card:
    backgroundColor: "linear-gradient(115deg, #263a2c40, #07100d90)"
    textColor: "{colors.foreground}"
    rounded: "{rounded.reward}"
    padding: "24px 30px"
  account-shortcut:
    backgroundColor: "#07100d45"
    textColor: "{colors.foreground}"
    rounded: "{rounded.action}"
    padding: "14px 16px"
---

# Design System: MoBlendz Customer Account

## Overview

This document describes the customer homepage, Booking, My Bookings, and Profile. The user's forest green and gold reference establishes a calm, premium account experience with centered glass navigation, serif headings, the existing portrait, and translucent surfaces. Public landing and admin routes remain outside this scope; system behavior stays unchanged.

## Colors

Forest tones layer the background. Champagne highlights labels and rewards; the lighter gold gradient identifies booking actions. Warm foreground text and muted supporting copy maintain hierarchy.

## Typography

Cormorant Garamond gives the welcome and reward headings their serif character. Inter handles controls and supporting text. Outfit distinguishes the brand and faint background wordmark. Uppercase labels remain small and spaced; the greeting permits wrapping long names.

## Layout

The centered content container is capped at 1360px with desktop padding of 100px 36px 36px. The hero pairs a left greeting with the mirrored existing landing portrait, followed by two equal reward cards and three equal shortcuts, separated by 20px gaps. Below 1024px, spacing tightens and the side signature disappears. At 700px and below, the portrait sits above the greeting, rewards and shortcuts stack, and bottom padding reserves room for mobile navigation.

Booking and My Bookings use a compact portrait hero within a 1180px container; the booking wizard is centered at a maximum width of 760px. Appointment cards carry serif service names, status, and expected cash due on the same translucent forest surface. At 700px and below, the portrait shrinks to 140px by 170px, headings span the available width, panel padding tightens, and appointment details stack above the status and price row. Bottom padding accommodates mobile navigation.

Profile uses the same 1180px container with a focused, centered 760px editing form below a short text heading. Avatar and email identify the account; name, phone, and picture are immediately editable with Save changes and Reset changes. The page contains no bookings, rewards, or redundant read-only edit toggle. On mobile, padding tightens, the avatar shrinks, and actions stack at full width.

## Elevation & Depth

Depth comes from forest radial gradients, translucent card fills, and restrained borders. Reward cards have no shadow. The navigation uses blur, a soft ambient shadow, and a subtle inset highlight. The portrait fades into its background; the wordmark remains decorative and faint.

## Shapes

Rewards use gently rounded corners; actions and shortcuts use a slightly tighter radius. Circular icon wells and pill navigation contrast with the rectangular cards.

## Components

Booking is the gold primary action, paired with an outlined bookings action. Loyalty and referral cards reuse the existing functional components. Shortcuts expose profile, bookings, and referrals with icon wells and arrows. Desktop navigation is centered and floating, with the gold right-hand Book CTA and no duplicate left-hand Book link; mobile retains menu and bottom navigation. The wizard uses distinct heading, body, and footer regions with rounded service choices and inputs; appointment cards keep cancellation controls below a divider. Hover states change surface color; account actions and flow fields expose a gold focus outline. Reduced motion disables account transitions.

Profile access is through the navigation avatar and home Edit Profile shortcut. There is no text Profile navigation link or Profile dock item; the customer mobile dock uses three columns. The profile editor retains upload feedback, disabled saving/upload states, visible field focus, and upload-control focus.

## Do's and Don'ts

- Do preserve the existing portrait, mirrored toward the greeting, and keep decorative imagery out of the accessibility tree.
- Do preserve readable labels, visible focus, and real rewards and appointment data.
- Don't apply this page composition or its scoped styles to public or admin surfaces by default.
