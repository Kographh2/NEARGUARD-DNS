import type { Metadata } from "next";
import Link from "next/link";

import { PasswordField } from "@/components/ui/password-field";
import { TurnstileWidget } from "@/components/ui/turnstile-widget";
import { publicEnv } from "@/lib/public-env";

export const metadata: Metadata = {
  title: "Buat akun",
  description: "Buat akun NEAR ADGUARD gratis.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <div className="panel">
      <h1 className="section-title">Buat akun</h1>
      <p className="section-copy">
        Username menjadi path DoH pribadi kamu. Username adalah pengenal, bukan
        rahasia.
      </p>

      {error ? (
        <p role="alert" className="notice notice-error mt-4">
          {error.slice(0, 240)}
        </p>
      ) : null}

      <form action="/api/auth/register" method="post" className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="label">
            Nama
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={80}
            className="input"
            placeholder="Nama kamu"
          />
        </div>

        <div>
          <label htmlFor="username" className="label">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            minLength={3}
            maxLength={20}
            pattern="[a-z][a-z0-9_-]{2,19}"
            className="input"
            placeholder="namakamu"
            aria-describedby="username-hint"
          />
          <p id="username-hint" className="field-hint">
            3 sampai 20 huruf kecil, angka, garis bawah, atau tanda hubung.
            Harus diawali huruf. Nama yang dipakai route ditolak.
          </p>
        </div>

        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            className="input"
            placeholder="nama@contoh.com"
          />
        </div>

        <PasswordField
          name="password"
          label="Kata sandi"
          autoComplete="new-password"
          placeholder="Minimal 12 karakter"
          minLength={12}
          hint="Minimal 12 karakter, termasuk satu huruf dan satu angka."
        />

        <PasswordField
          name="confirmPassword"
          label="Ulangi kata sandi"
          autoComplete="new-password"
          placeholder="Ulangi kata sandi"
          minLength={12}
        />

        <TurnstileWidget
          siteKey={publicEnv.turnstileSiteKey}
          action="register"
        />

        <button type="submit" className="btn-primary w-full">
          Buat akun
        </button>
      </form>

      <p className="small mt-5">
        Sudah punya akun? <Link href="/login">Masuk</Link>.
      </p>
    </div>
  );
}
