# Phase 3 — blocklist pipeline

## Source verification

Verified on 2026-11-16 from this environment. `raw.githubusercontent.com` timed
out repeatedly, so the build uses jsDelivr mirrors for the GitHub-hosted lists.

| Source | URL | Result |
|---|---|---|
| HaGeZi Multi NORMAL | `https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/wildcard/multi.txt` | 200, 5,018,908 bytes, 223,869 entries |
| OISD Big | `https://cdn.jsdelivr.net/gh/sjhgvr/oisd@main/domainswild2_big.txt` | 200, 4,463,176 bytes, 228,228 entries |
| StevenBlack Unified | `https://cdn.jsdelivr.net/gh/StevenBlack/hosts@master/hosts` | 200, 2,361,640 bytes, 77,308 entries |
| Phishing Army Extended | `https://phishing.army/download/phishing_army_blocklist_extended.txt` | 200, 3,117,316 bytes, 144,129 entries |
| URLhaus | `https://urlhaus.abuse.ch/downloads/hostfile/` | 410 Gone since 21 October 2026 |
| URLhaus (optional) | `https://urlhaus-api.abuse.ch/v2/files/exports/<key>/hostfile.txt` | Requires `URLHAUS_API_KEY`; skipped when absent |

The original `https://big.oisd.nl/domainswild2_big.txt` URL returned 404. The
maintained file lives in the `sjhgvr/oisd` repository. URLhaus keyless downloads
were retired; the builder records the source as skipped rather than failing.

## Artifact

`npm run blocklist:build` writes:

- `data/blocklist.bin` — 479,809 sorted 8-byte SHA-256 truncated hashes,
  3,838,472 bytes.
- `data/blocklist-allowlist.json` — 10 exact/parent allowlist entries.
- `data/blocklist-meta.json` — source status, counts, collisions, and binary
  SHA-256.

Current totals: 673,534 parsed entries, 482,201 unique domains, 2,392 removed by
the allowlist, 479,809 blocked domains, 0 hash collisions. The binary SHA-256 is
`87dbc61db194883174cbcf0efa969d17212aed8065068836c7c1312169697855`.

The runtime matcher checks the exact name and every parent suffix. It never
blocks a bare TLD. The allowlist is checked first, so it overrides exact and
parent matches. `getBlocklist()` prefers the binary artifact and falls back to
`data/blocklist.json` or an empty blocklist.

## Runtime benchmark

Command: `npm run benchmark:runtime`

| Runtime simulation | Lookups | Time | Per query |
|---|---:|---:|---:|
| Node.js (`node:crypto` + `fs`) | 20,000 | 214.33 ms | 10.72 µs |
| Edge-style (`crypto.subtle`) | 2,000 | 228.90 ms | 114.45 µs |

Artifact load in Node.js was 0.40 ms. DoH routes remain on `runtime = "nodejs"`:
the artifact is loaded from disk and hashed synchronously. The Edge simulation
uses Web Crypto and an in-memory artifact; an actual Edge deployment would also
need the 3.8 MB artifact bundled into the function.

## Refresh and failure behavior

- `npm run blocklist:build` downloads every required source, parses hosts,
  wildcard, AdGuard, and plain-domain formats, deduplicates, applies the
  allowlist, hashes, sorts, and writes the artifact.
- Downloads are cached in `data/raw/` (gitignored). If a required source fails
  and no cached copy exists, the build fails instead of silently shrinking the
  blocklist.
- URLhaus is optional. Set `URLHAUS_API_KEY` in the environment or GitHub
  Actions secrets to include it.
- `.github/workflows/blocklist.yml` rebuilds daily at 03:17 UTC and commits
  changed artifacts.

## Tests

- `test/blocklist.test.ts` covers full-string and hashed exact/parent matches,
  allowlist overrides, bare-TLD protection, normalization, artifact loading,
  JSON fallback, empty fallback, and corrupt-length rejection.
- `test/blocklist-parse.test.ts` covers hosts, wildcard, AdGuard, plain-domain,
  BOM, comment, invalid-entry, allowlist, and hash-ordering behavior.
