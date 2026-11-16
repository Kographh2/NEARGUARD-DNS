import {
  DNS_CONTENT_TYPE,
  MAX_DNS_MESSAGE_BYTES,
  UPSTREAM_DOH_URL,
  UPSTREAM_FALLBACK_DOH_URL,
  UPSTREAM_TIMEOUT_MS,
} from "@/lib/constants";
import { toArrayBuffer } from "@/lib/dns/bytes";

export type UpstreamFailure = "timeout" | "http" | "network" | "invalid";

export type UpstreamResult =
  | { ok: true; body: Uint8Array }
  | { ok: false; reason: UpstreamFailure };

export async function queryUpstream(body: Uint8Array): Promise<UpstreamResult> {
  const primary = await queryOne(UPSTREAM_DOH_URL, body);
  if (primary.ok) {
    return primary;
  }
  const fallback = await queryOne(UPSTREAM_FALLBACK_DOH_URL, body);
  if (fallback.ok) {
    return fallback;
  }
  return { ok: false, reason: primary.reason };
}

async function queryOne(
  url: string,
  body: Uint8Array,
): Promise<UpstreamResult> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, UPSTREAM_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        accept: DNS_CONTENT_TYPE,
        "content-type": DNS_CONTENT_TYPE,
      },
      body: toArrayBuffer(body),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      return { ok: false, reason: "http" };
    }

    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.startsWith(DNS_CONTENT_TYPE)) {
      return { ok: false, reason: "invalid" };
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_DNS_MESSAGE_BYTES) {
      return { ok: false, reason: "invalid" };
    }

    return { ok: true, body: new Uint8Array(buffer) };
  } catch {
    return { ok: false, reason: timedOut ? "timeout" : "network" };
  } finally {
    clearTimeout(timer);
  }
}
