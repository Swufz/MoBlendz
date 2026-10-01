---
name: MoBlendz Customer Account and Admin
description: Forest green and champagne customer accounts and operational admin tools
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
  admin-champagne: "#cbb277"
  admin-service-green: "#527c60"
  admin-success: "#8fc69d"
  admin-danger: "#ee9c8e"
  admin-surface: "#122019"
  admin-secondary-card: "#1b2b21"
  admin-border: "#b1b8a735"
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
  admin-headline:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(42px, 4vw, 60px)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-.025em"
  admin-panel-title:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.15
  admin-metric:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "29px"
    fontWeight: 600
    lineHeight: 1.25
  admin-body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
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
  admin-grid: "14px"
  admin-panel-inline: "18px"
  admin-page-inline: "40px"
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
  admin-panel:
    backgroundColor: "linear-gradient(115deg, #263a2c30, #07100d85)"
    textColor: "{colors.foreground}"
    rounded: "{rounded.action}"
    padding: "16px 18px"
  admin-tool:
    backgroundColor: "#07100d45"
    textColor: "{colors.foreground}"
    rounded: "{rounded.action}"
    padding: "16px"
  admin-period:
    backgroundColor: "#07100d60"
    textColor: "{colors.foreground}"
    rounded: "{rounded.pill}"
    padding: "11px 15px"
  admin-tab-active:
    backgroundColor: "linear-gradient(120deg, #e1c98b, #bda163)"
    textColor: "{colors.button-ink}"
    rounded: "{rounded.pill}"
    padding: "6px 11px"
---

# Design System: MoBlendz Customer Account and Admin

## Overview

**Creative North Star: "Forest green and champagne"**

This document describes the customer homepage, Booking, My Bookings, Profile, and the explicitly approved admin extension. The user's forest green and gold reference establishes a calm, premium account experience with centered glass navigation, serif headings, the existing portrait, and translucent surfaces. Public landing remains outside this scope; system behavior stays unchanged. Admin uses the same forest and champagne world at operational density, with its own scoped palette, centered six-route pill navigation, serif headings, and the existing landing portrait unmirrored at the right. Customer compositions and tokens remain intact.

**Key Characteristics:**
- Centered glass or pill navigation and champagne active actions.
- Serif headings, Inter controls, and the existing portrait.
- Translucent forest surfaces with distinct customer and admin density.

## Colors

Forest tones layer the background. Champagne highlights labels and rewards; the lighter gold gradient identifies booking actions. Warm foreground text and muted supporting copy maintain hierarchy.

Admin champagne identifies charts, controls, and icon accents; service green distinguishes the second base service in the donut. Soft green and coral carry positive and negative changes, success, and error states. Admin surface and secondary-card override the inherited surface variables within the admin shell only. The existing account muted color is also the admin supporting-text color.

**The Scoped Extension Rule.** Admin tokens apply inside the admin shell; customer colors and layouts retain their existing roles.

## Typography

Cormorant Garamond gives the welcome and reward headings their serif character. Inter handles controls and supporting text. Outfit distinguishes the brand and faint background wordmark. Uppercase labels remain small and spaced; the greeting permits wrapping long names.

Admin headings reuse the serif family: the dashboard title is 56px at wide desktop and 44px on phones; panel titles are 24px. Metric values use Inter with tabular numerals, 29px desktop and 26px on phones. Dense operational text uses 12px, with supporting copy raised to 13px on phones. The dashboard's reference eyebrow is an explicitly retained user-pinned exception, not a new label pattern for unrelated screens.

## Layout

The centered content container is capped at 1360px with desktop padding of 100px 36px 36px. The hero pairs a left greeting with the mirrored existing landing portrait, followed by two equal reward cards and three equal shortcuts, separated by 20px gaps. Below 1024px, spacing tightens and the side signature disappears. At 700px and below, the portrait sits above the greeting, rewards and shortcuts stack, and bottom padding reserves room for mobile navigation.

Booking and My Bookings use a compact portrait hero within a 1180px container; the booking wizard is centered at a maximum width of 760px. Appointment cards carry serif service names, status, and expected cash due on the same translucent forest surface. At 700px and below, the portrait shrinks to 140px by 170px, headings span the available width, panel padding tightens, and appointment details stack above the status and price row. Bottom padding accommodates mobile navigation.

