import { describe, expect, it } from "vitest";

import { getClientIp, RateLimiter } from "@/lib/ratelimit";

describe("RateLimiter", () => {
  it("enforces the free per-minute limit", () => {
    const limiter = new RateLimiter();
    for (let index = 0; index < 120; index += 1) {
      expect(limiter.checkFree("ip", 0).allowed).toBe(true);
    }
    const result = limiter.checkFree("ip", 0);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("minute");
  });

  it("enforces the free per-day limit", () => {
    const limiter = new RateLimiter();
    for (let index = 0; index < 3_000; index += 1) {
      const now = Math.floor(index / 120) * 61_000 + (index % 120);
      expect(limiter.checkFree("ip", now).allowed).toBe(true);
    }
    const result = limiter.checkFree("ip", 26 * 61_000);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("day");
  });

  it("enforces the unknown-username limit", () => {
    const limiter = new RateLimiter();
    for (let index = 0; index < 20; index += 1) {
      expect(limiter.checkUnknown("ip", 0).allowed).toBe(true);
    }
    const result = limiter.checkUnknown("ip", 0);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("unknown");
  });

  it("enforces the new-device limit", () => {
    const limiter = new RateLimiter();
    for (let index = 0; index < 20; index += 1) {
      expect(limiter.checkNewDevice("ip", 0).allowed).toBe(true);
    }
    const result = limiter.checkNewDevice("ip", 0);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("new-device");
  });

  it("enforces the per-device limit before the account limit", () => {
    const limiter = new RateLimiter();
    for (let index = 0; index < 100; index += 1) {
      expect(
        limiter.checkRegistered(
          { accountId: "account", ip: "ip", deviceKey: "device" },
          0,
        ).allowed,
      ).toBe(true);
    }
    const result = limiter.checkRegistered(
      { accountId: "account", ip: "ip", deviceKey: "device" },
      0,
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("device");
  });

  it("enforces the registered account limit", () => {
    const limiter = new RateLimiter();
    for (let index = 0; index < 200; index += 1) {
      expect(
        limiter.checkRegistered(
          {
            accountId: "account",
            ip: "ip",
            deviceKey: `device-${index}`,
          },
          0,
        ).allowed,
      ).toBe(true);
    }
    const result = limiter.checkRegistered(
      { accountId: "account", ip: "ip", deviceKey: "device-extra" },
      0,
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("minute");
  });

  it("exposes usage for the dashboard", () => {
    const limiter = new RateLimiter();
    for (let index = 0; index < 5; index += 1) {
      limiter.checkFree("ip", 0);
    }
    expect(limiter.getMinuteUsage("free:m:ip", 0)).toBe(5);
    expect(limiter.getDayUsage("free:d:ip", 0)).toBe(5);
  });

  it("resets all counters", () => {
    const limiter = new RateLimiter();
    limiter.checkFree("ip", 0);
    limiter.reset();
    expect(limiter.getMinuteUsage("free:m:ip", 0)).toBe(0);
    expect(limiter.getDayUsage("free:d:ip", 0)).toBe(0);
  });
});

describe("getClientIp", () => {
  it("uses the first forwarded address", () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(request)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    const request = new Request("https://example.com", {
      headers: { "x-real-ip": "9.9.9.9" },
    });
    expect(getClientIp(request)).toBe("9.9.9.9");
  });

  it("returns a stable placeholder when no address is present", () => {
    const request = new Request("https://example.com");
    expect(getClientIp(request)).toBe("unknown");
  });
});
