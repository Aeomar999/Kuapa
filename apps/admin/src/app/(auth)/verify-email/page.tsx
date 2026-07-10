"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, Loader2, Smartphone, ArrowRight, Sprout } from "lucide-react";
import { Button } from "../../../components/ui/Button";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No verification token found in the URL. Please check the link from your email.");
      return;
    }

    const verifyToken = async () => {
      setStatus("loading");
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
        const res = await fetch(`${apiUrl}/v1/auth/verify-email?token=${encodeURIComponent(token)}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Failed to verify email token. It may have expired.");
        }

        setStatus("success");
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(err.message || "Unable to verify email address at this time.");
      }
    };

    verifyToken();
  }, [token]);

  const handleOpenApp = () => {
    window.location.href = token ? `kuapa://verify-email?token=${token}` : "kuapa://";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-[var(--color-card)] p-8 shadow-xl border border-[var(--color-border)] text-center">
        {/* Logo Header */}
        <div className="flex flex-col items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/30">
            <Sprout className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-[var(--color-text)]">
            Kuapa AgriMarket
          </h2>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mt-1">
            Email Verification Portal
          </p>
        </div>

        {/* Loading State */}
        {status === "loading" && (
          <div className="py-8 space-y-4">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-emerald-600" />
            <h3 className="text-lg font-semibold text-[var(--color-text)]">
              Verifying your email...
            </h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              Please hold on while we confirm your account token.
            </p>
          </div>
        )}

        {/* Success State */}
        {status === "success" && (
          <div className="py-6 space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[var(--color-text)]">
                Email Successfully Verified!
              </h3>
              <p className="text-sm text-[var(--color-text-muted)]">
                Your email address has been confirmed. You now have full access to produce listings, price negotiations, and Aboboyaa transport booking.
              </p>
            </div>
            <div className="pt-3 space-y-3">
              <Button
                onClick={handleOpenApp}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                <Smartphone className="h-4 w-4" />
                Open Kuapa AgriMarket App
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/login")}
                className="w-full text-sm"
              >
                Go to Admin Portal
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div className="py-6 space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40 text-red-600">
              <AlertCircle className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[var(--color-text)]">
                Verification Issue
              </h3>
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                {errorMessage}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] pt-1">
                You can also enter your 6-digit OTP verification code directly in the Kuapa mobile app.
              </p>
            </div>
            <div className="pt-3">
              <Button
                onClick={handleOpenApp}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl shadow-md"
              >
                Verify via Mobile App
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
