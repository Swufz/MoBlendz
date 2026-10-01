"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Camera } from "lucide-react";
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
  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(
    profile.avatar_url ?? getDefaultAvatarUrl(profile.full_name),
  );
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

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

        <label className="profile-image-upload block">
          <span className="text-sm font-medium text-muted">Profile picture</span>
          <span className="mt-2 flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-line bg-surface px-3 text-sm font-semibold text-gold">
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
          <span className="mt-2 block text-xs text-muted">JPG, PNG, or WebP. Maximum 2 MB.</span>
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
            disabled={isUploading || isPending}
            className="h-10 rounded-md bg-gold px-4 text-sm font-semibold text-background disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Save changes"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isUploading || isPending}
            className="h-10 rounded-md border border-line px-4 text-sm font-semibold text-muted disabled:opacity-60"
          >
            Reset changes
          </button>
        </div>
      </div>
    </form>
  );
}

function stripCacheBuster(url: string) {
  return url.split("?v=")[0];
}
