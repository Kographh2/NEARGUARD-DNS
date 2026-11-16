import {
  CIRCUIT_BREAKER_THRESHOLDS,
  HOBBY_MONTHLY_INVOCATIONS,
} from "@/lib/constants";

export type CircuitMode =
  | "normal"
  | "free-soft"
  | "free-hard"
  | "registered-hard"
  | "all-hard";

export type CircuitTier = "free" | "registered" | "admin";

export class CircuitBreaker {
  private monthlyUsage = 0;
  private updatedAt = 0;

  setMonthlyUsage(count: number, now = Date.now()): void {
    this.monthlyUsage = Math.max(0, Math.floor(count));
    this.updatedAt = now;
  }

  getMonthlyUsage(): number {
    return this.monthlyUsage;
  }

  getUpdatedAt(): number {
    return this.updatedAt;
  }

  getFraction(): number {
    return this.monthlyUsage / HOBBY_MONTHLY_INVOCATIONS;
  }

  getMode(): CircuitMode {
    const fraction = this.getFraction();
    if (fraction >= CIRCUIT_BREAKER_THRESHOLDS.all) {
      return "all-hard";
    }
    if (fraction >= CIRCUIT_BREAKER_THRESHOLDS.registered) {
      return "registered-hard";
    }
    if (fraction >= CIRCUIT_BREAKER_THRESHOLDS.freeHard) {
      return "free-hard";
    }
    if (fraction >= CIRCUIT_BREAKER_THRESHOLDS.freeSoft) {
      return "free-soft";
    }
    return "normal";
  }

  isThrottled(tier: CircuitTier): boolean {
    if (tier === "admin") {
      return false;
    }
    const fraction = this.getFraction();
    if (tier === "free") {
      return fraction >= CIRCUIT_BREAKER_THRESHOLDS.freeSoft;
    }
    return fraction >= CIRCUIT_BREAKER_THRESHOLDS.registered;
  }

  reset(): void {
    this.monthlyUsage = 0;
    this.updatedAt = 0;
  }
}

export const circuitBreaker = new CircuitBreaker();
