import type { AdminSettings, BusinessHours, ServiceType } from "@/lib/types";

export const BRAND_NAME = "Mo Blendz";

export const defaultBusinessHours: BusinessHours = {
  monday: { enabled: true, start: "09:00", end: "18:00" },
  tuesday: { enabled: true, start: "09:00", end: "18:00" },
  wednesday: { enabled: true, start: "09:00", end: "18:00" },
  thursday: { enabled: true, start: "09:00", end: "18:00" },
  friday: { enabled: true, start: "09:00", end: "18:00" },
  saturday: { enabled: true, start: "10:00", end: "16:00" },
  sunday: { enabled: false, start: "10:00", end: "16:00" },
};

export const defaultAdminSettings: AdminSettings = {
  id: "default",
  haircut_price: 30,
  haircut_beard_price: 35,
  loyalty_required_haircuts: 5,
  referral_discount_amount: 5,
  haircut_duration_minutes: 30,
  haircut_beard_duration_minutes: 45,
  cancellation_window_hours: 4,
  allow_customer_cancellation: true,
  allow_customer_reschedule: true,
  business_hours: defaultBusinessHours,
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
};

export const serviceLabels: Record<ServiceType, string> = {
  haircut: "Haircut",
  haircut_beard: "Haircut + Beard",
};

export function getServicePrice(
  serviceType: ServiceType,
  settings: Pick<AdminSettings, "haircut_price" | "haircut_beard_price">,
) {
  return serviceType === "haircut"
    ? settings.haircut_price
    : settings.haircut_beard_price;
}

export function getServiceDuration(
  serviceType: ServiceType,
  settings: Pick<
    AdminSettings,
    "haircut_duration_minutes" | "haircut_beard_duration_minutes"
  >,
) {
  return serviceType === "haircut"
    ? settings.haircut_duration_minutes
    : settings.haircut_beard_duration_minutes;
}
