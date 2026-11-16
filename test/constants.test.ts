import { describe, expect, it } from "vitest";

import {
  CIRCUIT_BREAKER_THRESHOLDS,
  HOBBY_MONTHLY_INVOCATIONS,
  isReservedUsername,
  RATE_LIMITS,
  RESERVED_TOP_LEVEL_SEGMENTS,
} from "@/lib/constants";

describe("reserved routes", () => {
  it("protects every current top-level route", () => {
    for (const segment of [
      "login",
      "register",
      "forgot-password",
      "reset-password",
      "dashboard",
      "admin",
      "privacy",
      "dns-query",
      "nearguard.mobileconfig",
      "api",
      "_next",
    ]) {
      expect(RESERVED_TOP_LEVEL_SEGMENTS.has(segment)).toBe(true);
    }
  });

  it("matches reserved usernames case-insensitively", () => {
    expect(isReservedUsername("LOGIN")).toBe(true);
    expect(isReservedUsername("  Dashboard  ")).toBe(true);
    expect(isReservedUsername("not-reserved")).toBe(false);
  });
});

describe("locked rate limits", () => {
  it("matches the final free-tier limits", () => {
    expect(RATE_LIMITS.free.perMinute).toBe(120);
    expect(RATE_LIMITS.free.perDay).toBe(3_000);
  });

  it("matches the final registered limits", () => {
    expect(RATE_LIMITS.registered.perMinute).toBe(200);
    expect(RATE_LIMITS.registered.perDay).toBe(8_000);
  });

  it("matches the guard and device limits", () => {
    expect(RATE_LIMITS.devicePerMinute).toBe(100);
    expect(RATE_LIMITS.registeredIpPerMinute).toBe(300);
    expect(RATE_LIMITS.unknownPerMinute).toBe(20);
    expect(RATE_LIMITS.newDevicesPerHour).toBe(20);
  });
});

describe("circuit breaker", () => {
  it("uses the final 60/75/90/95 thresholds", () => {
    expect(CIRCUIT_BREAKER_THRESHOLDS.freeSoft).toBe(0.6);
    expect(CIRCUIT_BREAKER_THRESHOLDS.freeHard).toBe(0.75);
    expect(CIRCUIT_BREAKER_THRESHOLDS.registered).toBe(0.9);
    expect(CIRCUIT_BREAKER_THRESHOLDS.all).toBe(0.95);
  });

  it("uses the Hobby invocation cap", () => {
    expect(HOBBY_MONTHLY_INVOCATIONS).toBe(1_000_000);
  });
});
