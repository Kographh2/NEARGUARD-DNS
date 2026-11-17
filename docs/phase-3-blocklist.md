# Phase 3 — blocklist pipeline

## Source verification

Verified on 2026-11-17 from this environment. `raw.githubusercontent.com` timed
out repeatedly, so the build uses jsDelivr mirrors for the GitHub-hosted lists.

| Source | URL | Result |
|---|---|---|
| HaGeZi Multi NORMAL | `https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/wildcard/multi.txt` | 200, 4,071,152 bytes, 185,098 entries |
| OISD Big | `https://cdn.jsdelivr.net/gh/sjhgvr/oisd@main/domainswild2_big.txt` | 200, 4,464,321 bytes, 228,369 entries |
| StevenBlack Unified | `https://cdn.jsdelivr.net/gh/StevenBlack/hosts@master/hosts` | 200, 2,328,985 bytes, 76,103 entries |
| Phishing Army Extended | `https://phishing.army/download/phishing_army_blocklist_extended.txt` | 200, 3,142,484 bytes, 145,088 entries |
| HaGeZi Fake | `https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/wildcard/fake.txt` | 200, 361,299 bytes, 18,814 entries |
| The Block List Project Scam | `https://cdn.jsdelivr.net/gh/blocklistproject/Lists@master/scam.txt` | 200, 223,675 bytes, 8,527 entries |
| MetaMask Crypto Phishing | `https://cdn.jsdelivr.net/gh/MetaMask/eth-phishing-detect@master/src/config.json` | 200, 5,263,812 bytes, 198,052 entries |
| StevenBlack Gambling | `https://cdn.jsdelivr.net/gh/StevenBlack/hosts@master/alternates/gambling-only/hosts` | 200, 149,253 bytes, 6,744 entries |
| HaGeZi Threat Intelligence Mini | `https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/wildcard/tif.mini.txt` | 200, 3,649,639 bytes, 182,368 entries |
| URLhaus | `https://urlhaus-api.abuse.ch/v2/files/exports/<key>/hostfile.txt` | Requires `URLHAUS_API_KEY`; skipped when absent |

The original `https://big.oisd.nl/domainswild2_big.txt` URL returned 404. The
maintained file lives in the `sjhgvr/oisd` repository. URLhaus keyless downloads
were retired; the builder records the source as skipped rather than failing.

HaGeZi Threat Intelligence Mini marks every entry with malware, phishing, scam,
and crypto-scam bits. Its entries therefore count in all four categories, and
per-category toggles cannot isolate those threat types.

## Artifact

`npm run blocklist:build` writes:

- `data/blocklist.bin` — 667,311 sorted 9-byte entries, 6,005,799 bytes. Each
  entry is an 8-byte SHA-256 truncated hash plus one category bitmask byte.
- `data/blocklist-allowlist.json` — 10 exact/parent allowlist entries.
- `data/blocklist-meta.json` — source status, counts, category counts,
  collisions, and binary SHA-256.

Current totals: 1,049,163 parsed entries, 673,093 unique domains, 5,782 removed
by the allowlist, 667,311 blocked domains, 0 hash collisions. The binary SHA-256
is `70e6c01a17abb5b6f27c6b73a949c5d6b4719dbbd588663468619601c666d44e`.

Category counts overlap: ads 377,267; trackers 377,267; malware 182,363;
phishing 262,608; scam 190,508; cryptoScam 376,371; gambling 6,744.

The runtime matcher checks the exact name and every parent suffix. It never
blocks a bare TLD. The allowlist is checked first, so it overrides exact and
parent matches. `getBlocklist()` prefers the binary artifact and falls back to
`data/blocklist.json` or an empty blocklist. `match()` returns the category mask
so the handler can apply the free or registered category preference.

## Runtime benchmark

Command: `npm run benchmark:runtime`

| Runtime simulation | Lookups | Time | Per query |
|---|---:|---:|---:|
| Node.js (`node:crypto` + `fs`) | 20,000 | 171.26 ms | 8.56 µs |
| Edge-style (`crypto.subtle`) | 2,000 | 182.52 ms | 91.26 µs |

Artifact load in Node.js was 0.20 ms. DoH routes remain on `runtime = "nodejs"`:
the artifact is loaded from disk and hashed synchronously. The Edge simulation
uses Web Crypto and an in-memory artifact; an actual Edge deployment would also
need the 6 MB artifact bundled into the function.

## Refresh and failure behavior

- `npm run blocklist:build` downloads every required source, parses hosts,
  wildcard, AdGuard, JSON blacklist, and plain-domain formats, deduplicates,
  applies the allowlist, assigns category bits, hashes, sorts, and writes the
  artifact.
- Downloads are cached in `data/raw/` (gitignored). If a required source fails
  and no cached copy exists, the build fails instead of silently shrinking the
  blocklist. Empty cached files are rejected.
- URLhaus is optional. Set `URLHAUS_API_KEY` in the environment or GitHub
  Actions secrets to include it.
- `.github/workflows/blocklist.yml` rebuilds daily at 03:17 UTC and commits
  changed artifacts.

## Tests

- `test/blocklist.test.ts` covers full-string and hashed exact/parent matches,
  category masks, allowlist overrides, bare-TLD protection, normalization,
  artifact loading, JSON fallback, empty fallback, and corrupt-length rejection.
- `test/blocklist-parse.test.ts` covers hosts, wildcard, AdGuard, JSON
  blacklist, plain-domain, BOM, comment, invalid-entry, allowlist, and
  hash-ordering behavior.
