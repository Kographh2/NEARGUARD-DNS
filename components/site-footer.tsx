import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { BRAND, DOMAIN } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-white/5">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-white no-underline"
          >
            <BrandMark className="h-8 w-8" />
            <span className="text-sm font-semibold tracking-[0.16em]">
              NEAR <span className="text-emerald-300">ADGUARD</span>
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-500">
            Private, ad-blocking DNS-over-HTTPS for iPhone, iPad, and Mac.
            No app. No Android. No query-name logging.
          </p>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Product
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/#features" className="text-slate-400 no-underline hover:text-white">
                Features
              </Link>
            </li>
            <li>
              <Link href="/#install" className="text-slate-400 no-underline hover:text-white">
                Install guide
              </Link>
            </li>
            <li>
              <Link href="/#faq" className="text-slate-400 no-underline hover:text-white">
                FAQ
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Account
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/login" className="text-slate-400 no-underline hover:text-white">
                Sign in
              </Link>
            </li>
            <li>
              <Link href="/register" className="text-slate-400 no-underline hover:text-white">
                Create account
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="text-slate-400 no-underline hover:text-white">
                Dashboard
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Trust
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/privacy" className="text-slate-400 no-underline hover:text-white">
                Privacy policy
              </Link>
            </li>
            <li>
              <a
                href={`https://${DOMAIN}/dns-query`}
                className="text-slate-400 no-underline hover:text-white"
              >
                Free DoH endpoint
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {BRAND} is a personal, non-commercial project on Vercel Hobby and
            Supabase Free.
          </p>
          <p>
            DNS filtering only. No app, no traffic interception, no Android
            support.
          </p>
        </div>
      </div>
    </footer>
  );
}
