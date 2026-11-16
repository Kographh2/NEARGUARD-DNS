import { describe, expect, it } from "vitest";

import {
  compareHashes,
  isAllowlistedDomain,
  normalizeBlocklistDomain,
  parseBlocklistText,
} from "@/lib/dns/blocklist-parse";

describe("normalizeBlocklistDomain", () => {
  it("normalizes wildcard, AdGuard, case, and trailing dots", () => {
    expect(normalizeBlocklistDomain("*.Ads.Example.COM.")).toBe(
      "ads.example.com",
    );
    expect(normalizeBlocklistDomain("||tracker.net^")).toBe("tracker.net");
    expect(normalizeBlocklistDomain("||phish.example^$important")).toBe(
      "phish.example",
    );
  });

  it("rejects invalid or unsafe entries", () => {
    for (const value of [
      "",
      "localhost",
      "localhost.localdomain",
      "0.0.0.0",
      "127.0.0.1",
      "::1",
      "-bad.example.com",
      "bad-.example.com",
      "bad..example.com",
      "*.com",
      "domain/path",
      "domain:8080",
      "http://example.com",
      "_dmarc.example.com",
      "exa mple.com",
      "example.com##.ad",
    ]) {
      expect(normalizeBlocklistDomain(value)).toBeNull();
    }
  });

  it("accepts punycode labels", () => {
    expect(normalizeBlocklistDomain("xn--bcher-kva.example")).toBe(
      "xn--bcher-kva.example",
    );
  });
});

describe("parseBlocklistText", () => {
  it("parses hosts files, including multiple domains per line", () => {
    const text = [
      "# comment",
      "0.0.0.0 ads.example.com",
      "127.0.0.1 tracker.net # inline comment",
      "::1 ipv6.example.com",
      "0.0.0.0 multi-one.example multi-two.example",
      "127.0.0.1 localhost",
    ].join("\n");

    expect(parseBlocklistText(text, "hosts")).toEqual([
      "ads.example.com",
      "tracker.net",
      "ipv6.example.com",
      "multi-one.example",
      "multi-two.example",
    ]);
  });

  it("parses wildcard and AdGuard syntax", () => {
    const text = [
      "*.ads.example.com",
      "||tracker.net^",
      "||phish.example^$important",
      "example.org^",
      "@@||safe.example^",
      "ignore.example##.ad",
    ].join("\n");

    expect(parseBlocklistText(text)).toEqual([
      "ads.example.com",
      "tracker.net",
      "phish.example",
      "example.org",
    ]);
  });

  it("parses plain domain lists and strips BOM", () => {
    const text = "\uFEFF# title\nads.example.com\n\nTRACKER.NET.\n";
    expect(parseBlocklistText(text, "domains")).toEqual([
      "ads.example.com",
      "tracker.net",
    ]);
  });
});

describe("isAllowlistedDomain", () => {
  const allowed = new Set(["safe.example.com", "example.org"]);

  it("matches exact and parent allowlist entries", () => {
    expect(isAllowlistedDomain("safe.example.com", allowed)).toBe(true);
    expect(isAllowlistedDomain("sub.safe.example.com", allowed)).toBe(true);
    expect(isAllowlistedDomain("example.org", allowed)).toBe(true);
    expect(isAllowlistedDomain("sub.example.org", allowed)).toBe(true);
  });

  it("does not match unrelated domains", () => {
    expect(isAllowlistedDomain("not-safe.example.com", allowed)).toBe(false);
    expect(isAllowlistedDomain("example.com", allowed)).toBe(false);
  });
});

describe("compareHashes", () => {
  it("orders hashes lexicographically", () => {
    const hashes = [
      new Uint8Array([0, 1]),
      new Uint8Array([0, 0]),
      new Uint8Array([1, 0]),
    ];
    hashes.sort(compareHashes);
    expect(hashes.map((hash) => Array.from(hash))).toEqual([
      [0, 0],
      [0, 1],
      [1, 0],
    ]);
  });
});
