import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { join } from "node:path";

import {
  BLOCKLIST_HASH_BYTES,
  HashedBlocklist,
} from "@/lib/dns/blocklist";
import { normalizeDnsName } from "@/lib/dns/wire";

const NODE_ITERATIONS = 20_000;
const EDGE_ITERATIONS = 2_000;
const WARMUP_ITERATIONS = 1_000;
const RUNS = 3;

async function main(): Promise<void> {
  const binPath = join(process.cwd(), "data", "blocklist.bin");
  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(readFileSync(binPath));
  } catch {
    console.error(
      `Missing ${binPath}. Run "npm run blocklist:build" before benchmarking.`,
    );
    process.exitCode = 1;
    return;
  }

  const loadStart = performance.now();
  const blocklist = new HashedBlocklist(bytes);
  const loadMs = performance.now() - loadStart;

  const nodeNames = Array.from(
    { length: NODE_ITERATIONS },
    (_, index) => `sub${index}.example${index % 997}.com`,
  );
  const edgeNames = nodeNames.slice(0, EDGE_ITERATIONS);

  for (let index = 0; index < WARMUP_ITERATIONS; index += 1) {
    blocklist.isBlocked(nodeNames[index] ?? "warmup.example.com");
  }

  const nodeTimes: number[] = [];
  for (let run = 0; run < RUNS; run += 1) {
    const start = performance.now();
    for (const name of nodeNames) {
      blocklist.isBlocked(name);
    }
    nodeTimes.push(performance.now() - start);
  }

  const edgeTimes: number[] = [];
  for (let run = 0; run < RUNS; run += 1) {
    const start = performance.now();
    for (const name of edgeNames) {
      await isBlockedWithWebCrypto(blocklist, name);
    }
    edgeTimes.push(performance.now() - start);
  }

  const nodeMs = median(nodeTimes);
  const edgeMs = median(edgeTimes);
  const nodePerQueryUs = (nodeMs * 1_000) / NODE_ITERATIONS;
  const edgePerQueryUs = (edgeMs * 1_000) / EDGE_ITERATIONS;

  console.log("NEAR ADGUARD runtime benchmark");
  console.log(
    `artifact: ${blocklist.size} hashes, ${bytes.length} bytes, load ${loadMs.toFixed(2)} ms`,
  );
  console.log(
    `Node.js (node:crypto + fs): ${nodeMs.toFixed(2)} ms for ${NODE_ITERATIONS} lookups, ${nodePerQueryUs.toFixed(2)} us/query`,
  );
  console.log(
    `Edge simulation (Web Crypto): ${edgeMs.toFixed(2)} ms for ${EDGE_ITERATIONS} lookups, ${edgePerQueryUs.toFixed(2)} us/query`,
  );
  console.log(
    "decision: keep DoH routes on the Node.js runtime; the artifact is loaded with fs and hashed synchronously.",
  );
}

async function isBlockedWithWebCrypto(
  blocklist: HashedBlocklist,
  name: string,
): Promise<boolean> {
  const normalized = normalizeDnsName(name);
  if (
    normalized.length === 0 ||
    normalized === "." ||
    !normalized.includes(".")
  ) {
    return false;
  }

  let candidate = normalized;
  while (candidate.includes(".")) {
    const hash = await hashDomainWithWebCrypto(candidate);
    if (blocklist.hasHash(hash)) {
      return true;
    }
    const dot = candidate.indexOf(".");
    candidate = candidate.slice(dot + 1);
  }
  return false;
}

async function hashDomainWithWebCrypto(name: string): Promise<Uint8Array> {
  const normalized = normalizeDnsName(name);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(normalized),
  );
  return new Uint8Array(digest).subarray(0, BLOCKLIST_HASH_BYTES);
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted[middle] ?? 0;
}

void main();
