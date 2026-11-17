import { after } from "next/server";

import { circuitBreaker } from "@/lib/circuit-breaker";
import {
  BRAND,
  DNS_CONTENT_TYPE,
  FREE_DOH_URL,
  MAX_DNS_MESSAGE_BYTES,
} from "@/lib/constants";
import { flushEvents, recordEvent, type EventTier } from "@/lib/events";
import { getClientIp, rateLimiter } from "@/lib/ratelimit";
import { resolveTier, type TierInfo } from "@/lib/tiers";
import { getBlocklist } from "@/lib/dns/blocklist";
import { DEFAULT_CATEGORIES } from "@/lib/dns/categories";
import { toArrayBuffer } from "@/lib/dns/bytes";
import { queryUpstream } from "@/lib/dns/upstream";
import {
  buildDnsResponse,
  decodeBase64Url,
  DnsParseError,
  parseDnsQuery,
  RCODE_FORMERR,
  RCODE_NXDOMAIN,
  RCODE_REFUSED,
  RCODE_SERVFAIL,
  type ParsedDnsQuery,
} from "@/lib/dns/wire";

export interface DohRouteOptions {
  route: "free" | "username";
  username?: string;
  device?: string;
}

type ResolvedTier = {
  tier: EventTier;
  info: TierInfo | null;
  unknown: boolean;
};

export async function handleDohRequest(
  request: Request,
  options: DohRouteOptions,
): Promise<Response> {
  if (request.method !== "GET" && request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { allow: "GET, POST" },
    });
  }

  let queryBytes: Uint8Array;
  if (request.method === "GET") {
    const dns = new URL(request.url).searchParams.get("dns");
    if (!dns) {
      return infoResponse(options);
    }
    try {
      queryBytes = decodeBase64Url(dns);
    } catch {
      return new Response("Bad Request", { status: 400 });
    }
  } else {
    const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.startsWith(DNS_CONTENT_TYPE)) {
      return new Response("Unsupported Media Type", { status: 415 });
    }
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_DNS_MESSAGE_BYTES) {
      return new Response("Payload Too Large", { status: 413 });
    }
    try {
      const body = await request.arrayBuffer();
      if (body.byteLength === 0 || body.byteLength > MAX_DNS_MESSAGE_BYTES) {
        return new Response("Payload Too Large", { status: 413 });
      }
      queryBytes = new Uint8Array(body);
    } catch {
      return new Response("Bad Request", { status: 400 });
    }
  }

  let query: ParsedDnsQuery;
  try {
    query = parseDnsQuery(queryBytes);
  } catch (error) {
    const rcode = error instanceof DnsParseError ? error.rcode : RCODE_FORMERR;
    return dnsResponse(buildDnsResponse({ rcode }));
  }

  const ip = getClientIp(request);
  const resolved = resolveRouteTier(options);
  const rateLimited = checkRateLimit(resolved, options, ip);
  if (!rateLimited.allowed) {
    recordEvent({
      tier: resolved.tier,
      userId: resolved.info?.userId,
      deviceId: options.device,
      blocked: false,
      rateLimited: true,
      at: Date.now(),
    });
    scheduleFlush();
    return dnsResponse(
      buildDnsResponse({ query, rcode: RCODE_REFUSED }),
    );
  }

  if (circuitBreaker.isThrottled(resolved.tier)) {
    recordEvent({
      tier: resolved.tier,
      userId: resolved.info?.userId,
      deviceId: options.device,
      blocked: false,
      rateLimited: true,
      at: Date.now(),
    });
    scheduleFlush();
    return dnsResponse(
      buildDnsResponse({ query, rcode: RCODE_REFUSED }),
    );
  }

  const category = getBlocklist().match(query.question.name);
  const categories =
    resolved.tier === "registered"
      ? resolved.info?.categories ?? DEFAULT_CATEGORIES
      : DEFAULT_CATEGORIES;
  if (category !== null && (category & categories) !== 0) {
    recordEvent({
      tier: resolved.tier,
      userId: resolved.info?.userId,
      deviceId: options.device,
      domain:
        resolved.info?.tier === "registered" && resolved.info.logBlocked
          ? query.question.name
          : undefined,
      qtype: query.question.type,
      category,
      blocked: true,
      rateLimited: false,
      at: Date.now(),
    });
    scheduleFlush();
    return dnsResponse(
      buildDnsResponse({
        query,
        rcode: RCODE_NXDOMAIN,
        includeSoa: true,
      }),
    );
  }

  const upstream = await queryUpstream(queryBytes);
  recordEvent({
    tier: resolved.tier,
    userId: resolved.info?.userId,
    deviceId: options.device,
    qtype: query.question.type,
    blocked: false,
    rateLimited: false,
    at: Date.now(),
  });
  scheduleFlush();

  if (!upstream.ok) {
    return dnsResponse(
      buildDnsResponse({ query, rcode: RCODE_SERVFAIL }),
    );
  }

  return dnsResponse(upstream.body);
}

