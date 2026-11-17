import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { normalizeDnsName } from "@/lib/dns/wire";

export const BLOCKLIST_HASH_BYTES = 8;
export const BLOCKLIST_ENTRY_BYTES = BLOCKLIST_HASH_BYTES + 1;

export interface BlocklistData {
  version?: string;
  generatedAt?: string;
  blocked: string[];
  allowed?: string[];
  categories?: Record<string, number>;
}

export interface DomainBlocklist {
  readonly size: number;
  match(name: string): number | null;
  isBlocked(name: string): boolean;
}

export const DEFAULT_ALLOWLIST = [
  "nearguard.biz.id",
  "dns.nearguard.biz.id",
  "supabase.co",
  "supabase.in",
  "vercel.app",
  "vercel.com",
  "cloudflare.com",
  "dns.google",
  "amiprotected.it",
  "www.amiprotected.it",
] as const;

export class Blocklist implements DomainBlocklist {
  private readonly blocked: ReadonlySet<string>;
  private readonly allowed: ReadonlySet<string>;
  private readonly categories: ReadonlyMap<string, number>;

  constructor(data: BlocklistData) {
    this.blocked = normalizeSet(data.blocked);
    this.allowed = normalizeSet([
      ...DEFAULT_ALLOWLIST,
      ...(data.allowed ?? []),
    ]);
    this.categories = normalizeCategories(data.categories);
  }

  get size(): number {
    return this.blocked.size;
  }

  match(name: string): number | null {
    const normalized = normalizeDnsName(name);
    if (
      normalized.length === 0 ||
      normalized === "." ||
      !normalized.includes(".")
    ) {
      return null;
    }
    if (matches(this.allowed, normalized)) {
      return null;
    }

    const labels = normalized.split(".");
    for (let index = 0; index < labels.length; index += 1) {
      const candidate = labels.slice(index).join(".");
      if (!candidate.includes(".")) {
        continue;
      }
      if (this.blocked.has(candidate)) {
        return this.categories.get(candidate) ?? 1;
      }
    }
    return null;
  }

  isBlocked(name: string): boolean {
    return this.match(name) !== null;
  }
}

export class HashedBlocklist implements DomainBlocklist {
  private readonly hashes: Uint8Array;
  private readonly allowed: ReadonlySet<string>;
  private readonly count: number;

  constructor(hashes: Uint8Array, allowed: Iterable<string> = []) {
    if (hashes.length % BLOCKLIST_ENTRY_BYTES !== 0) {
      throw new Error("Blocklist artifact length is not a multiple of 9 bytes");
    }
    this.hashes = hashes;
    this.count = hashes.length / BLOCKLIST_ENTRY_BYTES;
    this.allowed = normalizeSet([...DEFAULT_ALLOWLIST, ...allowed]);
  }

  get size(): number {
    return this.count;
  }

  match(name: string): number | null {
    if (this.count === 0) {
      return null;
    }

    const normalized = normalizeDnsName(name);
    if (
      normalized.length === 0 ||
      normalized === "." ||
      !normalized.includes(".")
    ) {
      return null;
    }
    if (matches(this.allowed, normalized)) {
      return null;
    }

    let candidate = normalized;
    while (candidate.includes(".")) {
      const category = this.categoryForHash(hashDomain(candidate));
      if (category !== null) {
        return category;
      }
      const dot = candidate.indexOf(".");
      candidate = candidate.slice(dot + 1);
    }
    return null;
  }

  isBlocked(name: string): boolean {
    return this.match(name) !== null;
  }

  hasHash(hash: Uint8Array): boolean {
    return this.categoryForHash(hash) !== null;
  }

  categoryForHash(hash: Uint8Array): number | null {
    if (hash.length !== BLOCKLIST_HASH_BYTES) {
      throw new Error("Blocklist hash must be exactly 8 bytes");
    }

    let low = 0;
    let high = this.count - 1;
    while (low <= high) {
      const middle = (low + high) >>> 1;
      const offset = middle * BLOCKLIST_ENTRY_BYTES;
      const comparison = compareHashAt(this.hashes, offset, hash);
      if (comparison === 0) {
        return this.hashes[offset + BLOCKLIST_HASH_BYTES] || 1;
      }
      if (comparison < 0) {
        low = middle + 1;
      } else {
        high = middle - 1;
      }
    }
    return null;
  }
}

export function hashDomain(name: string): Uint8Array {
  const normalized = normalizeDnsName(name);
  const digest = createHash("sha256").update(normalized).digest();
  const hash = new Uint8Array(BLOCKLIST_HASH_BYTES);
  hash.set(digest.subarray(0, BLOCKLIST_HASH_BYTES));
  return hash;
}

function normalizeSet(values: Iterable<string>): ReadonlySet<string> {
  const set = new Set<string>();
  for (const value of values) {
    const normalized = normalizeDnsName(value);
    if (normalized.length === 0 || normalized === ".") {
      continue;
    }
    if (!normalized.includes(".")) {
      continue;
    }
    set.add(normalized);
  }
  return set;
}

