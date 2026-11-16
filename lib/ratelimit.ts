import { RATE_LIMITS } from "@/lib/constants";

export type RateLimitReason =
  | "minute"
  | "day"
  | "device"
  | "ip"
  | "unknown"
  | "new-device";

export interface RateLimitResult {
  allowed: boolean;
  reason?: RateLimitReason;
  limit?: number;
  resetAt?: number;
}

interface DayCounter {
  day: string;
  count: number;
}

interface FixedCounter {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private readonly minute = new Map<string, number[]>();
  private readonly day = new Map<string, DayCounter>();
  private readonly fixed = new Map<string, FixedCounter>();
  private lastCleanup = 0;

  checkFree(ip: string, now = Date.now()): RateLimitResult {
    const minute = this.checkMinute(
      `free:m:${ip}`,
      RATE_LIMITS.free.perMinute,
      now,
    );
    if (!minute.allowed) {
      return { ...minute, reason: "minute" };
    }
    const day = this.checkDay(
      `free:d:${ip}`,
      RATE_LIMITS.free.perDay,
      now,
    );
    if (!day.allowed) {
      return { ...day, reason: "day" };
    }
    return { allowed: true };
  }

  checkUnknown(ip: string, now = Date.now()): RateLimitResult {
    const result = this.checkMinute(
      `unknown:m:${ip}`,
      RATE_LIMITS.unknownPerMinute,
      now,
    );
    if (!result.allowed) {
      return { ...result, reason: "unknown" };
    }
    return { allowed: true };
  }

  checkNewDevice(ip: string, now = Date.now()): RateLimitResult {
    const result = this.checkFixed(
      `newdev:h:${ip}`,
      RATE_LIMITS.newDevicesPerHour,
      60 * 60 * 1000,
      now,
    );
    if (!result.allowed) {
      return { ...result, reason: "new-device" };
    }
    return { allowed: true };
  }

  checkRegistered(
    input: { accountId: string; ip: string; deviceKey: string },
    now = Date.now(),
  ): RateLimitResult {
    const ipGuard = this.checkMinute(
      `reg:ip:${input.ip}`,
      RATE_LIMITS.registeredIpPerMinute,
      now,
    );
    if (!ipGuard.allowed) {
      return { ...ipGuard, reason: "ip" };
    }

    const accountMinute = this.checkMinute(
      `reg:acct:m:${input.accountId}`,
      RATE_LIMITS.registered.perMinute,
      now,
    );
    if (!accountMinute.allowed) {
      return { ...accountMinute, reason: "minute" };
    }

    const accountDay = this.checkDay(
      `reg:acct:d:${input.accountId}`,
      RATE_LIMITS.registered.perDay,
      now,
    );
    if (!accountDay.allowed) {
      return { ...accountDay, reason: "day" };
    }

    const device = this.checkMinute(
      `reg:dev:${input.deviceKey}`,
      RATE_LIMITS.devicePerMinute,
      now,
    );
    if (!device.allowed) {
      return { ...device, reason: "device" };
    }

    return { allowed: true };
  }

  getMinuteUsage(key: string, now = Date.now()): number {
    const windowStart = now - 60_000;
    const values = this.minute.get(key);
    if (!values) {
      return 0;
    }
    return values.filter((value) => value >= windowStart).length;
  }

  getDayUsage(key: string, now = Date.now()): number {
    const day = utcDay(now);
    return this.day.get(`${key}:${day}`)?.count ?? 0;
  }

  reset(): void {
    this.minute.clear();
    this.day.clear();
    this.fixed.clear();
    this.lastCleanup = 0;
  }

  private checkMinute(
    key: string,
    limit: number,
    now: number,
  ): RateLimitResult {
    this.maybeCleanup(now);
    const windowStart = now - 60_000;
    const values = (this.minute.get(key) ?? []).filter(
      (value) => value >= windowStart,
    );
    if (values.length >= limit) {
      const oldest = values[0] ?? now;
      return {
        allowed: false,
        limit,
        resetAt: oldest + 60_000,
      };
    }
    values.push(now);
    this.minute.set(key, values);
    return { allowed: true, limit, resetAt: now + 60_000 };
  }

  private checkDay(key: string, limit: number, now: number): RateLimitResult {
    this.maybeCleanup(now);
    const day = utcDay(now);
    const mapKey = `${key}:${day}`;
    const entry = this.day.get(mapKey);
    const count = entry?.day === day ? entry.count : 0;
    if (count >= limit) {
      return {
        allowed: false,
        limit,
        resetAt: nextUtcMidnight(now),
      };
    }
    this.day.set(mapKey, { day, count: count + 1 });
    return { allowed: true, limit, resetAt: nextUtcMidnight(now) };
  }

  private checkFixed(
    key: string,
    limit: number,
    windowMs: number,
    now: number,
  ): RateLimitResult {
    this.maybeCleanup(now);
    const entry = this.fixed.get(key);
    if (!entry || entry.resetAt <= now) {
      this.fixed.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, limit, resetAt: now + windowMs };
    }
    if (entry.count >= limit) {
      return { allowed: false, limit, resetAt: entry.resetAt };
    }
    entry.count += 1;
    return { allowed: true, limit, resetAt: entry.resetAt };
  }

  private maybeCleanup(now: number): void {
    if (now - this.lastCleanup < 60_000) {
      return;
    }
    this.lastCleanup = now;
    const windowStart = now - 60_000;
    for (const [key, values] of this.minute) {
      const active = values.filter((value) => value >= windowStart);
      if (active.length === 0) {
        this.minute.delete(key);
      } else {
        this.minute.set(key, active);
      }
    }
    const currentDay = utcDay(now);
    for (const [key, entry] of this.day) {
      if (entry.day !== currentDay && entry.day !== utcDay(now - 86_400_000)) {
        this.day.delete(key);
      }
    }
    for (const [key, entry] of this.fixed) {
      if (entry.resetAt <= now) {
        this.fixed.delete(key);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first.slice(0, 64);
    }
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp.slice(0, 64);
  }
  return "unknown";
}

function utcDay(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

function nextUtcMidnight(now: number): number {
  const date = new Date(now);
  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + 1,
    0,
    0,
    0,
    0,
  );
}