function resolveRouteTier(options: DohRouteOptions): ResolvedTier {
  if (options.route === "free") {
    return { tier: "free", info: null, unknown: false };
  }

  const info = options.username ? resolveTier(options.username) : null;
  if (!info) {
    return { tier: "free", info: null, unknown: true };
  }
  if (info.status === "suspended") {
    return { tier: "free", info, unknown: false };
  }
  return { tier: "registered", info, unknown: false };
}

function checkRateLimit(
  resolved: ResolvedTier,
  options: DohRouteOptions,
  ip: string,
): { allowed: boolean } {
  if (resolved.unknown) {
    const unknown = rateLimiter.checkUnknown(ip);
    if (!unknown.allowed) {
      return { allowed: false };
    }
  }

  if (resolved.tier === "registered" && resolved.info) {
    const result = rateLimiter.checkRegistered({
      accountId: resolved.info.userId,
      ip,
      deviceKey: options.device ?? resolved.info.username,
    });
    return { allowed: result.allowed };
  }

  const result = rateLimiter.checkFree(ip);
  return { allowed: result.allowed };
}

function scheduleFlush(): void {
  try {
    after(flushEvents);
  } catch {
    void flushEvents();
  }
}

function dnsResponse(body: Uint8Array): Response {
  return new Response(toArrayBuffer(body), {
    status: 200,
    headers: {
      "cache-control": "no-store",
      "content-type": DNS_CONTENT_TYPE,
      "x-content-type-options": "nosniff",
    },
  });
}

function infoResponse(options: DohRouteOptions): Response {
  const path =
    options.route === "free"
      ? "/dns-query"
      : `/${options.username ?? ""}${options.device ? `/${options.device}` : ""}`;
  const safePath = escapeHtml(path);
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${BRAND} DoH endpoint</title>
<style>
body{margin:0;background:#05070a;color:#e2e8f0;font:16px/1.6 system-ui,sans-serif;display:grid;min-height:100vh;place-items:center;padding:24px}
main{max-width:640px;border:1px solid #1e293b;border-radius:24px;padding:32px;background:#0b1120}
code{color:#6ee7b7;word-break:break-all}
a{color:#6ee7b7}
h1{font-size:24px;margin:0 0 8px}
p{color:#94a3b8;margin:8px 0}
</style>
</head>
<body>
<main>
<h1>${BRAND} DoH endpoint</h1>
<p>This path accepts DNS-over-HTTPS requests. It is not a web page.</p>
<p>Endpoint: <code>${FREE_DOH_URL}</code></p>
<p>Use <code>POST</code> with <code>application/dns-message</code> or <code>GET ?dns=...</code>.</p>
<p>Path: <code>${safePath}</code></p>
<p><a href="/">Back to ${BRAND}</a></p>
</main>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "cache-control": "no-store",
      "content-type": "text/html; charset=utf-8",
      "x-content-type-options": "nosniff",
    },
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/gu, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });
}
