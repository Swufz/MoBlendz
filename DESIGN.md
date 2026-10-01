---
name: MoBlendz Customer Home
description: Forest green and champagne account homepage
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

# Design System: MoBlendz Customer Home

## Overview

This document describes only the signed-in customer homepage. The user's forest green and gold reference establishes a calm, premium account experience with a centered glass navigation, serif greeting, portrait, rewards, and account shortcuts. It does not prescribe a redesign of public, booking, or admin routes.

## Colors

Forest tones layer the background. Champagne highlights labels and rewards; the lighter gold gradient identifies booking actions. Warm foreground text and muted supporting copy maintain hierarchy.

## Typography

Cormorant Garamond gives the welcome and reward headings their serif character. Inter handles controls and supporting text. Outfit distinguishes the brand and faint background wordmark. Uppercase labels remain small and spaced; the greeting permits wrapping long names.

## Layout

The centered content container is capped at 1360px with desktop padding of 100px 36px 36px. The hero pairs a left greeting with the mirrored existing landing portrait, followed by two equal reward cards and three equal shortcuts, separated by 20px gaps. Below 1024px, spacing tightens and the side signature disappears. At 700px and below, the portrait sits above the greeting, rewards and shortcuts stack, and bottom padding reserves room for mobile navigation.

## Elevation & Depth

Depth comes from forest radial gradients, translucent card fills, and restrained borders. Reward cards have no shadow. The navigation uses blur, a soft ambient shadow, and a subtle inset highlight. The portrait fades into its background; the wordmark remains decorative and faint.

## Shapes

Rewards use gently rounded corners; actions and shortcuts use a slightly tighter radius. Circular icon wells and pill navigation contrast with the rectangular cards.

## Components

Booking is the gold primary action, paired with an outlined bookings action. Loyalty and referral cards reuse the existing functional components. Shortcuts expose profile, bookings, and referrals with icon wells and arrows. Desktop navigation is centered and floating; mobile retains menu and bottom navigation. Hover states change surface color; account actions expose a gold focus outline. Reduced motion disables account transitions.

## Do's and Don'ts

- Do preserve the existing portrait, mirrored toward the greeting, and keep decorative imagery out of the accessibility tree.
- Do preserve readable labels, visible focus, and the real loyalty and referral data.
- Don't apply this page composition or its scoped styles to public or admin surfaces by default.
