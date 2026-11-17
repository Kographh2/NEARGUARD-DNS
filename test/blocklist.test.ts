import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  BLOCKLIST_ENTRY_BYTES,
  BLOCKLIST_HASH_BYTES,
  Blocklist,
  HashedBlocklist,
  hashDomain,
  loadBlocklistFromDirectory,
} from "@/lib/dns/blocklist";
import { BLOCK_CATEGORIES } from "@/lib/dns/categories";

function buildArtifact(
  domains: Array<string | { domain: string; categories: number }>,
): Uint8Array {
  const entries = domains
    .map((entry) => {
      const domain = typeof entry === "string" ? entry : entry.domain;
      return {
        hash: hashDomain(domain),
        categories: typeof entry === "string" ? 1 : entry.categories,
      };
    })
    .sort((left, right) =>
      Buffer.compare(Buffer.from(left.hash), Buffer.from(right.hash)),
    );
  const artifact = new Uint8Array(entries.length * BLOCKLIST_ENTRY_BYTES);
  entries.forEach((entry, index) => {
    const offset = index * BLOCKLIST_ENTRY_BYTES;
    artifact.set(entry.hash, offset);
    artifact[offset + BLOCKLIST_HASH_BYTES] = entry.categories;
  });
  return artifact;
}

describe("Blocklist", () => {
  const blocklist = new Blocklist({
    blocked: [
      "ads.example.com",
      "tracker.net",
      "example.org",
      "singlelabel",
    ],
    allowed: ["safe.example.com", "allow.example.org"],
    categories: {
      "ads.example.com": BLOCK_CATEGORIES.ads,
      "tracker.net": BLOCK_CATEGORIES.trackers,
    },
  });

  it("matches exact domains", () => {
    expect(blocklist.isBlocked("ads.example.com")).toBe(true);
    expect(blocklist.isBlocked("tracker.net")).toBe(true);
  });

  it("matches parent domains", () => {
    expect(blocklist.isBlocked("sub.ads.example.com")).toBe(true);
    expect(blocklist.isBlocked("a.b.tracker.net")).toBe(true);
  });

  it("returns category bits for matched domains", () => {
    expect(blocklist.match("ads.example.com")).toBe(BLOCK_CATEGORIES.ads);
    expect(blocklist.match("tracker.net")).toBe(BLOCK_CATEGORIES.trackers);
    expect(blocklist.match("example.org")).toBe(1);
  });

  it("does not block unrelated domains", () => {
    expect(blocklist.isBlocked("example.com")).toBe(false);
    expect(blocklist.isBlocked("not-tracker.net")).toBe(false);
  });

  it("never blocks a bare TLD", () => {
    expect(blocklist.isBlocked("com")).toBe(false);
    expect(blocklist.isBlocked("net")).toBe(false);
    expect(blocklist.isBlocked("org")).toBe(false);
  });

  it("lets the allowlist override exact and parent matches", () => {
    expect(blocklist.isBlocked("safe.example.com")).toBe(false);
    expect(blocklist.isBlocked("sub.safe.example.com")).toBe(false);
    expect(blocklist.isBlocked("allow.example.org")).toBe(false);
    expect(blocklist.isBlocked("sub.allow.example.org")).toBe(false);
  });

  it("ignores single-label entries from the artifact", () => {
    expect(blocklist.size).toBe(3);
    expect(blocklist.isBlocked("singlelabel")).toBe(false);
  });

  it("protects the service's own domains", () => {
    expect(blocklist.isBlocked("dns.nearguard.biz.id")).toBe(false);
    expect(blocklist.isBlocked("supabase.co")).toBe(false);
    expect(blocklist.isBlocked("vercel.app")).toBe(false);
  });

  it("normalizes case and trailing dots", () => {
    expect(blocklist.isBlocked("ADS.EXAMPLE.COM.")).toBe(true);
    expect(blocklist.isBlocked("SAFE.EXAMPLE.COM.")).toBe(false);
  });
});

