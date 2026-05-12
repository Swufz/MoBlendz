"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Check, Scissors } from "lucide-react";
import { createBooking, validateReferralCode } from "@/app/actions";
import { formatBookingDate, formatBookingTime } from "@/lib/business-logic";
import {
  defaultAdminSettings,
  getServiceDuration,
  getServicePrice,
  serviceLabels,
} from "@/lib/config";
import {
  addMinutesLocal,
  getHardCodedSlotsForDate,
  getLocalDateBounds,
} from "@/lib/hard-coded-availability";
import { normalizeReferralCode } from "@/lib/referrals";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AdminSettings, BookingStatus, ServiceType } from "@/lib/types";

const services: ServiceType[] = ["haircut", "haircut_beard"];
const pendingBookingKey = "mo-blendz-pending-booking";
const completedBookingKey = "mo-blendz-completed-booking";

type ActiveBooking = {
  id: string;
  date_time: string;
  duration_minutes: number;
  status: Extract<BookingStatus, "pending" | "confirmed">;
};

type PendingBooking = {
  serviceType: ServiceType;
  date: string;
  time: string;
  notes: string;
  referralCode: string;
};

type CompletedBooking = {
  id: string;
  serviceType: ServiceType;
  dateTime: string;
  finalPrice: number;
  status: BookingStatus;
  durationMinutes: number;
};

type BookingActionResult =
  | {
      ok: true;
      booking: CompletedBooking;
    }
  | {
      ok: false;
      authRequired?: boolean;
      phoneRequired?: boolean;
      message: string;
    }
  | undefined;

