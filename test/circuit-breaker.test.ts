import { describe, expect, it } from "vitest";

import { CircuitBreaker } from "@/lib/circuit-breaker";
import { HOBBY_MONTHLY_INVOCATIONS } from "@/lib/constants";

describe("CircuitBreaker", () => {
  it("reports normal mode below 60 percent", () => {
    const breaker = new CircuitBreaker();
    breaker.setMonthlyUsage(599_999);
    expect(breaker.getMode()).toBe("normal");
    expect(breaker.isThrottled("free")).toBe(false);
    expect(breaker.isThrottled("registered")).toBe(false);
    expect(breaker.isThrottled("admin")).toBe(false);
  });

  it("starts throttling free traffic at 60 percent", () => {
    const breaker = new CircuitBreaker();
    breaker.setMonthlyUsage(600_000);
    expect(breaker.getMode()).toBe("free-soft");
    expect(breaker.isThrottled("free")).toBe(true);
    expect(breaker.isThrottled("registered")).toBe(false);
    expect(breaker.isThrottled("admin")).toBe(false);
  });

  it("hard-throttles free traffic at 75 percent", () => {
    const breaker = new CircuitBreaker();
    breaker.setMonthlyUsage(750_000);
    expect(breaker.getMode()).toBe("free-hard");
    expect(breaker.isThrottled("free")).toBe(true);
    expect(breaker.isThrottled("registered")).toBe(false);
  });

  it("throttles registered traffic at 90 percent", () => {
    const breaker = new CircuitBreaker();
    breaker.setMonthlyUsage(900_000);
    expect(breaker.getMode()).toBe("registered-hard");
    expect(breaker.isThrottled("free")).toBe(true);
    expect(breaker.isThrottled("registered")).toBe(true);
    expect(breaker.isThrottled("admin")).toBe(false);
  });

  it("throttles everything at 95 percent", () => {
    const breaker = new CircuitBreaker();
    breaker.setMonthlyUsage(950_000);
    expect(breaker.getMode()).toBe("all-hard");
    expect(breaker.isThrottled("free")).toBe(true);
    expect(breaker.isThrottled("registered")).toBe(true);
    expect(breaker.isThrottled("admin")).toBe(false);
  });

  it("tracks the fraction of the Hobby cap", () => {
    const breaker = new CircuitBreaker();
    breaker.setMonthlyUsage(HOBBY_MONTHLY_INVOCATIONS / 2);
    expect(breaker.getFraction()).toBe(0.5);
    expect(breaker.getMonthlyUsage()).toBe(500_000);
  });

  it("clamps negative usage and resets", () => {
    const breaker = new CircuitBreaker();
    breaker.setMonthlyUsage(-10);
    expect(breaker.getMonthlyUsage()).toBe(0);
    breaker.setMonthlyUsage(100);
    breaker.reset();
    expect(breaker.getMonthlyUsage()).toBe(0);
    expect(breaker.getMode()).toBe("normal");
  });
});