function normalizeCategories(
  values: Record<string, number> | undefined,
): ReadonlyMap<string, number> {
  const categories = new Map<string, number>();
  for (const [key, value] of Object.entries(values ?? {})) {
    const normalized = normalizeDnsName(key);
    if (normalized.length === 0 || normalized === ".") {
      continue;
    }
    categories.set(normalized, Math.max(1, Math.min(127, value | 0)));
  }
  return categories;
}

function matches(set: ReadonlySet<string>, name: string): boolean {
  const labels = name.split(".");
  for (let index = 0; index < labels.length; index += 1) {
    const candidate = labels.slice(index).join(".");
    if (!candidate.includes(".")) {
      continue;
    }
    if (set.has(candidate)) {
      return true;
    }
  }
  return false;
}

function compareHashAt(
  hashes: Uint8Array,
  offset: number,
  hash: Uint8Array,
): number {
  for (let index = 0; index < BLOCKLIST_HASH_BYTES; index += 1) {
    const left = hashes[offset + index] ?? 0;
    const right = hash[index] ?? 0;
    if (left !== right) {
      return left - right;
    }
  }
  return 0;
}

interface BlocklistCache {
  blocklist: DomainBlocklist;
  binMtimeMs: number;
  jsonMtimeMs: number;
  allowlistMtimeMs: number;
}

let cachedBlocklist: BlocklistCache | undefined;
let lastCacheCheckMs = 0;
const CACHE_CHECK_INTERVAL_MS = 30_000;

export function getBlocklist(): DomainBlocklist {
  const now = Date.now();
  if (
    cachedBlocklist &&
    now - lastCacheCheckMs < CACHE_CHECK_INTERVAL_MS
  ) {
    return cachedBlocklist.blocklist;
  }
  lastCacheCheckMs = now;

  const dataDir = join(process.cwd(), "data");
  const binPath = join(dataDir, "blocklist.bin");
  const jsonPath = join(dataDir, "blocklist.json");
  const allowlistPath = join(dataDir, "blocklist-allowlist.json");

  const binMtimeMs = statMtimeMs(binPath);
  const jsonMtimeMs = statMtimeMs(jsonPath);
  const allowlistMtimeMs = statMtimeMs(allowlistPath);

  if (
    cachedBlocklist &&
    cachedBlocklist.binMtimeMs === binMtimeMs &&
    cachedBlocklist.jsonMtimeMs === jsonMtimeMs &&
    cachedBlocklist.allowlistMtimeMs === allowlistMtimeMs
  ) {
    return cachedBlocklist.blocklist;
  }

  if (binMtimeMs >= 0) {
    try {
      const hashes = new Uint8Array(readFileSync(binPath));
      const allowed = readAllowlistFile(allowlistPath);
      const blocklist = new HashedBlocklist(hashes, allowed);
      cachedBlocklist = {
        blocklist,
        binMtimeMs,
        jsonMtimeMs,
        allowlistMtimeMs,
      };
      return blocklist;
    } catch {
      // Fall through to the JSON fallback.
    }
  }

  if (jsonMtimeMs >= 0) {
    try {
      const data = JSON.parse(readFileSync(jsonPath, "utf8")) as BlocklistData;
      const blocklist = new Blocklist(data);
      cachedBlocklist = {
        blocklist,
        binMtimeMs,
        jsonMtimeMs,
        allowlistMtimeMs,
      };
      return blocklist;
    } catch {
      // Fall through to the empty fallback.
    }
  }

  const blocklist = new Blocklist({ blocked: [] });
  cachedBlocklist = {
    blocklist,
    binMtimeMs,
    jsonMtimeMs,
    allowlistMtimeMs,
  };
  return blocklist;
}

export function loadBlocklistFromDirectory(dataDir: string): DomainBlocklist {
  const binPath = join(dataDir, "blocklist.bin");
  if (statMtimeMs(binPath) >= 0) {
    try {
      const hashes = new Uint8Array(readFileSync(binPath));
      const allowed = readAllowlistFile(
        join(dataDir, "blocklist-allowlist.json"),
      );
      return new HashedBlocklist(hashes, allowed);
    } catch {
      // Fall through to the JSON fallback.
    }
  }

  const jsonPath = join(dataDir, "blocklist.json");
  if (statMtimeMs(jsonPath) >= 0) {
    try {
      const data = JSON.parse(readFileSync(jsonPath, "utf8")) as BlocklistData;
      return new Blocklist(data);
    } catch {
      // Fall through to the empty fallback.
    }
  }

  return new Blocklist({ blocked: [] });
}

export function clearBlocklistCacheForTests(): void {
  cachedBlocklist = undefined;
  lastCacheCheckMs = 0;
}

function statMtimeMs(path: string): number {
  const stat = statSync(path, { throwIfNoEntry: false });
  return stat?.mtimeMs ?? -1;
}

function readAllowlistFile(path: string): string[] {
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as {
      allowed?: unknown;
    };
    if (!Array.isArray(parsed.allowed)) {
      return [];
    }
    return parsed.allowed.filter(
      (value): value is string => typeof value === "string",
    );
  } catch {
    return [];
  }
}
