import {
  addMinutes,
  format,
  getDay,
  isAfter,
  isBefore,
  parse,
  set,
} from "date-fns";
import { defaultAdminSettings, serviceLabels } from "@/lib/config";
import type {
  AdminSettings,
  Booking,
  CompletionSummary,
  DiscountCredit,
  Loyalty,
  ServiceType,
} from "@/lib/types";

const dayNames = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export function createReferralCode(seed: string) {
  return seed.replace(/[^a-z0-9]/gi, "").slice(0, 5).toUpperCase().padEnd(5, "X");
}

export function getDefaultAvatarUrl(name: string) {
  const label = encodeURIComponent(name || "Mo Blendz");
  return `https://api.dicebear.com/9.x/initials/svg?seed=${label}&backgroundColor=f8f6f1,c8a45d,a9cfe8`;
}

export function getAvailableTimeSlots(
  date: Date,
  serviceType: ServiceType,
  settings: AdminSettings = defaultAdminSettings,
) {
  const day = settings.business_hours[dayNames[getDay(date)]];
  if (!day?.enabled) {
    return [];
  }

  const duration =
    serviceType === "haircut"
      ? settings.haircut_duration_minutes
      : settings.haircut_beard_duration_minutes;
  const start = parse(day.start, "HH:mm", date);
  const end = parse(day.end, "HH:mm", date);
  const slots: Date[] = [];

  for (let slot = start; !isAfter(addMinutes(slot, duration), end); slot = addMinutes(slot, 15)) {
    if (isAfter(slot, new Date())) {
      slots.push(slot);
    }
  }

  return slots;
}

export function isWithinBusinessHours(
  startsAt: Date,
  durationMinutes: number,
  settings: AdminSettings,
) {
  const day = settings.business_hours[dayNames[getDay(startsAt)]];
  if (!day?.enabled) {
    return false;
  }

  const dayStart = parse(day.start, "HH:mm", startsAt);
  const dayEnd = parse(day.end, "HH:mm", startsAt);
  const endsAt = addMinutes(startsAt, durationMinutes);

  return !isBefore(startsAt, dayStart) && !isAfter(endsAt, dayEnd);
}

export function rangesOverlap(
  leftStart: Date,
  leftMinutes: number,
  rightStart: Date,
  rightMinutes: number,
) {
  const leftEnd = addMinutes(leftStart, leftMinutes);
  const rightEnd = addMinutes(rightStart, rightMinutes);
  return leftStart < rightEnd && rightStart < leftEnd;
}

export function combineDateAndTime(date: string, time: string) {
  const parsed = parse(date, "yyyy-MM-dd", new Date());
  const [hours, minutes] = time.split(":").map(Number);
  return set(parsed, { hours, minutes, seconds: 0, milliseconds: 0 });
}

export function formatBookingDate(value: string | Date) {
  return format(value instanceof Date ? value : new Date(value), "EEE, MMM d");
}

export function formatBookingTime(value: string | Date) {
  return format(value instanceof Date ? value : new Date(value), "h:mm a");
}

export function calculateCompletionSummary({
  booking,
  loyalty,
  referralCredit,
  settings,
}: {
  booking: Pick<Booking, "service_type" | "base_price">;
  loyalty: Pick<
    Loyalty,
    "paid_haircuts_since_last_free" | "free_haircuts_available"
  >;
  referralCredit?: Pick<DiscountCredit, "amount"> | null;
  settings: Pick<AdminSettings, "loyalty_required_haircuts">;
}): CompletionSummary {
  const hasFreeHaircut =
    loyalty.free_haircuts_available > 0 ||
    loyalty.paid_haircuts_since_last_free >= settings.loyalty_required_haircuts - 1;
  const freeHaircutApplied = hasFreeHaircut;
  const referralCreditApplied = !freeHaircutApplied && Boolean(referralCredit);
  const referralCreditAmount = referralCreditApplied ? referralCredit?.amount ?? 0 : 0;
  const discountAmount = freeHaircutApplied ? booking.base_price : referralCreditAmount;
  const finalCashDue = Math.max(0, booking.base_price - discountAmount);

  let loyaltyAfter = loyalty.paid_haircuts_since_last_free;
  let freeHaircutsAvailableAfter = loyalty.free_haircuts_available;

  if (freeHaircutApplied) {
    loyaltyAfter = 0;
    freeHaircutsAvailableAfter = Math.max(0, freeHaircutsAvailableAfter - 1);
  } else {
    loyaltyAfter += 1;
    if (loyaltyAfter >= settings.loyalty_required_haircuts - 1) {
      freeHaircutsAvailableAfter += 1;
    }
  }

  return {
    serviceLabel: serviceLabels[booking.service_type],
    basePrice: booking.base_price,
    hasFreeHaircut,
    freeHaircutApplied,
    referralCreditApplied,
    referralCreditAmount,
    discountAmount,
    finalCashDue,
    loyaltyBefore: loyalty.paid_haircuts_since_last_free,
    loyaltyAfter,
    freeHaircutsAvailableAfter,
  };
}
