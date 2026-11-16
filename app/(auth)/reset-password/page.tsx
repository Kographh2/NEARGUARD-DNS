import type { Metadata } from "next";
import Link from "next/link";

import { PasswordField } from "@/components/ui/password-field";

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Choose a new password for your NEAR ADGUARD account.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="card">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
        Account recovery
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">
        Choose a new password
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Use at least 12 characters, including a letter and a number. The reset
        link is single-use and expires quickly.
      </p>

      <form action="/api/auth/reset-password" method="post" className="mt-7 space-y-4">
        <input type="hidden" name="token" value={token ?? ""} />

        <PasswordField
          name="password"
          label="New password"
          autoComplete="new-password"
          placeholder="At least 12 characters"
          minLength={12}
          hint="At least 12 characters, including a letter and a number."
        />

        <PasswordField
          name="confirmPassword"
          label="Confirm new password"
          autoComplete="new-password"
          placeholder="Repeat your new password"
          minLength={12}
        />

        <button type="submit" className="btn-primary w-full">
          Update password
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Need a new link?{" "}
        <Link
          href="/forgot-password"
          className="font-medium text-emerald-300 no-underline hover:text-emerald-200"
        >
          Request another
        </Link>
      </p>
    </div>
  );
}