export function BookingWizard({
  settings = defaultAdminSettings,
  shouldResume = false,
  initialIsLoggedIn = false,
  initialReferralCode = "",
}: {
  settings?: AdminSettings;
  shouldResume?: boolean;
  initialIsLoggedIn?: boolean;
  initialReferralCode?: string;
}) {
  const [step, setStep] = useState(0);
  const [serviceType, setServiceType] = useState<ServiceType>("haircut");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [referralCode, setReferralCode] = useState(() =>
    normalizeReferralCode(initialReferralCode),
  );
  const [referralMessage, setReferralMessage] = useState("");
  const [isReferralValid, setIsReferralValid] = useState(false);
  const [isCheckingReferral, setIsCheckingReferral] = useState(false);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn);
  const [completedBooking, setCompletedBooking] = useState<CompletedBooking | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [activeBookings, setActiveBookings] = useState<ActiveBooking[]>([]);
  const [isPending, startTransition] = useTransition();
  const isCreatingRef = useRef(false);
  const didResumeRef = useRef(false);

  const selectedDate = useMemo(() => {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(year, month - 1, day);
  }, [date]);
  const slots = useMemo(
    () => {
      console.time("generate slots");
      const serviceDuration = getServiceDuration(serviceType, settings);
      const generatedSlots = getHardCodedSlotsForDate(date, serviceDuration)
        .filter((slot) =>
          isSlotVisible({
            slot,
            serviceType,
            settings,
            activeBookings,
          }),
        );
      console.timeEnd("generate slots");
      return generatedSlots;
    },
    [activeBookings, date, serviceType, settings],
  );
  const price = getServicePrice(serviceType, settings);
  const duration = getServiceDuration(serviceType, settings);
  const referralDiscountAmount = isReferralValid
    ? Math.min(Number(settings.referral_discount_amount ?? 5), price)
    : 0;

  useEffect(() => {
    const savedConfirmation = readCompletedBooking();
    if (savedConfirmation) {
      // Restore client-only sessionStorage state after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCompletedBooking(savedConfirmation);
      return;
    }

    if (!shouldResume || didResumeRef.current) {
      return;
    }

    didResumeRef.current = true;
    const draft = readPendingBooking();
    if (!draft) {
      setStep(0);
      setMessage("We could not find your saved booking details. Please restart booking.");
      return;
    }

    applyDraft(draft);
    setStep(2);
    setMessage("Welcome back. Finishing your booking now...");
    submitDraft(draft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldResume]);

  useEffect(() => {
    const code = normalizeReferralCode(referralCode);
    if (!code) {
      setReferralMessage("");
      setIsReferralValid(false);
      return;
    }

    let isCurrent = true;
    setIsCheckingReferral(true);
    const timeoutId = window.setTimeout(() => {
      validateReferralCode(code)
        .then((result) => {
          if (!isCurrent) {
            return;
          }

          setIsReferralValid(result.ok);
          setReferralMessage(result.message);
          if (result.ok && "code" in result && result.code) {
            setReferralCode(result.code);
          }
        })
        .catch(() => {
          if (!isCurrent) {
            return;
          }

          setIsReferralValid(false);
          setReferralMessage("Referral code could not be checked.");
        })
        .finally(() => {
          if (isCurrent) {
            setIsCheckingReferral(false);
          }
        });
    }, 350);

    return () => {
      isCurrent = false;
      window.clearTimeout(timeoutId);
    };
  }, [referralCode]);

  useEffect(() => {
    let isCurrent = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoadingAvailability(true);
    setTime("");

    async function loadActiveBookings() {
      console.time("fetch bookings");
      const { start, end } = getLocalDateBounds(date);
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("bookings")
        .select("id,date_time,duration_minutes,status")
        .in("status", ["pending", "confirmed"])
        .gte("date_time", start.toISOString())
        .lt("date_time", end.toISOString())
        .returns<ActiveBooking[]>();
      console.timeEnd("fetch bookings");

      if (!isCurrent) {
        return;
      }

      if (error) {
        console.warn("Could not load booking conflicts.", error.message);
        setActiveBookings([]);
        return;
      }

      setActiveBookings(data ?? []);
    }

    loadActiveBookings()
      .catch((error) => {
        if (!isCurrent) {
          return;
        }

        console.warn(
          error instanceof Error ? error.message : "Could not load booking conflicts.",
        );
        setActiveBookings([]);
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoadingAvailability(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [date]);

  function applyDraft(draft: PendingBooking) {
    setServiceType(draft.serviceType);
    setDate(draft.date);
    setTime(draft.time);
    setNotes(draft.notes);
    setReferralCode(normalizeReferralCode(draft.referralCode ?? ""));
  }

  function currentDraft(): PendingBooking {
    return { serviceType, date, time, notes, referralCode };
  }

  function savePendingBooking(draft: PendingBooking) {
    sessionStorage.setItem(pendingBookingKey, JSON.stringify(draft));
  }

  async function handleSignIn(draft: PendingBooking) {
    setMessage("");
    setIsSigningIn(true);
    savePendingBooking(draft);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
            "/booking?resume=1",
          )}`,
        },
      });

      if (error) {
        setMessage(error.message);
        setIsSigningIn(false);
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not start Google sign in.",
      );
      setIsSigningIn(false);
    }
  }

  function submitDraft(draft = currentDraft(), phoneNumber = phone) {
    if (isCreatingRef.current) {
      return;
    }

    isCreatingRef.current = true;
    setMessage("");

    const formData = new FormData();
    formData.set("serviceType", draft.serviceType);
    formData.set("date", draft.date);
    formData.set("time", draft.time);
    formData.set("notes", draft.notes);
    formData.set("referralCode", normalizeReferralCode(draft.referralCode));
    formData.set("phone", phoneNumber);

    startTransition(async () => {
      const result = (await createBooking(formData)) as BookingActionResult;
      isCreatingRef.current = false;

      if (!result) {
        return;
      }

      if (result.ok) {
        sessionStorage.removeItem(pendingBookingKey);
        sessionStorage.setItem(completedBookingKey, JSON.stringify(result.booking));
        setCompletedBooking(result.booking);
        setMessage("");
        window.history.replaceState(null, "", "/booking?confirmed=1");
        return;
      }

      if (result.authRequired) {
        await handleSignIn(draft);
        return;
      }

      if (result.phoneRequired) {
        savePendingBooking(draft);
        setStep(3);
        setMessage(result.message);
        return;
      }

      setMessage(result.message);
    });
  }

  async function handleConfirm() {
    const draft = currentDraft();
    savePendingBooking(draft);

    if (!isLoggedIn) {
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setIsLoggedIn(Boolean(user));

        if (!user) {
          await handleSignIn(draft);
          return;
        }
      } catch {
        await handleSignIn(draft);
        return;
      }
    }

    submitDraft(draft);
  }

  if (completedBooking) {
    return (
      <BookingConfirmation
        booking={completedBooking}
        onRestart={() => {
          sessionStorage.removeItem(completedBookingKey);
          setCompletedBooking(null);
          setStep(0);
          setMessage("");
          window.history.replaceState(null, "", "/booking");
        }}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line bg-secondary-card/70 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-muted">
            Booking
          </p>
          <h1 className="text-2xl font-semibold">{getStepTitle(step)}</h1>
        </div>
        <div className="rounded-md border border-line px-2 py-1 text-sm font-semibold text-gold">
          {Math.min(step + 1, 3)}/3
        </div>
      </div>

      <div className="min-h-[430px] p-5">
        {step === 0 ? (
          <div className="grid gap-3">
            {services.map((service) => {
              const active = service === serviceType;
              return (
                <button
                  key={service}
                  type="button"
                  onClick={() => setServiceType(service)}
                  className={`flex items-center justify-between rounded-lg border p-4 text-left transition ${
                    active
                      ? "border-gold bg-gold/10 text-foreground"
                      : "border-line bg-background hover:border-gold/50"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`grid size-10 place-items-center rounded-md ${
                        active ? "bg-gold text-background" : "bg-secondary-card text-gold"
                      }`}
                    >
                      <Scissors size={19} />
                    </span>
                    <span>
                      <span className="block text-lg font-semibold">
                        {serviceLabels[service]}
                      </span>
                      <span className={active ? "text-gold" : "text-muted"}>
                        {getServiceDuration(service, settings)} minutes
                      </span>
                    </span>
                  </span>
                  <span className="text-xl font-semibold">
                    ${getServicePrice(service, settings)}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-muted">Date</span>
              <input
                value={date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(event) => {
                  setDate(event.target.value);
                  setTime("");
                }}
                type="date"
                className="mt-2 h-10 w-full rounded-md border border-line bg-background px-3 text-foreground"
              />
            </label>
            <div>
              <p className="text-sm font-medium text-muted">Available times</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {isLoadingAvailability ? (
                  <div className="col-span-3 grid grid-cols-3 gap-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-10 animate-pulse rounded-md border border-line bg-secondary-card"
                      />
                    ))}
                  </div>
                ) : slots.length ? (
                  slots.map((slot) => {
                    const value = slot.toTimeString().slice(0, 5);
                    return (
                      <button
                        key={slot.toISOString()}
                        type="button"
                        onClick={() => setTime(value)}
                        className={`h-10 rounded-md text-sm font-semibold ${
                          time === value
                            ? "bg-gold text-background"
                            : "border border-line bg-secondary-card text-foreground hover:border-gold/50"
                        }`}
                      >
                        {formatBookingTime(slot)}
                      </button>
                    );
                  })
                ) : (
                  <p className="col-span-3 rounded-md bg-background p-4 text-sm text-muted">
                    No times available for that day.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <BookingReview
            date={selectedDate}
            duration={duration}
            notes={notes}
            price={price}
            referralCode={referralCode}
            referralDiscountAmount={referralDiscountAmount}
            referralMessage={referralMessage}
            serviceType={serviceType}
            setReferralCode={setReferralCode}
            setNotes={setNotes}
            time={time}
            isCheckingReferral={isCheckingReferral}
            isReferralValid={isReferralValid}
          />
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-background p-4">
              <p className="text-sm text-muted">One last thing</p>
              <p className="mt-1 text-lg font-semibold">Add your phone number</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                MoBlendz uses this to confirm appointments and look you up at
                check-in.
              </p>
            </div>
            <label className="block">
              <span className="text-sm font-medium text-muted">Phone number</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                type="tel"
                inputMode="tel"
                placeholder="(555) 555-5555"
                className="mt-2 h-10 w-full rounded-md border border-line bg-background px-3 text-foreground"
              />
            </label>
          </div>
        ) : null}
      </div>

      {message ? <p className="px-5 pb-3 text-sm font-bold text-gold">{message}</p> : null}

      <div className="flex items-center justify-between border-t border-line p-5">
        <button
          type="button"
          onClick={() => {
            setMessage("");
            setStep((value) => (value === 3 ? 2 : Math.max(0, value - 1)));
          }}
          disabled={step === 0 || isPending || isSigningIn}
          className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold text-muted disabled:opacity-30"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        {step < 2 ? (
          <button
            type="button"
            onClick={() => setStep((value) => value + 1)}
            disabled={step === 1 && !time}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-gold px-4 text-sm font-semibold text-background disabled:opacity-40"
          >
            Next
            <ArrowRight size={18} />
          </button>
        ) : step === 3 ? (
          <button
            type="button"
            onClick={() => submitDraft(currentDraft(), phone)}
            disabled={isPending || phone.trim().length < 7}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-gold px-4 text-sm font-semibold text-background disabled:opacity-40"
          >
            <Check size={18} />
            {isPending ? "Saving..." : "Save booking"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending || isSigningIn || !time}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-gold px-4 text-sm font-semibold text-background disabled:opacity-40"
          >
            <Check size={18} />
            {isSigningIn
              ? "Redirecting..."
              : isPending
                ? "Booking..."
                : isLoggedIn
                  ? "Confirm"
                  : "Sign in with Google to book"}
          </button>
        )}
      </div>
    </div>
  );
}

