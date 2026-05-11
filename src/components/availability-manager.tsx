"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addBlockedTime, deleteBlockedTime, saveWeeklyAvailability } from "@/app/actions";
import { DarkCard } from "@/components/luxury-ui";
import type { BlockedTime, WeeklyAvailability } from "@/lib/types";

const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type ActionResult = { ok: boolean; message: string } | undefined;

export function AvailabilityManager({
  blockedTimes,
  weeklyAvailability,
}: {
  blockedTimes: BlockedTime[];
  weeklyAvailability: WeeklyAvailability[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleWeeklySave(formData: FormData) {
    setMessage("");
    startTransition(async () => {
      const result = (await saveWeeklyAvailability(formData)) as ActionResult;
      setIsError(!result?.ok);
      setMessage(result?.message ?? "Availability update did not return a result.");
      if (result?.ok) {
        router.refresh();
      }
    });
  }

  function handleBlockedAdd(formData: FormData) {
    setMessage("");
    startTransition(async () => {
      const result = (await addBlockedTime(formData)) as ActionResult;
      setIsError(!result?.ok);
      setMessage(result?.message ?? "Blocked time update did not return a result.");
      if (result?.ok) {
        router.refresh();
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = (await deleteBlockedTime(id)) as ActionResult;
      setIsError(!result?.ok);
      setMessage(result?.message ?? "Delete did not return a result.");
      if (result?.ok) {
        router.refresh();
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <DarkCard className="p-5">
        <h2 className="text-2xl font-semibold">Weekly availability</h2>
        <p className="mt-2 text-sm text-muted">
          These hours control what customers see on the booking page.
        </p>

        <form action={handleWeeklySave} className="mt-6 grid gap-3">
          {weeklyAvailability.map((day) => (
            <div
              key={day.day_of_week}
              className="grid gap-3 rounded-lg border border-line bg-background p-4 md:grid-cols-[1fr_1fr_1fr_1fr] md:items-end"
            >
              <label className="flex items-center gap-3 font-semibold">
                <input
                  name={`day-${day.day_of_week}-available`}
                  type="checkbox"
                  defaultChecked={day.is_available}
                  className="size-5 accent-[#d6a84f]"
                />
                {dayLabels[day.day_of_week]}
              </label>
              <TimeField label="Start" name={`day-${day.day_of_week}-start`} defaultValue={day.start_time} />
              <TimeField label="End" name={`day-${day.day_of_week}-end`} defaultValue={day.end_time} />
              <div className="grid grid-cols-2 gap-2">
                <TimeField label="Break start" name={`day-${day.day_of_week}-break-start`} defaultValue={day.break_start ?? ""} />
                <TimeField label="Break end" name={`day-${day.day_of_week}-break-end`} defaultValue={day.break_end ?? ""} />
              </div>
            </div>
          ))}
          <button
            disabled={isPending}
            className="bg-gold text-background h-12 rounded-md px-5 text-sm font-semibold disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Save Weekly Hours"}
          </button>
        </form>
      </DarkCard>

      <div className="space-y-6">
        <DarkCard className="p-5">
          <h2 className="text-2xl font-semibold">Block time</h2>
          <p className="mt-2 text-sm text-muted">
            Hide vacation days, personal appointments, or unavailable time ranges.
          </p>
          <form action={handleBlockedAdd} className="mt-5 grid gap-3">
            <label className="block">
              <span className="text-sm font-bold text-muted">Date</span>
              <input name="date" type="date" required className="mt-2 h-11 w-full rounded-md border border-line bg-background px-4 text-foreground" />
            </label>
            <label className="flex items-center gap-3 text-sm font-semibold">
              <input name="all_day" type="checkbox" className="size-5 accent-[#d6a84f]" />
              Block all day
            </label>
            <div className="grid grid-cols-2 gap-3">
              <TimeField label="Start time" name="start_time" />
              <TimeField label="End time" name="end_time" />
            </div>
            <label className="block">
              <span className="text-sm font-bold text-muted">Reason</span>
              <input name="reason" placeholder="Vacation, personal appointment..." className="mt-2 h-11 w-full rounded-md border border-line bg-background px-4 text-foreground" />
            </label>
            <button
              disabled={isPending}
              className="bg-gold text-background h-12 rounded-md px-5 text-sm font-semibold disabled:opacity-60"
            >
              {isPending ? "Saving..." : "Add Blocked Time"}
            </button>
          </form>
        </DarkCard>

        <DarkCard className="p-5">
          <h2 className="text-2xl font-semibold">Blocked dates</h2>
          <div className="mt-4 grid gap-3">
            {blockedTimes.length ? (
              blockedTimes.map((block) => (
                <div key={block.id} className="rounded-md border border-line bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {block.date ?? formatLegacyBlockedDate(block.starts_at)}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {block.all_day
                          ? "All day"
                          : `${formatTime(block.start_time ?? block.starts_at)} - ${formatTime(block.end_time ?? block.ends_at)}`}
                      </p>
                      {block.reason ? <p className="mt-1 text-sm text-muted">{block.reason}</p> : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(block.id)}
                      disabled={isPending}
                      className="rounded-md border border-danger/40 px-3 py-1 text-xs font-semibold text-danger disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-md border border-line bg-background p-4 text-sm text-muted">
                No blocked times yet.
              </p>
            )}
          </div>
        </DarkCard>
      </div>

      {message ? (
        <p
          className={`lg:col-span-2 rounded-md p-4 text-sm font-semibold ${
            isError ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

function TimeField({
  defaultValue = "",
  label,
  name,
}: {
  defaultValue?: string;
  label: string;
  name: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-muted">{label}</span>
      <input
        name={name}
        type="time"
        defaultValue={defaultValue.slice(0, 5)}
        className="mt-2 h-11 w-full rounded-md border border-line bg-background px-3 text-foreground"
      />
    </label>
  );
}

function formatTime(value?: string | null) {
  if (!value) {
    return "Any time";
  }

  if (value.includes("T")) {
    return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatLegacyBlockedDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : "Blocked time";
}
