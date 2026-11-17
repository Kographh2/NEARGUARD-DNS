import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

import {
  BLOCKLIST_ENTRY_BYTES,
  BLOCKLIST_HASH_BYTES,
  DEFAULT_ALLOWLIST,
  hashDomain,
} from "@/lib/dns/blocklist";
import {
  BLOCK_CATEGORIES,
  CATEGORY_ORDER,
  type BlockCategory,
} from "@/lib/dns/categories";
import {
  compareHashes,
  isAllowlistedDomain,
  normalizeBlocklistDomain,
  parseBlocklistText,
  type BlocklistSourceFormat,
} from "@/lib/dns/blocklist-parse";

const DATA_DIR = join(process.cwd(), "data");
const RAW_DIR = join(DATA_DIR, "raw");
const BIN_PATH = join(DATA_DIR, "blocklist.bin");
const META_PATH = join(DATA_DIR, "blocklist-meta.json");
const ALLOWLIST_PATH = join(DATA_DIR, "blocklist-allowlist.json");

interface Source {
  name: string;
  slug: string;
  url: string;
  publicUrl?: string;
  format: BlocklistSourceFormat;
  categories: readonly BlockCategory[];
  license?: string;
  optional?: boolean;
  requiresEnv?: string;
}

interface SourceResult {
  name: string;
  url: string;
  status: "ok" | "cached" | "skipped";
  bytes: number;
  entries: number;
  categories: readonly BlockCategory[];
  license?: string;
  note?: string;
}

interface LoadedSource {
  text: string;
  bytes: number;
  status: "ok" | "cached" | "skipped";
  note?: string;
}

const URLHAUS_KEY = process.env.URLHAUS_API_KEY?.trim();
const URLHAUS_PUBLIC_URL =
  "https://urlhaus-api.abuse.ch/v2/files/exports/[redacted]/hostfile.txt";

const SOURCES: Source[] = [
  {
    name: "HaGeZi Multi NORMAL",
    slug: "hagezi-multi",
    url: "https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/wildcard/multi.txt",
    format: "auto",
    categories: ["ads", "trackers"],
    license: "GPL-3.0",
  },
  {
    name: "OISD Big",
    slug: "oisd-big",
    url: "https://cdn.jsdelivr.net/gh/sjhgvr/oisd@main/domainswild2_big.txt",
    format: "domains",
    categories: ["ads", "trackers"],
    license: "See source",
  },
  {
    name: "StevenBlack Unified",
    slug: "stevenblack-unified",
    url: "https://cdn.jsdelivr.net/gh/StevenBlack/hosts@master/hosts",
    format: "hosts",
    categories: ["ads", "trackers"],
    license: "MIT",
  },
  {
    name: "Phishing Army Extended",
    slug: "phishing-army",
    url: "https://phishing.army/download/phishing_army_blocklist_extended.txt",
    format: "domains",
    categories: ["phishing"],
    license: "See source",
  },
  {
    name: "HaGeZi Fake",
    slug: "hagezi-fake",
    url: "https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/wildcard/fake.txt",
    format: "auto",
    categories: ["scam"],
    license: "GPL-3.0",
  },
  {
    name: "The Block List Project Scam",
    slug: "blocklistproject-scam",
    url: "https://cdn.jsdelivr.net/gh/blocklistproject/Lists@master/scam.txt",
    format: "hosts",
    categories: ["scam"],
    license: "MIT",
  },
  {
    name: "MetaMask Crypto Phishing",
    slug: "metamask-crypto-phishing",
    url: "https://cdn.jsdelivr.net/gh/MetaMask/eth-phishing-detect@master/src/config.json",
    format: "json-blacklist",
    categories: ["cryptoScam"],
    license: "See source",
  },
  {
    name: "StevenBlack Gambling",
    slug: "stevenblack-gambling",
    url: "https://cdn.jsdelivr.net/gh/StevenBlack/hosts@master/alternates/gambling-only/hosts",
    format: "hosts",
    categories: ["gambling"],
    license: "MIT",
  },
  {
    name: "HaGeZi Threat Intelligence Mini",
    slug: "hagezi-tif-mini",
    url: "https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/wildcard/tif.mini.txt",
    format: "auto",
    categories: ["malware", "phishing", "scam", "cryptoScam"],
    license: "GPL-3.0",
  },
  {
    name: "URLhaus",
    slug: "urlhaus",
    url: URLHAUS_KEY
      ? `https://urlhaus-api.abuse.ch/v2/files/exports/${encodeURIComponent(URLHAUS_KEY)}/hostfile.txt`
      : URLHAUS_PUBLIC_URL,
    publicUrl: URLHAUS_PUBLIC_URL,
    format: "hosts",
    categories: ["malware"],
    license: "See source",
    optional: true,
    requiresEnv: "URLHAUS_API_KEY",
  },
];

