import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

import {
  BLOCKLIST_HASH_BYTES,
  DEFAULT_ALLOWLIST,
  hashDomain,
} from "@/lib/dns/blocklist";
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
  optional?: boolean;
  requiresEnv?: string;
}

interface SourceResult {
  name: string;
  url: string;
  status: "ok" | "cached" | "skipped";
  bytes: number;
  entries: number;
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
  },
  {
    name: "OISD Big",
    slug: "oisd-big",
    url: "https://cdn.jsdelivr.net/gh/sjhgvr/oisd@main/domainswild2_big.txt",
    format: "domains",
  },
  {
    name: "StevenBlack Unified",
    slug: "stevenblack-unified",
    url: "https://cdn.jsdelivr.net/gh/StevenBlack/hosts@master/hosts",
    format: "hosts",
  },
  {
    name: "Phishing Army Extended",
    slug: "phishing-army",
    url: "https://phishing.army/download/phishing_army_blocklist_extended.txt",
    format: "domains",
  },
  {
    name: "URLhaus",
    slug: "urlhaus",
    url: URLHAUS_KEY
      ? `https://urlhaus-api.abuse.ch/v2/files/exports/${encodeURIComponent(URLHAUS_KEY)}/hostfile.txt`
      : URLHAUS_PUBLIC_URL,
    publicUrl: URLHAUS_PUBLIC_URL,
    format: "hosts",
    optional: true,
    requiresEnv: "URLHAUS_API_KEY",
  },
];

async function main(): Promise<void> {
  mkdirSync(RAW_DIR, { recursive: true });

  const allowlist = loadAllowlist();
  const allowedSet = new Set(allowlist);
  const unique = new Set<string>();
  const sourceResults: SourceResult[] = [];
  let parsedEntries = 0;

  for (const source of SOURCES) {
    const loaded = await loadSource(source);
    if (loaded.status === "skipped") {
      sourceResults.push({
        name: source.name,
        url: source.publicUrl ?? source.url,
        status: "skipped",
        bytes: 0,
        entries: 0,
        note: loaded.note,
      });
      continue;
    }

    const domains = parseBlocklistText(loaded.text, source.format);
    parsedEntries += domains.length;
    for (const domain of domains) {
      unique.add(domain);
    }

    sourceResults.push({
      name: source.name,
      url: source.publicUrl ?? source.url,
      status: loaded.status,
      bytes: loaded.bytes,
      entries: domains.length,
      note: loaded.note,
    });
  }

  const blocked: string[] = [];
  let allowlisted = 0;
  for (const domain of unique) {
    if (isAllowlistedDomain(domain, allowedSet)) {
      allowlisted += 1;
    } else {
      blocked.push(domain);
    }
  }

  const entries = blocked.map((domain) => ({
    domain,
    hash: hashDomain(domain),
  }));
  entries.sort((left, right) => compareHashes(left.hash, right.hash));

  const hashes = new Uint8Array(entries.length * BLOCKLIST_HASH_BYTES);
  let collisions = 0;
  let hashCount = 0;
  let previous: Uint8Array | undefined;

  for (const entry of entries) {
    if (previous && compareHashes(previous, entry.hash) === 0) {
      collisions += 1;
      continue;
    }
    hashes.set(entry.hash, hashCount * BLOCKLIST_HASH_BYTES);
    hashCount += 1;
    previous = entry.hash;
  }

  const artifact = hashes.subarray(0, hashCount * BLOCKLIST_HASH_BYTES);
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
        format: "nearguard-blocklist-v1",
        hash: "sha256-truncated-64-bit",
        hashBytes: BLOCKLIST_HASH_BYTES,
        generatedAt,
        sources: sourceResults,
        allowlist: {
          file: "data/blocklist-allowlist.json",
          count: allowlist.length,
        },
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
    return {
      text,
      bytes: Buffer.byteLength(text),
      status: "cached",
      note: "network unavailable; using cached download",
    };
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
