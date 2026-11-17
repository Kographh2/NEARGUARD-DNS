"use client";

import { useEffect, useState } from "react";

export function CopyButton({
  value,
  label = "Salin",
  className = "btn-secondary",
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = window.setTimeout(() => setCopied(false), 2_000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={className}
      aria-label={copied ? "Tersalin" : label}
      aria-live="polite"
    >
      {copied ? "Tersalin" : label}
    </button>
  );
}
