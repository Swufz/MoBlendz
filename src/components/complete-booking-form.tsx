"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { completeBooking } from "@/app/actions";

type CompletionResult =
  | {
      ok: boolean;
      message: string;
      redirectTo?: string;
    }
  | undefined;

export function CompleteBookingForm({
  bookingId,
  defaultFinalPrice,
}: {
  bookingId: string;
  defaultFinalPrice: number;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setMessage("");
    setIsError(false);

    startTransition(async () => {
      const result = (await completeBooking(bookingId, formData)) as CompletionResult;

      if (!result) {
        setIsError(true);
        setMessage("Completion did not return a result.");
        return;
      }

      setIsError(!result.ok);
      setMessage(result.message);

      if (result.ok && result.redirectTo) {
        setTimeout(() => {
          router.replace(result.redirectTo ?? "/admin/bookings");
          router.refresh();
        }, 600);
      }
    });
  }

  return (
    <form action={handleSubmit} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-muted">
          Manual final cash override
        </span>
        <input
          name="manualFinal"
          type="number"
          step="0.01"
          min="0"
          placeholder={`${defaultFinalPrice}`}
          className="mt-2 h-12 w-full rounded-md border border-line bg-background px-4"
        />
      </label>
      {message ? (
        <p
          className={`rounded-md p-3 text-sm font-medium ${
            isError ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
          }`}
        >
          {message}
        </p>
      ) : null}
      <button
        disabled={isPending}
        className="h-12 w-full rounded-md bg-foreground px-5 font-semibold text-background disabled:opacity-60"
      >
        {isPending ? "Completing..." : "Save completed booking"}
      </button>
    </form>
  );
}