function BookingReview({
  date,
  duration,
  notes,
  price,
  referralCode,
  referralDiscountAmount,
  referralMessage,
  serviceType,
  setReferralCode,
  setNotes,
  time,
  isCheckingReferral,
  isReferralValid,
}: {
  date: Date;
  duration: number;
  notes: string;
  price: number;
  referralCode: string;
  referralDiscountAmount: number;
  referralMessage: string;
  serviceType: ServiceType;
  setReferralCode: (referralCode: string) => void;
  setNotes: (notes: string) => void;
  time: string;
  isCheckingReferral: boolean;
  isReferralValid: boolean;
}) {
  const cashDue = Math.max(0, price - referralDiscountAmount);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-line bg-background p-4">
        <p className="text-sm text-muted">Service booked</p>
        <p className="mt-1 text-lg font-semibold">{serviceLabels[serviceType]}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-line bg-background p-4">
          <p className="text-sm text-muted">Date</p>
          <p className="mt-1 font-semibold">{formatBookingDate(date)}</p>
        </div>
        <div className="rounded-lg border border-line bg-background p-4">
          <p className="text-sm text-muted">Time</p>
          <p className="mt-1 font-semibold">{time || "Choose time"}</p>
        </div>
      </div>
      <label className="block">
        <span className="text-sm font-medium text-muted">Notes</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={4}
          className="mt-2 w-full rounded-md border border-line bg-background p-3 text-foreground"
          placeholder="Optional"
        />
      </label>
      <div className="rounded-lg border border-line bg-background p-4">
        <label className="block">
          <span className="text-sm font-semibold text-foreground">
            Have a referral code?
          </span>
          <input
            value={referralCode}
            onChange={(event) =>
              setReferralCode(normalizeReferralCode(event.target.value))
            }
            placeholder="Enter referral code"
            className="mt-3 h-10 w-full rounded-md border border-line bg-surface px-3 text-foreground placeholder:text-muted"
          />
        </label>
        <p className="mt-2 text-sm leading-6 text-muted">
          Use a friend&apos;s code. After your first completed cut, you both get
          $5 off your next cut.
        </p>
        {isCheckingReferral ? (
          <p className="mt-2 text-sm font-bold text-muted">Checking code...</p>
        ) : referralMessage ? (
          <p
            className={`mt-2 text-sm font-bold ${
              isReferralValid ? "text-success" : "text-danger"
            }`}
          >
            {isReferralValid
              ? referralMessage.includes("already linked")
                ? referralMessage
                : `Referral discount applied: -$${referralDiscountAmount}`
              : referralMessage}
          </p>
        ) : null}
      </div>
      <div className="rounded-lg border border-line bg-background p-4">
        <p className="text-sm text-muted">Price breakdown</p>
        <div className="mt-4 grid gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted">Service price</span>
            <span className="font-bold">${price}</span>
          </div>
          {referralDiscountAmount > 0 ? (
            <div className="flex items-center justify-between text-success">
              <span className="font-bold">Referral discount applied</span>
              <span className="font-semibold">-${referralDiscountAmount}</span>
            </div>
          ) : null}
        </div>
        <div className="mt-4 border-t border-gold/25 pt-4">
          <p className="text-sm text-muted">Cash due</p>
          <p className="text-3xl font-semibold text-gold">${cashDue}</p>
        </div>
        <p className="mt-1 text-sm text-muted">{duration} minute appointment</p>
      </div>
    </div>
  );
}

