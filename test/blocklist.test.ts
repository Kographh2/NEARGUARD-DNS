import { describe, expect, it } from "vitest";

import { Blocklist } from "@/lib/dns/blocklist";

describe("Blocklist", () => {
  const blocklist = new Blocklist({
    blocked: [
      "ads.example.com",
      "tracker.net",
      "example.org",
      "singlelabel",
    ],
    allowed: ["safe.example.com", "allow.example.org"],
  });

  it("matches exact domains", () => {
    expect(blocklist.isBlocked("ads.example.com")).toBe(true);
    expect(blocklist.isBlocked("tracker.net")).toBe(true);
  });

  it("matches parent domains", () => {
    expect(blocklist.isBlocked("sub.ads.example.com")).toBe(true);
    expect(blocklist.isBlocked("a.b.tracker.net")).toBe(true);
  });

  it("does not block unrelated domains", () => {
    expect(blocklist.isBlocked("example.com")).toBe(false);
    expect(blocklist.isBlocked("not-tracker.net")).toBe(false);
  });

  it("never blocks a bare TLD", () => {
    expect(blocklist.isBlocked("com")).toBe(false);
    expect(blocklist.isBlocked("net")).toBe(false);
    expect(blocklist.isBlocked("org")).toBe(false);
  });

  it("lets the allowlist override exact and parent matches", () => {
    expect(blocklist.isBlocked("safe.example.com")).toBe(false);
    expect(blocklist.isBlocked("sub.safe.example.com")).toBe(false);
    expect(blocklist.isBlocked("allow.example.org")).toBe(false);
    expect(blocklist.isBlocked("sub.allow.example.org")).toBe(false);
  });

  it("ignores single-label entries from the artifact", () => {
    expect(blocklist.size).toBe(3);
    expect(blocklist.isBlocked("singlelabel")).toBe(false);
  });

  it("protects the service's own domains", () => {
    expect(blocklist.isBlocked("dns.nearguard.biz.id")).toBe(false);
    expect(blocklist.isBlocked("supabase.co")).toBe(false);
    expect(blocklist.isBlocked("vercel.app")).toBe(false);
  });

  it("normalizes case and trailing dots", () => {
    expect(blocklist.isBlocked("ADS.EXAMPLE.COM.")).toBe(true);
    expect(blocklist.isBlocked("SAFE.EXAMPLE.COM.")).toBe(false);
  });
});
