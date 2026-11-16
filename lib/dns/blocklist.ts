import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { normalizeDnsName } from "@/lib/dns/wire";

export interface BlocklistData {
  version?: string;
  generatedAt?: string;
  blocked: string[];
  allowed?: string[];
}

const DEFAULT_ALLOWLIST = [
  "nearguard.biz.id",
  "dns.nearguard.biz.id",
  "supabase.co",
  "supabase.in",
  "vercel.app",
  "vercel.com",
  "cloudflare.com",
  "dns.google",
];

export class Blocklist {
  private readonly blocked: ReadonlySet<string>;
  private readonly allowed: ReadonlySet<string>;

  constructor(data: BlocklistData) {
    this.blocked = normalizeSet(data.blocked);
    this.allowed = normalizeSet([
      ...DEFAULT_ALLOWLIST,
      ...(data.allowed ?? []),
    ]);
  }

  get size(): number {
    return this.blocked.size;
  }

  isBlocked(name: string): boolean {
    const normalized = normalizeDnsName(name);
    if (normalized.length === 0 || normalized === ".") {
      return false;
    }
    if (matches(this.allowed, normalized)) {
      return false;
    }
    return matches(this.blocked, normalized);
  }
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

let cachedBlocklist: Blocklist | undefined;
let cachedMtimeMs = -1;

export function getBlocklist(): Blocklist {
  const path = join(process.cwd(), "data", "blocklist.json");
  try {
    const stat = statSync(path);
    if (cachedBlocklist && stat.mtimeMs === cachedMtimeMs) {
      return cachedBlocklist;
    }
    const data = JSON.parse(readFileSync(path, "utf8")) as BlocklistData;
    cachedBlocklist = new Blocklist(data);
    cachedMtimeMs = stat.mtimeMs;
    return cachedBlocklist;
  } catch {
    if (!cachedBlocklist) {
      cachedBlocklist = new Blocklist({ blocked: [] });
    }
    return cachedBlocklist;
  }
}
