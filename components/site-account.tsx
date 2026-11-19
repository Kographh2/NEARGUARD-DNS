"use client";

import Link from "next/link";

import { useSignedIn } from "@/components/use-signed-in";

export function SiteAccountNav() {
  const signedIn = useSignedIn();

  if (signedIn) {
    return (
      <>
        <Link href="/dashboard">Dashboard</Link>
        <form action="/api/auth/logout" method="post" className="nav-form">
          <button type="submit" className="nav-button">
            Keluar
          </button>
        </form>
      </>
    );
  }

  return (
    <>
      <Link href="/login">Masuk</Link>
      <Link href="/register" className="btn-primary">
        Buat akun
      </Link>
    </>
  );
}

export function SiteAccountLinks() {
  const signedIn = useSignedIn();

  if (signedIn) {
    return (
      <>
        <Link href="/dashboard">Dashboard</Link>
        <form action="/api/auth/logout" method="post" className="nav-form">
          <button type="submit" className="nav-button">
            Keluar
          </button>
        </form>
      </>
    );
  }

  return (
    <>
      <Link href="/register">Buat akun</Link>
      <Link href="/login">Masuk</Link>
    </>
  );
}
