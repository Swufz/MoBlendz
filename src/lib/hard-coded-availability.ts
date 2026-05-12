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
  const day = buildLocalDateTime(date, "00:00").getDay();
  const availability = hardCodedWeeklyAvailability[day];

  if (!availability) {
    return [];
  }

  const now = new Date();
  const end = buildLocalDateTime(date, availability.end);
  const slots: Date[] = [];

  for (
    let slot = buildLocalDateTime(date, availability.start);
    addMinutesLocal(slot, 30) <= end;
    slot = addMinutesLocal(slot, 30)
  ) {
    if (slot > now && !overlapsHardCodedBreak(slot, durationMinutes)) {
      slots.push(slot);
    }
  }

  return slots;
}

export function isWithinHardCodedAvailability(startsAt: Date, durationMinutes = 30) {
  const availability = hardCodedWeeklyAvailability[startsAt.getDay()];

  if (!availability) {
    return false;
  }

  const date = formatLocalDate(startsAt);
  const dayStart = buildLocalDateTime(date, availability.start);
  const dayEnd = buildLocalDateTime(date, availability.end);

  return (
    startsAt >= dayStart &&
    startsAt < dayEnd &&
    !overlapsHardCodedBreak(startsAt, durationMinutes)
  );
}

export function getLocalDateBounds(date: string) {
  const start = buildLocalDateTime(date, "00:00");
  return {
    start,
    end: addMinutesLocal(start, 24 * 60),
  };
}

export function buildLocalDateTime(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export function addMinutesLocal(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function overlapsHardCodedBreak(startsAt: Date, durationMinutes: number) {
  const breaks = hardCodedWeeklyBreaks[startsAt.getDay()] ?? [];
  const date = formatLocalDate(startsAt);
  const endsAt = addMinutesLocal(startsAt, durationMinutes);

  return breaks.some((breakTime) => {
    const breakStart = buildLocalDateTime(date, breakTime.start);
    const breakEnd = buildLocalDateTime(date, breakTime.end);

    return startsAt < breakEnd && endsAt > breakStart;
  });
}
