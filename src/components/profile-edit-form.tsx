"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateMyProfile } from "@/app/actions";
import { getDefaultAvatarUrl } from "@/lib/business-logic";
import type { Profile } from "@/lib/types";

type ProfileUpdateResult =
  | {
      ok: boolean;
      message: string;
    }
  | undefined;

export function ProfileEditForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const avatarUrl = profile.avatar_url ?? getDefaultAvatarUrl(profile.full_name);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setMessage("");
    setIsError(false);

    const formData = new FormData();
    formData.set("fullName", fullName);
    formData.set("phone", phone);

    startTransition(async () => {
      const result = (await updateMyProfile(formData)) as ProfileUpdateResult;
      if (!result) {
        setIsError(true);
        setMessage("Profile update did not return a result.");
        return;
      }

      setIsError(!result.ok);
      setMessage(result.message);

      if (result.ok) {
        router.refresh();
      }
    });
  }

  function handleCancel() {
    setFullName(profile.full_name);
    setPhone(profile.phone ?? "");
    setMessage("");
    setIsError(false);
  }

  return (
    <form className="profile-editor" onSubmit={(event) => { event.preventDefault(); handleSave(); }}>
      <div className="profile-editor-heading">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt=""
          className="profile-editor-avatar"
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-3xl font-semibold">Personal details</h2>
          <p className="truncate text-sm text-muted">{profile.email}</p>
        </div>
      </div>

      <div className="profile-editor-fields">
        <label className="block">
          <span className="text-sm font-medium text-muted">Full name</span>
          <input
            name="fullName"
            autoComplete="name"
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="mt-2 h-10 w-full rounded-md border border-line bg-surface px-3 text-foreground"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-muted">Phone number</span>
          <input
            name="phone"
            autoComplete="tel"
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            type="tel"
            inputMode="tel"
            placeholder="(949) 555-1234"
            className="mt-2 h-10 w-full rounded-md border border-line bg-surface px-3 text-foreground"
          />
        </label>

        {message ? (
          <p
            role={isError ? "alert" : "status"}
            className={`rounded-md p-3 text-sm font-medium ${
              isError ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
            }`}
          >
            {message}
          </p>
        ) : null}

        <div className="profile-editor-actions">
          <button
            type="submit"
            disabled={isPending}
            className="h-10 rounded-md bg-gold px-4 text-sm font-semibold text-background disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Save changes"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="h-10 rounded-md border border-line px-4 text-sm font-semibold text-muted disabled:opacity-60"
          >
            Reset changes
          </button>
        </div>
      </div>
    </form>
  );
}
