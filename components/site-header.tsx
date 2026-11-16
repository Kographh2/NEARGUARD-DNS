import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { BRAND } from "@/lib/constants";

const navItems = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#install", label: "Install" },
  { href: "/privacy", label: "Privacy" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-near-950/80 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-full text-white no-underline"
          aria-label={`${BRAND} home`}
        >
          <BrandMark className="h-8 w-8" />
          <span className="text-sm font-semibold tracking-[0.16em] text-white">
            NEAR <span className="text-emerald-300">ADGUARD</span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-sm text-slate-400 no-underline transition hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <Link href="/login" className="btn-ghost no-underline">
            Sign in
          </Link>
          <Link href="/register" className="btn-primary no-underline">
            Create account
          </Link>
        </div>

        <details className="relative sm:hidden">
          <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-white/10 text-slate-300 [&::-webkit-details-marker]:hidden">
            <span className="sr-only">Open menu</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </summary>
          <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-white/10 bg-near-900 p-2 shadow-2xl">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-xl px-3 py-2 text-sm text-slate-300 no-underline hover:bg-white/5 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-white/10" />
            <Link
              href="/login"
              className="block rounded-xl px-3 py-2 text-sm text-slate-300 no-underline hover:bg-white/5 hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="mt-1 block rounded-xl bg-emerald-400 px-3 py-2 text-sm font-semibold text-slate-950 no-underline hover:bg-emerald-300"
            >
              Create account
            </Link>
          </div>
        </details>
      </div>
    </header>
  );
}