async function main(): Promise<void> {
  mkdirSync(RAW_DIR, { recursive: true });

  const allowlist = loadAllowlist();
  const allowedSet = new Set(allowlist);
  const unique = new Map<string, number>();
  const sourceResults: SourceResult[] = [];
  let parsedEntries = 0;

  for (const source of SOURCES) {
    const loaded = await loadSource(source);
    const sourceMask = source.categories.reduce(
      (mask, category) => mask | BLOCK_CATEGORIES[category],
      0,
    );
    if (loaded.status === "skipped") {
      sourceResults.push({
        name: source.name,
        url: source.publicUrl ?? source.url,
        status: "skipped",
        bytes: 0,
        entries: 0,
        categories: source.categories,
        license: source.license,
        note: loaded.note,
      });
      continue;
    }

    const domains = parseBlocklistText(loaded.text, source.format);
    parsedEntries += domains.length;
    for (const domain of domains) {
      unique.set(domain, (unique.get(domain) ?? 0) | sourceMask);
    }

    sourceResults.push({
      name: source.name,
      url: source.publicUrl ?? source.url,
      status: loaded.status,
      bytes: loaded.bytes,
      entries: domains.length,
      categories: source.categories,
      license: source.license,
      note: loaded.note,
    });
  }

  const blocked: Array<{ domain: string; categories: number }> = [];
  let allowlisted = 0;
  for (const [domain, categories] of unique) {
    if (isAllowlistedDomain(domain, allowedSet)) {
      allowlisted += 1;
    } else {
      blocked.push({ domain, categories: categories || 1 });
    }
  }

  const entries = blocked.map((entry) => ({
    ...entry,
    hash: hashDomain(entry.domain),
  }));
  entries.sort((left, right) => compareHashes(left.hash, right.hash));

  const hashes = new Uint8Array(entries.length * BLOCKLIST_ENTRY_BYTES);
  let collisions = 0;
  let hashCount = 0;
  let previous: Uint8Array | undefined;

  for (const entry of entries) {
    if (previous && compareHashes(previous, entry.hash) === 0) {
      const previousOffset = (hashCount - 1) * BLOCKLIST_ENTRY_BYTES;
      const merged =
        (hashes[previousOffset + BLOCKLIST_HASH_BYTES] ?? 0) |
        entry.categories;
      hashes[previousOffset + BLOCKLIST_HASH_BYTES] = merged & 127;
      collisions += 1;
      continue;
    }
    const offset = hashCount * BLOCKLIST_ENTRY_BYTES;
    hashes.set(entry.hash, offset);
    hashes[offset + BLOCKLIST_HASH_BYTES] = entry.categories & 127;
    hashCount += 1;
    previous = entry.hash;
  }

  const artifact = hashes.subarray(0, hashCount * BLOCKLIST_ENTRY_BYTES);
  const categoryCounts: Record<string, number> = {};
  for (const category of CATEGORY_ORDER) {
    const bit = BLOCK_CATEGORIES[category];
    let count = 0;
    for (let index = 0; index < hashCount; index += 1) {
      const mask =
        hashes[index * BLOCKLIST_ENTRY_BYTES + BLOCKLIST_HASH_BYTES] ?? 0;
      if ((mask & bit) !== 0) {
        count += 1;
      }
    }
    categoryCounts[category] = count;
  }
  const binSha256 = createHash("sha256").update(artifact).digest("hex");
  const generatedAt = new Date().toISOString();

  writeFileSync(BIN_PATH, artifact);
  writeFileSync(
    ALLOWLIST_PATH,
    `${JSON.stringify({ allowed: allowlist }, null, 2)}\n`,
  );
  writeFileSync(
    META_PATH,
    `${JSON.stringify(
      {
        format: "nearguard-blocklist-v2",
        hash: "sha256-truncated-64-bit",
        hashBytes: BLOCKLIST_HASH_BYTES,
        entryBytes: BLOCKLIST_ENTRY_BYTES,
        generatedAt,
        sources: sourceResults,
        allowlist: {
          file: "data/blocklist-allowlist.json",
          count: allowlist.length,
        },
        categoryCounts,
        totals: {
          parsedEntries,
          uniqueDomains: unique.size,
          allowlisted,
          blockedDomains: blocked.length,
          hashes: hashCount,
          collisions,
          binBytes: artifact.length,
          binSha256,
        },
      },
      null,
      2,
    )}\n`,
  );

  for (const source of sourceResults) {
    const note = source.note ? ` (${source.note})` : "";
    console.log(
      `${source.status.padEnd(7)} ${source.name}: ${source.entries} entries, ${source.bytes} bytes${note}`,
    );
  }
  console.log(
    `unique=${unique.size} allowlisted=${allowlisted} blocked=${blocked.length} hashes=${hashCount} collisions=${collisions} bin=${artifact.length} bytes`,
  );
  console.log(`wrote ${BIN_PATH}`);
  console.log(`wrote ${META_PATH}`);
  console.log(`wrote ${ALLOWLIST_PATH}`);
}