function BookingConfirmation({
  booking,
  onRestart,
}: {
  booking: CompletedBooking;
  onRestart: () => void;
}) {
  const dateTime = new Date(booking.dateTime);

  return (
    <section className="mx-auto w-full max-w-xl rounded-lg border border-line bg-surface p-5">
      <div className="text-gold">
        <Check />
      </div>
      <p className="mt-5 text-sm font-semibold text-muted">
        Booking confirmed
      </p>
      <h1 className="mt-2 text-3xl font-semibold">You are on the schedule.</h1>
      <dl className="mt-6 grid gap-3">
        <SummaryRow label="Service" value={serviceLabels[booking.serviceType]} />
        <SummaryRow label="Date" value={formatBookingDate(dateTime)} />
        <SummaryRow label="Time" value={formatBookingTime(dateTime)} />
        <SummaryRow label="Expected cash due" value={`$${booking.finalPrice}`} />
        <SummaryRow label="Booking status" value={booking.status} />
      </dl>
      <button
        type="button"
        onClick={onRestart}
        className="mt-6 h-10 w-full rounded-md bg-gold px-4 font-semibold text-background"
      >
        Book another cut
      </button>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-line bg-background px-4 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="font-semibold capitalize">{value}</dd>
    </div>
  );
}

function getStepTitle(step: number) {
  if (step === 0) {
    return "Choose your cut";
  }

  if (step === 1) {
    return "Pick a time";
  }

  if (step === 3) {
    return "Phone number";
  }

  return "Confirm booking";
}

function readPendingBooking() {
  try {
    const raw = sessionStorage.getItem(pendingBookingKey);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PendingBooking;
    if (!parsed.serviceType || !parsed.date || !parsed.time) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function readCompletedBooking() {
  try {
    const raw = sessionStorage.getItem(completedBookingKey);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as CompletedBooking;
  } catch {
    return null;
  }
}

function isSlotVisible({
  activeBookings,
  serviceType,
  settings,
  slot,
}: {
  activeBookings: ActiveBooking[];
  serviceType: ServiceType;
  settings: AdminSettings;
  slot: Date;
}) {
  const duration = getServiceDuration(serviceType, settings);

  const overlapsBooking = activeBookings.some((booking) =>
    slot < addMinutesLocal(new Date(booking.date_time), booking.duration_minutes) &&
    addMinutesLocal(slot, duration) > new Date(booking.date_time),
  );

  if (overlapsBooking) {
    return false;
  }
  return true;
}
