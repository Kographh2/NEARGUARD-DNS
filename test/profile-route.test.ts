import { describe, expect, it } from "vitest";

import { GET, POST } from "@/app/nearguard.mobileconfig/route";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function expectWellFormedXml(xml: string): void {
  const stack: string[] = [];
  const tagPattern = /<\/?([a-zA-Z][\w.-]*)(?:\s[^>]*)?\/?>/g;

  for (const match of xml.matchAll(tagPattern)) {
    const full = match[0];
    const name = match[1] ?? "";

    if (!name || full.startsWith("<?") || full.startsWith("<!")) {
      continue;
    }

    if (full.startsWith("</")) {
      expect(stack.pop()).toBe(name);
      continue;
    }

    if (!full.endsWith("/>")) {
      stack.push(name);
    }
  }

  expect(stack).toEqual([]);
}

describe("free mobileconfig profile", () => {
  it("returns an Apple profile attachment", async () => {
    const response = GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "application/x-apple-aspen-config",
    );
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="nearguard.mobileconfig"',
    );
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("returns a well-formed plist with the free DoH endpoint", async () => {
    const body = await GET().text();

    expect(body).toContain('<plist version="1.0">');
    expect(body).toContain("<key>PayloadType</key>");
    expect(body).toContain("<string>com.apple.dnsSettings.managed</string>");
    expect(body).toContain("<key>DNSProtocol</key>");
    expect(body).toContain("<string>HTTPS</string>");
    expect(body).toContain("<key>ServerURL</key>");
    expect(body).toContain(
      "<string>https://dns.nearguard.biz.id/dns-query</string>",
    );
    expect(body).not.toContain("OnDemandRules");
    expectWellFormedXml(body);
  });

  it("uses stable UUIDs for the profile and payload", async () => {
    const body = await GET().text();
    const uuids = [...body.matchAll(/<key>PayloadUUID<\/key>\s*<string>([^<]+)<\/string>/g)]
      .map((match) => match[1]);

    expect(uuids).toHaveLength(2);
    for (const uuid of uuids) {
      expect(uuid).toMatch(UUID_PATTERN);
    }

    const second = await GET().text();
    expect(second).toBe(body);
  });

  it("rejects non-GET methods", () => {
    const response = POST();

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET");
  });
});
