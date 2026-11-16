import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-20">
      <div className="card max-w-lg text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300">
          404
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">
          That path does not resolve.
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          The page or DoH path you requested does not exist. If you were trying
          to use a personal DoH URL, check the username in your dashboard.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary no-underline">
            Back to home
          </Link>
          <Link href="/dashboard" className="btn-secondary no-underline">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
