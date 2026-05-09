"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Check, Scissors } from "lucide-react";
import { createBooking } from "@/app/actions";
import {
  formatBookingDate,
  formatBookingTime,
  getAvailableTimeSlots,
} from "@/lib/business-logic";
import { defaultAdminSettings, getServiceDuration, getServicePrice, serviceLabels } from "@/lib/config";
import type { AdminSettings, ServiceType } from "@/lib/types";

const services: ServiceType[] = ["haircut", "haircut_beard"];

export function BookingWizard({
  settings = defaultAdminSettings,
}: {
  settings?: AdminSettings;
}) {
  const [step, setStep] = useState(0);
  const [serviceType, setServiceType] = useState<ServiceType>("haircut");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedDate = useMemo(() => {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(year, month - 1, day);
  }, [date]);
  const slots = useMemo(
    () => getAvailableTimeSlots(selectedDate, serviceType, settings).slice(0, 18),
    [selectedDate, serviceType, settings],
  );
  const price = getServicePrice(serviceType, settings);
  const duration = getServiceDuration(serviceType, settings);

  function submit() {
    const formData = new FormData();
    formData.set("serviceType", serviceType);
    formData.set("date", date);
    formData.set("time", time);
    formData.set("notes", notes);

    startTransition(async () => {
      const result = await createBooking(formData);
      if (result?.message) {
        setMessage(result.message);
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-xl overflow-hidden rounded-[2rem] border border-line bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Booking
          </p>
          <h1 className="text-xl font-semibold">
            {step === 0 ? "Choose your cut" : step === 1 ? "Pick a time" : "Confirm booking"}
          </h1>
        </div>
        <div className="rounded-full bg-barber-blue px-3 py-1 text-sm font-semibold">
          {step + 1}/3
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
                      ? "border-foreground bg-foreground text-background"
                      : "border-line bg-background"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`grid size-11 place-items-center rounded-full ${
                        active ? "bg-background/15" : "bg-barber-blue"
                      }`}
                    >
                      <Scissors size={19} />
                    </span>
                    <span>
                      <span className="block text-lg font-semibold">
                        {serviceLabels[service]}
                      </span>
                      <span className={active ? "text-background/70" : "text-muted"}>
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
                className="mt-2 h-12 w-full rounded-2xl border border-line bg-background px-4"
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
                            ? "bg-foreground text-background"
                            : "bg-barber-blue/70 text-foreground"
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
          <div className="space-y-4">
            <div className="rounded-3xl bg-background p-4">
              <p className="text-sm text-muted">Service booked</p>
              <p className="mt-1 text-lg font-semibold">{serviceLabels[serviceType]}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-3xl bg-background p-4">
                <p className="text-sm text-muted">Date</p>
                <p className="mt-1 font-semibold">{formatBookingDate(selectedDate)}</p>
              </div>
              <div className="rounded-3xl bg-background p-4">
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
                className="mt-2 w-full rounded-3xl border border-line bg-background p-4"
                placeholder="Optional"
              />
            </label>
            <div className="rounded-3xl bg-foreground p-5 text-background">
              <p className="text-sm text-background/70">Cash due</p>
              <p className="text-3xl font-semibold">${price}</p>
              <p className="mt-1 text-sm text-background/70">{duration} minute appointment</p>
            </div>
          </div>
        ) : null}
      </div>

      {message ? <p className="px-5 pb-3 text-sm font-medium text-red-700">{message}</p> : null}

      <div className="flex items-center justify-between border-t border-line p-5">
        <button
          type="button"
          onClick={() => setStep((value) => Math.max(0, value - 1))}
          disabled={step === 0}
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
            className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background disabled:opacity-40"
          >
            Next
            <ArrowRight size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={isPending || !time}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background disabled:opacity-40"
          >
            <Check size={18} />
            {isPending ? "Booking..." : "Confirm"}
          </button>
        )}
      </div>
    </div>
  );
}
