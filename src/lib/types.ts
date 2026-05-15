export type UserRole = "customer" | "admin";

export type ServiceType = "haircut" | "haircut_beard";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type DiscountType = "none" | "referral" | "free_haircut" | "manual";

export type CreditStatus = "unused" | "used" | "expired";

export type ReferralStatus = "pending" | "completed" | "rewarded";

export type Profile = {
  id: string;
  auth_user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  referral_code: string;
  referred_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Booking = {
  id: string;
  user_id: string;
  service_type: ServiceType;
  base_price: number;
  final_price: number | null;
  discount_type: DiscountType;
  discount_amount: number;
  date_time: string;
  duration_minutes: number;
  status: BookingStatus;
  notes: string | null;
  cancelled_at?: string | null;
  completed_at: string | null;
  customer_email_sent_at?: string | null;
  admin_email_sent_at?: string | null;
  customer_reminder_email_sent_at?: string | null;
  admin_reminder_email_sent_at?: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Pick<Profile, "full_name" | "email" | "phone" | "avatar_url">;
};

export type Loyalty = {
  id: string;
  user_id: string;
  paid_haircuts_since_last_free: number;
  free_haircuts_available: number;
  total_free_haircuts_used: number;
  updated_at: string;
};

export type DiscountCredit = {
  id: string;
  user_id: string;
  type: "referral";
  amount: number;
  status: CreditStatus;
  source_referral_id: string | null;
  used_booking_id: string | null;
  created_at: string;
  used_at: string | null;
};

export type AdminSettings = {
  id: string;
  haircut_price: number;
  haircut_beard_price: number;
  loyalty_required_haircuts: number;
  referral_discount_amount: number;
  haircut_duration_minutes: number;
  haircut_beard_duration_minutes: number;
  cancellation_window_hours: number;
  allow_customer_cancellation: boolean;
  allow_customer_reschedule: boolean;
  business_hours: BusinessHours;
  created_at: string;
  updated_at: string;
};

export type BusinessHours = Record<
  string,
  {
    enabled: boolean;
    start: string;
    end: string;
  }
>;

export type BlockedTime = {
  id: string;
  date?: string;
  start_time?: string | null;
  end_time?: string | null;
  all_day?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  reason: string | null;
  created_at?: string;
  updated_at?: string;
};

export type WeeklyAvailability = {
  id: string;
  day_of_week: number;
  is_available: boolean;
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
  created_at: string;
  updated_at: string;
};

export type CompletionSummary = {
  serviceLabel: string;
  basePrice: number;
  hasFreeHaircut: boolean;
  freeHaircutApplied: boolean;
  referralCreditApplied: boolean;
  referralCreditAmount: number;
  discountAmount: number;
  finalCashDue: number;
  loyaltyBefore: number;
  loyaltyAfter: number;
  freeHaircutsAvailableAfter: number;
};
