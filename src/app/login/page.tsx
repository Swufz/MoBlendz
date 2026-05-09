import { Scissors } from "lucide-react";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { BRAND_NAME } from "@/lib/config";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <section className="w-full max-w-md rounded-[2rem] border border-line bg-surface p-6 text-center shadow-sm">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-barber-blue">
          <Scissors />
        </div>
        <h1 className="mt-5 text-3xl font-semibold">{BRAND_NAME}</h1>
        <p className="mt-3 text-muted">
          Sign in to book, track loyalty progress, and manage your appointments.
        </p>
        <GoogleSignInButton />
      </section>
    </main>
  );
}
