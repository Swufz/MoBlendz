"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adminCancelBooking } from "@/app/actions";

export function AdminCancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    const confirmed = window.confirm("Are you sure you want to cancel this booking?");
    if (!confirmed) {
      return;
    }

    setMessage("");
    setIsError(false);

    startTransition(async () => {
      const result = await adminCancelBooking(bookingId);
      setIsError(!result.ok);
      setMessage(result.message);

      if (result.ok) {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-2 md:items-end">
      <button
        type="button"
        onClick={handleCancel}
        disabled={isPending}
        className="inline-flex rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
      >
        {isPending ? "Cancelling..." : "Cancel"}
      </button>
      {message ? (
        <p className={`text-xs font-medium ${isError ? "text-red-700" : "text-green-700"}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