Profile uses the same 1180px container with a focused, centered 760px editing form below a short text heading. Avatar and email identify the account; only name and phone are editable with Save changes and Reset changes. The page contains no bookings, rewards, or redundant read-only edit toggle. On mobile, padding tightens, the avatar shrinks, and actions stack at full width.

Admin has a 1480px dashboard container with 24px top and 40px horizontal desktop padding, 14px grid gaps, six metric columns, and two three-panel rows with a wide first column (2.05:0.93:1). Four tool links conclude the grid. At 1279px and below, metrics become three columns and page padding becomes 24px. At 1023px and below, content rows become two columns, chart and recent bookings span both, tools become two columns, and bottom padding reserves mobile navigation space. At 700px and below, metrics become two columns, panels and tools stack, page padding becomes 24px 20px 110px, and the portrait is 135px by 160px above the copy.

The wide desktop chart is 132px tall; below 1280px its height follows the SVG aspect ratio. Phone chart labels use 22px SVG text with 20px y-axis labels and three date labels. Desktop recent-booking rows retain a single-line date/time and a compact approximately 28px height. The table keeps a 490px minimum width within a horizontally scrollable, labelled, keyboard-focusable region; a visible scroll hint appears below 1280px. Existing admin subpages inherit shell palette, controls, 1360px container, serif page headings, translucent panels, and mobile spacing rather than the dashboard composition.

## Elevation & Depth

Depth comes from forest radial gradients, translucent card fills, and restrained borders. Reward cards have no shadow. The navigation uses blur, a soft ambient shadow, and a subtle inset highlight. The portrait fades into its background; the wordmark remains decorative and faint.

Admin metrics and panels remain shadowless with translucent fills and restrained borders. The period popup has a small ambient shadow (0 12px 24px #0004); the admin header removes the shared outer glass shell's shadow and blur, keeping the inner navigation pill. The unmirrored admin portrait fades toward its bottom edge.

## Shapes

Rewards use gently rounded corners; actions and shortcuts use a slightly tighter radius. Circular icon wells and pill navigation contrast with the rectangular cards.

Admin panels and tools use 10px corners, fields use 8px, inherited subpage surfaces use 12px, and navigation, period controls, status badges, progress bars, and metric tabs use pill geometry.

## Components

Booking is the gold primary action, paired with an outlined bookings action. Loyalty and referral cards reuse the existing functional components. Shortcuts expose profile, bookings, and referrals with icon wells and arrows. Desktop navigation is centered and floating, with the gold right-hand Book CTA and no duplicate left-hand Book link; mobile retains menu and bottom navigation. The wizard uses distinct heading, body, and footer regions with rounded service choices and inputs; appointment cards keep cancellation controls below a divider. Hover states change surface color; account actions and flow fields expose a gold focus outline. Reduced motion disables account transitions.

Profile access is through the navigation avatar and home Edit Profile shortcut. There is no text Profile navigation link or Profile dock item; the customer mobile dock uses three columns. The profile editor retains save feedback, disabled saving states, and visible field focus.

Admin navigation retains Dashboard, Bookings, Customers, Stats, Availability, and Settings; the brand sits left and the six-route pill is centered on wide desktop. Existing menu, avatar, logout, and four-item mobile dock remain functional. Period selection is native details with URL links; chart metrics are URL links retaining the selected period. All 14 daily chart values are available in a native details table. Six metrics report actual booking, completed-revenue, completed-haircut, customer, returning-client, and scheduled-duration data; scheduled duration is not elapsed service time. The service donut partitions base services and describes massage as an included add-on. Upcoming and recent bookings link to existing booking workflows; customer insights and top services use actual completed visits. Four tool links reuse booking, customer, service-settings anchor, and availability routes.

Admin interactive controls expose a 2px champagne focus outline with 3px offset. Table scroll regions preserve visible keyboard focus. Tool hover changes border and surface; the period popup highlights hovered/current choices. Roles, authentication, backend actions, and booking workflows remain the existing product contract.

## Do's and Don'ts

- Do preserve the existing portrait, mirrored toward the greeting, and keep decorative imagery out of the accessibility tree.
- Do preserve readable labels, visible focus, and real rewards and appointment data.
- Do keep the admin portrait unmirrored and the customer portrait mirrored toward the greeting.
- Do retain the 14-day chart data table, table scroll hint, visible focus, and real operational data.
- Don't apply customer page compositions to admin or public surfaces; admin shares the world through its scoped shell.
- Don't present scheduled duration as measured service time or massage as an exclusive appointment category.
