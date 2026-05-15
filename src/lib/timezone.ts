import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const BUSINESS_TIME_ZONE = "America/Los_Angeles";

export function createBookingDateTime(selectedDate: string, selectedTime: string) {
  const normalizedTime = normalizeSelectedTime(selectedTime);
  return fromZonedTime(`${selectedDate}T${normalizedTime}:00`, BUSINESS_TIME_ZONE);
}

export function formatBookingDateTime(value: string | Date) {
  return formatInTimeZone(value, BUSINESS_TIME_ZONE, "EEE, MMM d 'at' h:mm a");
}

export function formatBookingDate(value: string | Date) {
  return formatInTimeZone(value, BUSINESS_TIME_ZONE, "EEE, MMM d");
}

export function formatBookingTime(value: string | Date) {
  return formatInTimeZone(value, BUSINESS_TIME_ZONE, "h:mm a");
}

export function getBusinessDate(value: string | Date = new Date()) {
  return formatInTimeZone(value, BUSINESS_TIME_ZONE, "yyyy-MM-dd");
}

export function getBusinessDayOfWeek(value: string | Date) {
  return Number(formatInTimeZone(value, BUSINESS_TIME_ZONE, "i")) % 7;
}

export function formatBookingTimeValue(value: string | Date) {
  return formatInTimeZone(value, BUSINESS_TIME_ZONE, "HH:mm");
}

export function getBusinessDateBounds(selectedDate: string) {
  const start = createBookingDateTime(selectedDate, "00:00");
  const end = createBookingDateTime(addOneIsoDateDay(selectedDate), "00:00");

  return { start, end };
}

function addOneIsoDateDay(selectedDate: string) {
  const [year, month, day] = selectedDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + 1));
  return date.toISOString().slice(0, 10);
}

function normalizeSelectedTime(selectedTime: string) {
  const trimmed = selectedTime.trim();

  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    const [hours, minutes] = trimmed.split(":");
    return `${hours.padStart(2, "0")}:${minutes}`;
  }

  const match = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!match) {
    return trimmed.slice(0, 5);
  }

  let hours = Number(match[1]);
  const minutes = match[2] ?? "00";
  const period = match[3].toUpperCase();

  if (period === "PM" && hours < 12) {
    hours += 12;
  }

  if (period === "AM" && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, "0")}:${minutes}`;
}
