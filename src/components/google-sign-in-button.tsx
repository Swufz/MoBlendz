"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function GoogleSignInButton() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignIn() {
    setError("");
    setIsLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signInError) {
        setError(signInError.message);
        setIsLoading(false);
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not start Google sign in.",
      );
      setIsLoading(false);
    }
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={handleSignIn}
        disabled={isLoading}
        className="h-12 w-full rounded-md bg-foreground px-5 font-semibold text-background disabled:opacity-60"
      >
        {isLoading ? "Redirecting..." : "Continue with Google"}
      </button>
      {error ? <p className="mt-3 text-sm font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
