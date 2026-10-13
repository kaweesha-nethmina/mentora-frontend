"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

function GoogleCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { completeGoogleLogin } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);
  const ticket = params.get("ticket");

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!ticket) {
      setError("Missing sign-in ticket. Please try again.");
      return;
    }

    (async () => {
      const result = await completeGoogleLogin(ticket);
      if (result.success) {
        router.replace("/dashboard");
      } else {
        setError(result.message || "Google sign-in failed. Please try again.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket]);

  if (error) {
    return (
      <div className="space-y-5 text-center py-2 animate-slide-up">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-xl font-extrabold text-foreground">Couldn&apos;t sign you in</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center justify-center h-11 px-6 rounded-lg bg-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center py-8" role="status" aria-live="polite">
      <div className="mx-auto w-10 h-10 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Completing Google sign-in…</p>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 text-center py-8" role="status" aria-live="polite">
          <div className="mx-auto w-10 h-10 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Completing Google sign-in…</p>
        </div>
      }
    >
      <GoogleCallbackInner />
    </Suspense>
  );
}
