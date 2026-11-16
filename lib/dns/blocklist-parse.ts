export type BlocklistSourceFormat = "auto" | "hosts" | "domains";

const HOSTS_LINE = /^(?:0\.0\.0\.0|127\.0\.0\.1|::1|::)\s+/iu;
const HOSTS_RECORD =
  /^(?:0\.0\.0\.0|127\.0\.0\.1|::1|::)\s+(.+)$/iu;
const IPV4 = /^\d{1,3}(?:\.\d{1,3}){3}$/u;
const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/u;

const SKIP_DOMAINS: ReadonlySet<string> = new Set([
  "localhost",
  "localhost.localdomain",
  "local",
  "broadcasthost",
  "ip6-localhost",
  "ip6-loopback",
  "ip6-allnodes",
  "ip6-allrouters",
]);

export function normalizeBlocklistDomain(value: string): string | null {
  let domain = value.trim().toLowerCase();

  if (domain.startsWith("||")) {
    domain = domain.slice(2);
  }

  const caret = domain.indexOf("^");
  if (caret >= 0) {
    domain = domain.slice(0, caret);
  }

  const dollar = domain.indexOf("$");
  if (dollar >= 0) {
    domain = domain.slice(0, dollar);
  }

  while (domain.startsWith("*.")) {
    domain = domain.slice(2);
  }
  while (domain.startsWith(".")) {
    domain = domain.slice(1);
  }
  while (domain.endsWith(".")) {
    domain = domain.slice(0, -1);
  }

  if (domain.length === 0 || domain.length > 253) {
    return null;
  }
  if (!domain.includes(".")) {
    return null;
  }
  if (
    domain.includes("/") ||
    domain.includes(":") ||
    domain.includes("*") ||
    domain.includes("?") ||
    domain.includes("=") ||
    domain.includes("|") ||
    domain.includes("@") ||
    domain.includes("#") ||
    domain.includes("!") ||
    /\s/u.test(domain)
  ) {
    return null;
  }
  if (SKIP_DOMAINS.has(domain) || IPV4.test(domain)) {
    return null;
  }

  const labels = domain.split(".");
  if (labels.length < 2) {
    return null;
  }
  for (const label of labels) {
    if (!LABEL.test(label)) {
      return null;
    }
  }

  return domain;
}

export function parseBlocklistText(
  text: string,
  format: BlocklistSourceFormat = "auto",
): string[] {
  const domains: string[] = [];
  const lines = text.replace(/^\uFEFF/u, "").split(/\r?\n/u);

  for (const rawLine of lines) {
    let line = rawLine.trim();
    if (
      line.length === 0 ||
      line.startsWith("#") ||
      line.startsWith("!") ||
      line.startsWith("//") ||
      line.startsWith(";")
    ) {
      continue;
    }
    if (line.startsWith("@@") || line.includes("##") || line.includes("#@#")) {
      continue;
    }

    const comment = line.indexOf("#");
    if (comment >= 0) {
      line = line.slice(0, comment).trim();
    }
    if (line.length === 0) {
      continue;
    }

    if (format === "hosts" || (format === "auto" && HOSTS_LINE.test(line))) {
      const match = HOSTS_RECORD.exec(line);
      if (match?.[1]) {
        for (const token of match[1].split(/\s+/u)) {
          const domain = normalizeBlocklistDomain(token);
          if (domain) {
            domains.push(domain);
          }
        }
        continue;
      }
    }

    const domain = normalizeBlocklistDomain(line);
    if (domain) {
      domains.push(domain);
    }
  }

  return domains;
}

export function isAllowlistedDomain(
  domain: string,
  allowed: ReadonlySet<string>,
): boolean {
  let candidate = domain;
  while (candidate.includes(".")) {
    if (allowed.has(candidate)) {
      return true;
    }
    const dot = candidate.indexOf(".");
    candidate = candidate.slice(dot + 1);
  }
  return false;
}

export function compareHashes(a: Uint8Array, b: Uint8Array): number {
  const length = Math.min(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    const left = a[index] ?? 0;
    const right = b[index] ?? 0;
    if (left !== right) {
      return left - right;
    }
  }
  return a.length - b.length;
}
