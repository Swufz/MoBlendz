import { getBusinessDate, getBusinessDateBounds } from "@/lib/timezone";
import { hasScalpNeckMassageAddon } from "@/lib/config";
import type { Booking } from "@/lib/types";

export type DashboardBooking = Pick<Booking, "id" | "user_id" | "service_type" | "date_time" | "status" | "duration_minutes" | "notes" | "base_price" | "final_price" | "discount_amount" | "completed_at">;
export type DashboardCustomer = { id: string; full_name: string; phone: string | null; created_at: string };
export type DashboardPeriod = "today" | "week" | "month";

export function shiftBusinessDate(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function collectedAmount(booking: DashboardBooking) {
  return Math.max(0, Number(booking.final_price ?? Number(booking.base_price) - Number(booking.discount_amount ?? 0)));
}

export function buildAdminDashboard(bookings: DashboardBooking[], customers: DashboardCustomer[], period: DashboardPeriod, now = new Date()) {
  const today = getBusinessDate(now);
  const days = period === "week" ? 7 : period === "month" ? 30 : 1;
  const start = getBusinessDateBounds(shiftBusinessDate(today, 1 - days)).start;
  const end = getBusinessDateBounds(today).end;
  const previousStart = getBusinessDateBounds(shiftBusinessDate(today, 1 - days * 2)).start;
  const inRange = (value: string, from: Date, to: Date) => new Date(value) >= from && new Date(value) < to;
  const completionDate = (booking: DashboardBooking) => booking.completed_at ?? booking.date_time;
  const completed = bookings.filter(booking => booking.status === "completed");
  const selected = bookings.filter(booking => !["cancelled", "no_show"].includes(booking.status) && inRange(booking.date_time, start, end));
  const previous = bookings.filter(booking => !["cancelled", "no_show"].includes(booking.status) && inRange(booking.date_time, previousStart, start));
  const cuts = completed.filter(booking => inRange(completionDate(booking), start, end));
  const previousCuts = completed.filter(booking => inRange(completionDate(booking), previousStart, start));
  const priorClients = new Set(completed.filter(booking => new Date(completionDate(booking)) < start).map(booking => booking.user_id));
  const periodClients = new Set(cuts.map(booking => booking.user_id));
  const returning = [...periodClients].filter(id => priorClients.has(id)).length;
  const visitCounts = new Map<string, number>();
  for (const booking of completed) visitCounts.set(booking.user_id, (visitCounts.get(booking.user_id) ?? 0) + 1);
  const repeatClients = [...visitCounts.values()].filter(count => count > 1).length;
  const newCustomers = customers.filter(customer => inRange(customer.created_at, start, end)).length;
  const previousNewCustomers = customers.filter(customer => inRange(customer.created_at, previousStart, start)).length;
  const daily = Array.from({length:14}, (_, index) => {
    const date = shiftBusinessDate(today, index - 13);
    const dailyCuts = completed.filter(booking => getBusinessDate(completionDate(booking)) === date);
    return {date, revenue:dailyCuts.reduce((sum, booking) => sum + collectedAmount(booking), 0), bookings:bookings.filter(booking => !["cancelled", "no_show"].includes(booking.status) && getBusinessDate(booking.date_time) === date).length, customers:customers.filter(customer => getBusinessDate(customer.created_at) === date).length};
  });
  const last30Start = getBusinessDateBounds(shiftBusinessDate(today, -29)).start;
  const last30Cuts = completed.filter(booking => inRange(completionDate(booking), last30Start, end));
  const services = ["haircut", "haircut_beard"] as const;
  return {
    today, start, end, days, selected, completed:cuts.length,
    revenue:cuts.reduce((sum, booking) => sum + collectedAmount(booking), 0),
    previousRevenue:previousCuts.reduce((sum, booking) => sum + collectedAmount(booking), 0),
    previousBookings:previous.length, newCustomers, previousNewCustomers, returning,
    returningPercent:periodClients.size ? Math.round(returning / periodClients.size * 100) : 0,
    averageDuration:cuts.length ? Math.round(cuts.reduce((sum, booking) => sum + booking.duration_minutes, 0) / cuts.length) : null,
    totalCustomers:customers.length, repeatClients, servedClients:visitCounts.size,
    retention:visitCounts.size ? Math.round(repeatClients / visitCounts.size * 100) : 0,
    daily, serviceCounts:services.map(service => ({service,count:selected.filter(booking => booking.service_type === service).length})),
    addOns:selected.filter(booking => hasScalpNeckMassageAddon(booking.notes)).length,
    topServices:[...services.map(service => ({label:service === "haircut" ? "Haircut" : "Haircut + Beard",count:last30Cuts.filter(booking => booking.service_type === service).length})), {label:"Scalp/neck massage add-on",count:last30Cuts.filter(booking => hasScalpNeckMassageAddon(booking.notes)).length}].sort((a,b) => b.count - a.count),
    last30Completed:last30Cuts.length,
    upcoming:bookings.filter(booking => ["pending", "confirmed"].includes(booking.status) && new Date(booking.date_time) >= now).sort((a,b) => a.date_time.localeCompare(b.date_time)).slice(0,5),
    recent:[...bookings].filter(booking => new Date(booking.date_time) < end).sort((a,b) => b.date_time.localeCompare(a.date_time)).slice(0,5),
  };
}
