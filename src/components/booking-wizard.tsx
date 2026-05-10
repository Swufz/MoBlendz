"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Check, Scissors } from "lucide-react";
import { createBooking } from "@/app/actions";
import {
  formatBookingDate,
  formatBookingTime,
  getAvailableTimeSlots,
} from "@/lib/business-logic";
import {
  defaultAdminSettings,
  getServiceDuration,
  getServicePrice,
  serviceLabels,
} from "@/lib/config";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AdminSettings, BookingStatus, ServiceType } from "@/lib/types";
import type { BlockedTime, Booking, WeeklyAvailability } from "@/lib/types";

const services: ServiceType[] = ["haircut", "haircut_beard"];
const pendingBookingKey = "mo-blendz-pending-booking";
const completedBookingKey = "mo-blendz-completed-booking";

type PendingBooking = {
  serviceType: ServiceType;
  date: string;
  time: string;
  notes: string;
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
  weeklyAvailability,
  blockedTimes = [],
  activeBookings = [],
}: {
  settings?: AdminSettings;
  shouldResume?: boolean;
  initialIsLoggedIn?: boolean;
  weeklyAvailability?: WeeklyAvailability[];
  blockedTimes?: BlockedTime[];
  activeBookings?: Booking[];
}) {
  const [step, setStep] = useState(0);
  const [serviceType, setServiceType] = useState<ServiceType>("haircut");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn);
  const [completedBooking, setCompletedBooking] = useState<CompletedBooking | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isCreatingRef = useRef(false);
  const didResumeRef = useRef(false);

  const selectedDate = useMemo(() => {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(year, month - 1, day);
  }, [date]);
  const slots = useMemo(
    () =>
      getAvailableTimeSlots(selectedDate, serviceType, settings, weeklyAvailability)
        .filter((slot) =>
          isSlotVisible({
            slot,
            serviceType,
            settings,
            blockedTimes,
            activeBookings,
            date,
          }),
        )
        .slice(0, 18),
    [activeBookings, blockedTimes, date, selectedDate, serviceType, settings, weeklyAvailability],
  );
  const price = getServicePrice(serviceType, settings);
  const duration = getServiceDuration(serviceType, settings);

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

  function applyDraft(draft: PendingBooking) {
    setServiceType(draft.serviceType);
    setDate(draft.date);
    setTime(draft.time);
    setNotes(draft.notes);
  }

  function currentDraft(): PendingBooking {
    return { serviceType, date, time, notes };
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
    <div className="mx-auto w-full max-w-xl overflow-hidden rounded-[2rem] border border-line bg-surface luxury-glow">
      <div className="flex items-center justify-between border-b border-line bg-secondary-card/70 px-5 py-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-gold">
            Book Your Blend
          </p>
          <h1 className="text-2xl font-black">{getStepTitle(step)}</h1>
        </div>
        <div className="rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-sm font-black text-gold">
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
                  className={`flex items-center justify-between rounded-3xl border p-5 text-left transition ${
                    active
                      ? "border-gold bg-gold/15 text-foreground shadow-[0_0_40px_rgba(214,168,79,0.12)]"
                      : "border-line bg-background hover:border-gold/50"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`grid size-11 place-items-center rounded-full ${
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
                className="mt-2 h-12 w-full rounded-2xl border border-line bg-background px-4 text-foreground"
              />
            </label>
            <div>
              <p className="text-sm font-medium text-muted">Available times</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {slots.length ? (
                  slots.map((slot) => {
                    const value = slot.toTimeString().slice(0, 5);
                    return (
                      <button
                        key={slot.toISOString()}
                        type="button"
                        onClick={() => setTime(value)}
                        className={`h-11 rounded-2xl text-sm font-semibold ${
                          time === value
                            ? "gold-gradient"
                            : "border border-line bg-secondary-card text-foreground hover:border-gold/50"
                        }`}
                      >
                        {formatBookingTime(slot)}
                      </button>
                    );
                  })
                ) : (
                  <p className="col-span-3 rounded-2xl bg-background p-4 text-sm text-muted">
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
            serviceType={serviceType}
            setNotes={setNotes}
            time={time}
          />
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div className="rounded-3xl bg-background p-4">
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
                className="mt-2 h-12 w-full rounded-2xl border border-line bg-background px-4 text-foreground"
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
          className="inline-flex h-12 items-center gap-2 rounded-full px-4 text-sm font-semibold text-muted disabled:opacity-30"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        {step < 2 ? (
          <button
            type="button"
            onClick={() => setStep((value) => value + 1)}
            disabled={step === 1 && !time}
            className="gold-gradient inline-flex h-12 items-center gap-2 rounded-full px-5 text-sm font-black disabled:opacity-40"
          >
            Next
            <ArrowRight size={18} />
          </button>
        ) : step === 3 ? (
          <button
            type="button"
            onClick={() => submitDraft(currentDraft(), phone)}
            disabled={isPending || phone.trim().length < 7}
            className="gold-gradient inline-flex h-12 items-center gap-2 rounded-full px-5 text-sm font-black disabled:opacity-40"
          >
            <Check size={18} />
            {isPending ? "Saving..." : "Save booking"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending || isSigningIn || !time}
            className="gold-gradient inline-flex h-12 items-center gap-2 rounded-full px-5 text-sm font-black disabled:opacity-40"
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
  serviceType,
  setNotes,
  time,
}: {
  date: Date;
  duration: number;
  notes: string;
  price: number;
  serviceType: ServiceType;
  setNotes: (notes: string) => void;
  time: string;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-line bg-background p-4">
        <p className="text-sm text-muted">Service booked</p>
        <p className="mt-1 text-lg font-semibold">{serviceLabels[serviceType]}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-line bg-background p-4">
          <p className="text-sm text-muted">Date</p>
          <p className="mt-1 font-semibold">{formatBookingDate(date)}</p>
        </div>
        <div className="rounded-3xl border border-line bg-background p-4">
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
          className="mt-2 w-full rounded-3xl border border-line bg-background p-4 text-foreground"
          placeholder="Optional"
        />
      </label>
      <div className="rounded-3xl border border-gold/40 bg-gold/10 p-5">
        <p className="text-sm text-muted">Cash due</p>
        <p className="text-3xl font-black text-gold">${price}</p>
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
    <section className="mx-auto w-full max-w-xl rounded-[2rem] border border-line bg-surface p-5 luxury-glow">
      <div className="grid size-14 place-items-center rounded-full bg-gold/15 text-gold">
        <Check />
      </div>
      <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-muted">
        Booking confirmed
      </p>
      <h1 className="mt-2 text-3xl font-black">You are on the schedule.</h1>
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
        className="gold-gradient mt-6 h-12 w-full rounded-full px-5 font-black"
      >
        Book another cut
      </button>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-background px-4 py-3">
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
  blockedTimes,
  date,
  serviceType,
  settings,
  slot,
}: {
  activeBookings: Booking[];
  blockedTimes: BlockedTime[];
  date: string;
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

  return !blockedTimes.some((block) => {
    if (block.starts_at && block.ends_at) {
      return (
        slot < new Date(block.ends_at) &&
        addMinutesLocal(slot, duration) > new Date(block.starts_at)
      );
    }

    if (block.date !== date) {
      return false;
    }

    if (block.all_day) {
      return true;
    }

    if (!block.start_time || !block.end_time) {
      return false;
    }

    const blockStart = buildDateTime(date, block.start_time);
    const blockEnd = buildDateTime(date, block.end_time);
    return slot < blockEnd && addMinutesLocal(slot, duration) > blockStart;
  });
}

function buildDateTime(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function addMinutesLocal(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}
