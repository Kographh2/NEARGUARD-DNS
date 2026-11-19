# NEAR ADGUARD decisions for v1.5

D-001 to D-056 remain in `docs/decisions.md`. New decisions are appended here
and the latest decision wins.

| ID | Decision | Rationale |
|---|---|---|
| D-057 | The v1.5 work order extends and overrides `near-adguard-supabase-prompt.md` where they differ | The owner supplied a newer merged work order |
| D-058 | W0 carry-over bugs are already fixed by `2008107` and `7cfd9d0`; W0 is verification only | The profile route, reserved-name guard, auth pages, API routes, and tests already exist |
| D-059 | W1 uses a new idempotent migration and never edits a migration that may have been applied | The live `public` schema is empty and the old migration is not recorded as applied; the new migration must be safe to run twice |
| D-060 | W1 must show the full SQL and wait for explicit approval before applying it | The Free plan has no backups and the owner requested a SQL gate |
| D-061 | The blocklist artifact is version 2: 8-byte truncated SHA-256 plus one category byte, 9 bytes per entry | The hot path needs a category decision without a second lookup or a Supabase call |
| D-062 | Category bits are ads 1, trackers 2, malware 4, phishing 8, scam 16, cryptoScam 32, and gambling 64; the default mask is 63 | Gambling is opt-in, and the remaining categories match the public landing table |
| D-063 | HaGeZi Threat Intelligence Mini assigns malware, phishing, scam, and cryptoScam bits to every entry | The source does not expose per-entry threat types, so the UI explains that category counts overlap |
| D-064 | UI copy is plain Indonesian and marks schema-only or not-yet-wired features as unavailable | The landing and privacy pages must not claim per-account categories, event storage, or IP reveal that the runtime does not provide |
| D-065 | The unchanged deployment was caused by UI-less commits, not by Vercel | `987a0aa` and `6054b96` changed only SQL/scripts; no UI file was committed |
| D-066 | The dashboard must verify the Supabase session server-side and the login page must redirect an existing session to the dashboard | The previous static dashboard always showed a “Masuk” button, so a successful login looked like a failed login |
| D-067 | The public header uses a client account menu that reads the Supabase auth cookie instead of making every page dynamic | The landing page must stay static; the menu re-renders on focus, visibility, storage, and a custom auth event |
| D-068 | `/admin` is a separate route shell with a sidebar and a server-side `profiles.role = 'admin'` guard | The dedicated console must not wrap the public header and footer, and service-role reads require an admin check in the layout and every page |
| D-069 | Account profiles use `/<username>/<device>` as ServerURL and are downloaded from `/dashboard/install/<device>` after a session check | The profile must match the real registered DoH path and cannot be generated for another account |
| D-070 | Free and account profiles are signed with an in-process self-issued PKCS#7 certificate named FizzxDevv - Kograph Team | iOS needs a CMS signature to show a signer instead of “Not Signed”; the certificate is not Apple-issued, so iOS can still mark it unverified |