function loadAllowlist(): string[] {
  const values = [...DEFAULT_ALLOWLIST, ...readAllowlistFile()];
  const allowed = new Set<string>();
  for (const value of values) {
    const domain = normalizeBlocklistDomain(value);
    if (domain) {
      allowed.add(domain);
    }
  }
  return [...allowed].sort();
}

function readAllowlistFile(): string[] {
  try {
    const parsed = JSON.parse(readFileSync(ALLOWLIST_PATH, "utf8")) as {
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

async function loadSource(source: Source): Promise<LoadedSource> {
  if (source.requiresEnv && !process.env[source.requiresEnv]?.trim()) {
    return {
      text: "",
      bytes: 0,
      status: "skipped",
      note: `${source.requiresEnv} not set`,
    };
  }

  const cachePath = join(RAW_DIR, `${source.slug}.txt`);
  let lastError: unknown;

  try {
    const response = await fetch(source.url, {
      headers: {
        "user-agent": "nearguard-blocklist-builder/1.0",
      },
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const text = await response.text();
    if (text.trim().length === 0) {
      throw new Error("empty response");
    }
    writeFileSync(cachePath, text, "utf8");
    return {
      text,
      bytes: Buffer.byteLength(text),
      status: "ok",
    };
  } catch (error) {
    lastError = error;
  }

  if (existsSync(cachePath)) {
    const text = readFileSync(cachePath, "utf8");
    if (text.trim().length > 0) {
      return {
        text,
        bytes: Buffer.byteLength(text),
        status: "cached",
        note: "network unavailable; using cached download",
      };
    }
  }

  if (source.optional) {
    return {
      text: "",
      bytes: 0,
      status: "skipped",
      note: "optional source unavailable",
    };
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Could not download ${source.name}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Blocklist build failed: ${message}`);
  process.exitCode = 1;
});
