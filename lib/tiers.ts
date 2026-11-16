import { usernameSchema } from "@/lib/validation";

export type AccountStatus = "active" | "suspended";

export interface TierInfo {
  tier: "registered";
  username: string;
  userId: string;
  status: AccountStatus;
  logBlocked: boolean;
}

interface CacheEntry {
  value: TierInfo | null;
  expiresAt: number;
}

const CACHE_TTL_MS = 60_000;
const NEGATIVE_CACHE_TTL_MS = 30_000;
const cache = new Map<string, CacheEntry>();

export function normalizeUsernamePath(value: string): string | null {
  const parsed = usernameSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function resolveTier(username: string, now = Date.now()): TierInfo | null {
  const normalized = normalizeUsernamePath(username);
  if (!normalized) {
    return null;
  }
  const entry = cache.get(normalized);
  if (!entry) {
    cache.set(normalized, {
      value: null,
      expiresAt: now + NEGATIVE_CACHE_TTL_MS,
    });
    return null;
  }
  if (entry.expiresAt <= now) {
    cache.set(normalized, {
      value: null,
      expiresAt: now + NEGATIVE_CACHE_TTL_MS,
    });
    return null;
  }
  return entry.value;
}

export function setTierCache(
  username: string,
  value: TierInfo | null,
  now = Date.now(),
): void {
  const normalized = normalizeUsernamePath(username);
  if (!normalized) {
    return;
  }
  cache.set(normalized, {
    value,
    expiresAt: now + CACHE_TTL_MS,
  });
}

export function clearTierCache(): void {
  cache.clear();
}
