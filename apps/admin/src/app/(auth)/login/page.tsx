"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLogin } from "../../../lib/hooks/use-auth";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { mutate: login, isPending } = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(
      { email, password },
      {
        onSuccess: () => {
          toast.success("Signed in");
          router.push("/");
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || "We couldn't sign you in. Check your details and try again.");
        },
      }
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg">
        {/* Gold hairline — the same accent that marks your place in the rail */}
        <div className="h-1 w-full bg-[var(--color-accent-500)]" />

        <div className="p-8">
          <div className="flex flex-col items-center text-center">
            <img
              src="/brand/kuapa-icon.svg"
              alt="Kuapa"
              className="h-14 w-14 rounded-2xl shadow-sm"
            />
            <div className="mt-4 flex flex-col items-center">
              <span className="font-[family-name:var(--font-heading)] text-2xl font-bold tracking-tight text-[var(--color-text)]">
                Kuapa
              </span>
              <span className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-accent-600)]">
                Farm to Market · Admin
              </span>
            </div>
            <h2 className="mt-6 text-lg font-semibold text-[var(--color-text)]">Welcome back</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Sign in to manage farmers, harvests &amp; deliveries.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label htmlFor="email-address" className="text-sm font-medium text-[var(--color-text)]">
                Email
              </label>
              <Input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@kuapa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-[var(--color-text)]">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" size="lg" className="w-full" isLoading={isPending}>
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
