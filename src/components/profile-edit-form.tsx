"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Camera, Pencil } from "lucide-react";
import { updateMyProfile } from "@/app/actions";
import { getDefaultAvatarUrl } from "@/lib/business-logic";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxAvatarSize = 2 * 1024 * 1024;

type ProfileUpdateResult =
  | {
      ok: boolean;
      message: string;
    }
  | undefined;

export function ProfileEditForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(
    profile.avatar_url ?? getDefaultAvatarUrl(profile.full_name),
  );
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const displayPhone = useMemo(() => formatPhone(phone), [phone]);

  async function handleAvatarChange(file?: File) {
    setMessage("");
    setIsError(false);

    if (!file) {
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setIsError(true);
      setMessage("Upload a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > maxAvatarSize) {
      setIsError(true);
      setMessage("Avatar image must be 2MB or smaller.");
      return;
    }

    setIsUploading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${profile.auth_user_id}/avatar.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        setIsError(true);
        setMessage(uploadError.message);
        return;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(`${data.publicUrl}?v=${Date.now()}`);
      setMessage("Avatar uploaded. Save your profile to keep it.");
    } finally {
      setIsUploading(false);
    }
  }

  function handleSave() {
    setMessage("");
    setIsError(false);

    const formData = new FormData();
    formData.set("fullName", fullName);
    formData.set("phone", phone);
    formData.set("avatarUrl", stripCacheBuster(avatarUrl));

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
        setIsEditing(false);
        router.refresh();
      }
    });
  }

  function handleCancel() {
    setFullName(profile.full_name);
    setPhone(profile.phone ?? "");
    setAvatarUrl(profile.avatar_url ?? getDefaultAvatarUrl(profile.full_name));
    setMessage("");
    setIsError(false);
    setIsEditing(false);
  }

  return (
    <div className="rounded-[2rem] border border-line bg-surface p-5 luxury-glow">
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt=""
          className="size-16 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold">{profile.full_name}</h1>
          <p className="truncate text-sm text-muted">{profile.email}</p>
          <p className="text-sm text-muted">{displayPhone || "Phone needed"}</p>
        </div>
      </div>

      {!isEditing ? (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="gold-gradient mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-black"
        >
          <Pencil size={16} />
          Edit Profile
        </button>
      ) : (
        <div className="mt-5 space-y-4 rounded-3xl border border-line bg-background p-4">
          <label className="block">
            <span className="text-sm font-medium text-muted">Full name</span>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="mt-2 h-11 w-full rounded-2xl border border-line bg-surface px-4 text-foreground"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-muted">Phone number</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              type="tel"
              inputMode="tel"
              placeholder="(949) 555-1234"
              className="mt-2 h-11 w-full rounded-2xl border border-line bg-surface px-4 text-foreground"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-muted">Profile picture</span>
            <span className="mt-2 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-line bg-surface px-4 text-sm font-bold text-gold">
              <Camera size={16} />
              {isUploading ? "Uploading..." : "Upload image"}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={isUploading || isPending}
              onChange={(event) => handleAvatarChange(event.target.files?.[0])}
              className="sr-only"
            />
          </label>

          {message ? (
            <p
              className={`rounded-2xl p-3 text-sm font-medium ${
                isError ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
              }`}
            >
              {message}
            </p>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isUploading || isPending}
              className="gold-gradient h-11 rounded-full px-4 text-sm font-black disabled:opacity-60"
            >
              {isPending ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isUploading || isPending}
              className="h-11 rounded-full border border-line px-4 text-sm font-semibold text-muted disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function stripCacheBuster(url: string) {
  return url.split("?v=")[0];
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 10) {
    return value;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