describe("HashedBlocklist", () => {
  const blocklist = new HashedBlocklist(
    buildArtifact([
      { domain: "ads.example.com", categories: BLOCK_CATEGORIES.ads },
      { domain: "tracker.net", categories: BLOCK_CATEGORIES.trackers },
      { domain: "example.org", categories: BLOCK_CATEGORIES.phishing },
    ]),
    ["safe.example.com", "allow.example.org"],
  );

  it("matches exact domains", () => {
    expect(blocklist.isBlocked("ads.example.com")).toBe(true);
    expect(blocklist.isBlocked("tracker.net")).toBe(true);
  });

  it("matches parent domains", () => {
    expect(blocklist.isBlocked("sub.ads.example.com")).toBe(true);
    expect(blocklist.isBlocked("a.b.tracker.net")).toBe(true);
  });

  it("returns category bits for matched domains", () => {
    expect(blocklist.match("ads.example.com")).toBe(BLOCK_CATEGORIES.ads);
    expect(blocklist.match("tracker.net")).toBe(BLOCK_CATEGORIES.trackers);
    expect(blocklist.match("example.org")).toBe(BLOCK_CATEGORIES.phishing);
    expect(blocklist.match("example.com")).toBeNull();
  });

  it("does not block unrelated domains", () => {
    expect(blocklist.isBlocked("example.com")).toBe(false);
    expect(blocklist.isBlocked("not-tracker.net")).toBe(false);
  });

  it("never blocks a bare TLD", () => {
    expect(blocklist.isBlocked("com")).toBe(false);
    expect(blocklist.isBlocked("net")).toBe(false);
  });

  it("lets the allowlist override exact and parent matches", () => {
    expect(blocklist.isBlocked("safe.example.com")).toBe(false);
    expect(blocklist.isBlocked("sub.safe.example.com")).toBe(false);
    expect(blocklist.isBlocked("allow.example.org")).toBe(false);
  });

  it("normalizes case and trailing dots", () => {
    expect(blocklist.isBlocked("ADS.EXAMPLE.COM.")).toBe(true);
    expect(blocklist.isBlocked("SAFE.EXAMPLE.COM.")).toBe(false);
  });

  it("reports the number of stored hashes", () => {
    expect(blocklist.size).toBe(3);
  });

  it("rejects a corrupt artifact length", () => {
    expect(() => new HashedBlocklist(new Uint8Array(7))).toThrow(
      /multiple of 9 bytes/u,
    );
  });

  it("rejects a hash with the wrong length", () => {
    expect(() => blocklist.hasHash(new Uint8Array(7))).toThrow(
      /exactly 8 bytes/u,
    );
  });
});

describe("hashDomain", () => {
  it("returns a deterministic 8-byte hash", () => {
    const first = hashDomain("Ads.Example.COM.");
    const second = hashDomain("ads.example.com");
    expect(first).toHaveLength(BLOCKLIST_HASH_BYTES);
    expect(second).toHaveLength(BLOCKLIST_HASH_BYTES);
    expect(Array.from(first)).toEqual(Array.from(second));
  });
});

describe("loadBlocklistFromDirectory", () => {
  it("loads a binary artifact and allowlist from disk", () => {
    const directory = mkdtempSync(join(tmpdir(), "nearguard-blocklist-"));
    try {
      writeFileSync(
        join(directory, "blocklist.bin"),
        buildArtifact(["ads.example.com", "tracker.net"]),
      );
      writeFileSync(
        join(directory, "blocklist-allowlist.json"),
        JSON.stringify({ allowed: ["safe.example.com"] }),
      );

      const blocklist = loadBlocklistFromDirectory(directory);
      expect(blocklist.size).toBe(2);
      expect(blocklist.isBlocked("ads.example.com")).toBe(true);
      expect(blocklist.isBlocked("sub.tracker.net")).toBe(true);
      expect(blocklist.isBlocked("safe.example.com")).toBe(false);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("falls back to JSON when the binary artifact is absent", () => {
    const directory = mkdtempSync(join(tmpdir(), "nearguard-blocklist-"));
    try {
      writeFileSync(
        join(directory, "blocklist.json"),
        JSON.stringify({ blocked: ["ads.example.com"] }),
      );

      const blocklist = loadBlocklistFromDirectory(directory);
      expect(blocklist.isBlocked("ads.example.com")).toBe(true);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("returns an empty blocklist when no artifact exists", () => {
    const directory = mkdtempSync(join(tmpdir(), "nearguard-blocklist-"));
    try {
      const blocklist = loadBlocklistFromDirectory(directory);
      expect(blocklist.size).toBe(0);
      expect(blocklist.isBlocked("ads.example.com")).toBe(false);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
