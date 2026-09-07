import {
  createBookingDateTime,
  getBusinessDateBounds,
  getBusinessDate,
  getBusinessDayOfWeek,
} from "@/lib/timezone";
import type { BlockedTime, WeeklyAvailability } from "@/lib/types";

export type HardCodedDayAvailability = {
  start: string;
  end: string;
};

export type HardCodedBreak = {
  start: string;
  end: string;
};

export const hardCodedWeeklyAvailability: Record<number, HardCodedDayAvailability> = {
  0: { start: "10:00", end: "17:30" },
  1: { start: "13:00", end: "17:30" },
  2: { start: "10:00", end: "17:30" },
  3: { start: "13:00", end: "17:30" },
  4: { start: "10:00", end: "17:30" },
  5: { start: "10:00", end: "17:30" },
  6: { start: "10:00", end: "17:30" },
};

const hardCodedWeeklyBreaks: Partial<Record<number, HardCodedBreak[]>> = {
  5: [{ start: "13:00", end: "14:15" }],
};

export function getHardCodedSlotsForDate(date: string, durationMinutes = 30) {
  return getSlotsForDate(date, durationMinutes);
}

export function getHardCodedSlotCandidatesForDate(date: string) {
  return getSlotCandidatesForDate(date);
}

export function isWithinHardCodedAvailability(startsAt: Date, durationMinutes = 30) {
  return isWithinAvailability(startsAt, durationMinutes);
}

export function getSlotsForDate(
  date: string,
  durationMinutes = 30,
  weeklyAvailability?: Pick<
    WeeklyAvailability,
    "day_of_week" | "is_available" | "start_time" | "end_time" | "break_start" | "break_end"
  >[],
  blockedTimes: BlockedTime[] = [],
) {
  const now = new Date();
  return getSlotCandidatesForDate(date, weeklyAvailability).filter((slot) =>
    slot > now && isWithinAvailability(slot, durationMinutes, weeklyAvailability, blockedTimes),
  );
}

export function getSlotCandidatesForDate(
  date: string,
  weeklyAvailability?: Pick<
    WeeklyAvailability,
    "day_of_week" | "is_available" | "start_time" | "end_time" | "break_start" | "break_end"
  >[],
) {
  const day = getBusinessDayOfWeek(createBookingDateTime(date, "00:00"));
  const availability = getDayAvailability(day, weeklyAvailability);

  if (!availability?.isAvailable) {
    return [];
  }

  const end = buildLocalDateTime(date, availability.end);
  const slots: Date[] = [];

  for (
    let slot = buildLocalDateTime(date, availability.start);
    addMinutesLocal(slot, 30) <= end;
    slot = addMinutesLocal(slot, 30)
  ) {
    slots.push(slot);
  }

  return slots;
}

export function isWithinAvailability(
  startsAt: Date,
  durationMinutes = 30,
  weeklyAvailability?: Pick<
    WeeklyAvailability,
    "day_of_week" | "is_available" | "start_time" | "end_time" | "break_start" | "break_end"
  >[],
  blockedTimes: BlockedTime[] = [],
) {
  const availability = getDayAvailability(
    getBusinessDayOfWeek(startsAt),
    weeklyAvailability,
  );

  if (!availability?.isAvailable) {
    return false;
  }

  const date = getBusinessDate(startsAt);
  const dayStart = buildLocalDateTime(date, availability.start);
  const dayEnd = buildLocalDateTime(date, availability.end);

  return (
    startsAt >= dayStart &&
    addMinutesLocal(startsAt, durationMinutes) <= dayEnd &&
    !overlapsBreak(startsAt, durationMinutes, availability.breaks) &&
    !overlapsBlockedTime(startsAt, durationMinutes, blockedTimes)
  );
}

export function getLocalDateBounds(date: string) {
  return getBusinessDateBounds(date);
}

export function buildLocalDateTime(date: string, time: string) {
  return createBookingDateTime(date, time);
}

export function addMinutesLocal(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function overlapsBreak(
  startsAt: Date,
  durationMinutes: number,
  breaks: HardCodedBreak[],
) {
  const date = getBusinessDate(startsAt);
  const endsAt = addMinutesLocal(startsAt, durationMinutes);

  return breaks.some((breakTime) => {
    const breakStart = buildLocalDateTime(date, breakTime.start);
    const breakEnd = buildLocalDateTime(date, breakTime.end);

    return startsAt < breakEnd && endsAt > breakStart;
  });
}

function getDayAvailability(
  day: number,
  weeklyAvailability?: Pick<
    WeeklyAvailability,
    "day_of_week" | "is_available" | "start_time" | "end_time" | "break_start" | "break_end"
  >[],
) {
  const weeklyDay = weeklyAvailability?.find((item) => item.day_of_week === day);
  if (weeklyDay) {
    return {
      isAvailable: weeklyDay.is_available,
      start: weeklyDay.start_time,
      end: weeklyDay.end_time,
      breaks:
        weeklyDay.break_start && weeklyDay.break_end
          ? [{ start: weeklyDay.break_start, end: weeklyDay.break_end }]
          : [],
    };
  }

  const hardCodedDay = hardCodedWeeklyAvailability[day];
  return hardCodedDay
    ? {
        isAvailable: true,
        start: hardCodedDay.start,
        end: hardCodedDay.end,
        breaks: hardCodedWeeklyBreaks[day] ?? [],
      }
    : null;
}

function overlapsBlockedTime(
  startsAt: Date,
  durationMinutes: number,
  blockedTimes: BlockedTime[],
) {
  const date = getBusinessDate(startsAt);
  const endsAt = addMinutesLocal(startsAt, durationMinutes);

  return blockedTimes.some((block) => {
    if (block.all_day && block.date === date) {
      return true;
    }

    const blockStart = block.date && block.start_time
      ? buildLocalDateTime(block.date, block.start_time)
      : block.starts_at
        ? new Date(block.starts_at)
        : null;
    const blockEnd = block.date && block.end_time
      ? buildLocalDateTime(block.date, block.end_time)
      : block.ends_at
        ? new Date(block.ends_at)
        : null;

    return Boolean(blockStart && blockEnd && startsAt < blockEnd && endsAt > blockStart);
  });
}
