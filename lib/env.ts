import "server-only";

import {
  CIRCUIT_BREAKER_THRESHOLDS,
  DECOY_ROTATION_SECONDS,
  HOBBY_MONTHLY_INVOCATIONS,
  RATE_LIMITS,
  RETENTION_DEFAULTS,
  UPSTREAM_DOH_URL,
  UPSTREAM_FALLBACK_DOH_URL,
  UPSTREAM_TIMEOUT_MS,
} from "@/lib/constants";
import { publicEnv } from "@/lib/public-env";

export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function optionalEnv(name: string, fallback = ""): string {
  return process.env[name]?.trim() || fallback;
}

export function getSupabaseUrl(): string {
  return requireEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabaseAnonKey(): string {
  return requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function getSupabaseServiceRoleKey(): string {
  return requireEnv("SUPABASE_SERVICE_ROLE_KEY");
}

export function getFirstAdminEmail(): string {
  return requireEnv("FIRST_ADMIN_EMAIL").toLowerCase();
}

export function getSupabaseDbUrl(): string {
  return requireEnv("SUPABASE_DB_URL");
}

export function getSupabaseProjectRef(): string {
  return requireEnv("SUPABASE_PROJECT_REF");
}

export function getAppUrl(): string {
  return publicEnv.appUrl.replace(/\/+$/, "");
}

function decodeBase64Key(name: string): Buffer {
  const raw = requireEnv(name);
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(`${name} must be a base64-encoded 32-byte key`);
  }
  return key;
}

export function getIpEncKey(): Buffer {
  return decodeBase64Key("IP_ENC_KEY");
}

export function getIpHmacKey(): Buffer {
  return decodeBase64Key("IP_HMAC_KEY");
}

export function getDeviceHmacKey(): Buffer {
  return decodeBase64Key("DEVICE_HMAC_KEY");
}

export function getDecoySecret(): Buffer {
  return decodeBase64Key("DECOY_SECRET");
}

export function getAdminPinPepper(): string {
  return optionalEnv("ADMIN_PIN_PEPPER");
}

export function getTurnstileSecretKey(): string {
  return requireEnv("TURNSTILE_SECRET_KEY");
}

export function getResendApiKey(): string {
  return requireEnv("RESEND_API_KEY");
}

export function getEmailFrom(): string {
  return optionalEnv(
    "EMAIL_FROM",
    "NEAR ADGUARD <noreply@nearguard.biz.id>",
  );
}

export function getCronSecret(): string {
  return requireEnv("CRON_SECRET");
}

export function getUpstreamConfig(): {
  primary: string;
  fallback: string;
  timeoutMs: number;
} {
  return {
    primary: optionalEnv("UPSTREAM_DOH_URL", UPSTREAM_DOH_URL),
    fallback: optionalEnv(
      "UPSTREAM_FALLBACK_DOH_URL",
      UPSTREAM_FALLBACK_DOH_URL,
    ),
    timeoutMs: getIntEnv("UPSTREAM_TIMEOUT_MS", UPSTREAM_TIMEOUT_MS, 500, 10_000),
  };
}

export function getRateLimitConfig(): {
  free: { perMinute: number; perDay: number };
  registered: { perMinute: number; perDay: number };
  devicePerMinute: number;
  registeredIpPerMinute: number;
  unknownPerMinute: number;
  newDevicesPerHour: number;
} {
  return {
    free: {
      perMinute: getIntEnv(
        "RATE_FREE_PER_MIN",
        RATE_LIMITS.free.perMinute,
        1,
        10_000,
      ),
      perDay: getIntEnv(
        "RATE_FREE_PER_DAY",
        RATE_LIMITS.free.perDay,
        1,
        1_000_000,
      ),
    },
    registered: {
      perMinute: getIntEnv(
        "RATE_USER_PER_MIN",
        RATE_LIMITS.registered.perMinute,
        1,
        10_000,
      ),
      perDay: getIntEnv(
        "RATE_USER_PER_DAY",
        RATE_LIMITS.registered.perDay,
        1,
        1_000_000,
      ),
    },
    devicePerMinute: getIntEnv(
      "RATE_DEVICE_PER_MIN",
      RATE_LIMITS.devicePerMinute,
      1,
      10_000,
    ),
    registeredIpPerMinute: getIntEnv(
      "RATE_REGISTERED_IP_PER_MIN",
      RATE_LIMITS.registeredIpPerMinute,
      1,
      10_000,
    ),
    unknownPerMinute: getIntEnv(
      "RATE_UNKNOWN_PER_MIN",
      RATE_LIMITS.unknownPerMinute,
      1,
      10_000,
    ),
    newDevicesPerHour: getIntEnv(
      "NEW_DEVICES_PER_HOUR",
      RATE_LIMITS.newDevicesPerHour,
      1,
      10_000,
    ),
  };
}

export function getCircuitBreakerConfig(): {
  monthlyInvocations: number;
  thresholds: {
    freeSoft: number;
    freeHard: number;
    registered: number;
    all: number;
  };
} {
  return {
    monthlyInvocations: getIntEnv(
      "HOBBY_MONTHLY_INVOCATIONS",
      HOBBY_MONTHLY_INVOCATIONS,
      1_000,
      1_000_000_000,
    ),
    thresholds: {
      freeSoft: getFloatEnv(
        "CIRCUIT_BREAKER_FREE_SOFT",
        CIRCUIT_BREAKER_THRESHOLDS.freeSoft,
      ),
      freeHard: getFloatEnv(
        "CIRCUIT_BREAKER_FREE_HARD",
        CIRCUIT_BREAKER_THRESHOLDS.freeHard,
      ),
      registered: getFloatEnv(
        "CIRCUIT_BREAKER_REGISTERED",
        CIRCUIT_BREAKER_THRESHOLDS.registered,
      ),
      all: getFloatEnv(
        "CIRCUIT_BREAKER_ALL",
        CIRCUIT_BREAKER_THRESHOLDS.all,
      ),
    },
  };
}

export function getRetentionConfig(): {
  blockedEventsDays: number;
  usageDailyDays: number;
  idleDevicesDays: number;
} {
  return {
    blockedEventsDays: getIntEnv(
      "RETENTION_BLOCKED_EVENTS_DAYS",
      RETENTION_DEFAULTS.blockedEventsDays,
      1,
      3_650,
    ),
    usageDailyDays: getIntEnv(
      "RETENTION_USAGE_DAILY_DAYS",
      RETENTION_DEFAULTS.usageDailyDays,
      1,
      3_650,
    ),
    idleDevicesDays: getIntEnv(
      "RETENTION_IDLE_DEVICES_DAYS",
      RETENTION_DEFAULTS.idleDevicesDays,
      1,
      3_650,
    ),
  };
}

export function getDecoyRotationSeconds(): number {
  return getIntEnv(
    "DECOY_ROTATION_SECONDS",
    DECOY_ROTATION_SECONDS,
    60,
    86_400,
  );
}

export function getVercelUsageConfig(): {
  token: string;
  teamId: string;
  projectId: string;
} | null {
  const token = optionalEnv("VERCEL_TOKEN");
  const teamId = optionalEnv("VERCEL_TEAM_ID");
  const projectId = optionalEnv("VERCEL_PROJECT_ID");
  if (!token || !teamId) {
    return null;
  }
  return { token, teamId, projectId };
}

function getIntEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return fallback;
  }
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value < min || value > max) {
    return fallback;
  }
  return value;
}

function getFloatEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return fallback;
  }
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value) || value <= 0 || value >= 1) {
    return fallback;
  }
  return value;
}
