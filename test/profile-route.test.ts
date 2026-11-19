import forge from "node-forge";
import { describe, expect, it } from "vitest";

import { GET, POST } from "@/app/nearguard.mobileconfig/route";
import {
  PROFILE_SIGNER_NAME,
  buildFreeProfile,
  buildUserProfile,
  deterministicUuid,
} from "@/lib/mobileconfig";

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
  it("returns a signed Apple profile attachment", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "application/x-apple-aspen-config",
    );
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="nearguard.mobileconfig"',
    );
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");

    const body = new Uint8Array(await response.arrayBuffer());
    expect(body[0]).toBe(0x30);
    const raw = Buffer.from(body);
    expect(raw.includes(Buffer.from(PROFILE_SIGNER_NAME))).toBe(true);
    expect(
      raw.includes(
        Buffer.from(
          "<string>https://dns.nearguard.biz.id/dns-query</string>",
        ),
      ),
    ).toBe(true);
  });

  it("returns a well-formed plist with the free DoH endpoint", () => {
    const xml = buildFreeProfile("https://dns.nearguard.biz.id/dns-query").xml;

    expect(xml).toContain('<plist version="1.0">');
    expect(xml).toContain("<key>PayloadType</key>");
    expect(xml).toContain("<string>com.apple.dnsSettings.managed</string>");
    expect(xml).toContain("<key>DNSProtocol</key>");
    expect(xml).toContain("<string>HTTPS</string>");
    expect(xml).toContain("<key>ServerURL</key>");
    expect(xml).toContain(
      "<string>https://dns.nearguard.biz.id/dns-query</string>",
    );
    expect(xml).toContain(
      `<string>${PROFILE_SIGNER_NAME}</string>`,
    );
    expect(xml).not.toContain("OnDemandRules");
    expectWellFormedXml(xml);
  });

  it("uses stable UUIDs for the profile and payload", async () => {
    const xml = buildFreeProfile("https://dns.nearguard.biz.id/dns-query").xml;
    const uuids = [...xml.matchAll(/<key>PayloadUUID<\/key>\s*<string>([^<]+)<\/string>/g)]
      .map((match) => match[1]);

    expect(uuids).toHaveLength(2);
    for (const uuid of uuids) {
      expect(uuid).toMatch(UUID_PATTERN);
    }

    const second = await GET();
    const first = await GET();
    expect(await second.text()).toBe(await first.text());
  });

  it("embeds the signer name in the CMS certificate", async () => {
    const body = Buffer.from(await (await GET()).arrayBuffer());
    const message = forge.pkcs7.messageFromAsn1(
      forge.asn1.fromDer(forge.util.createBuffer(body.toString("binary"))),
    ) as forge.pkcs7.PkcsSignedData;

    expect(message.certificates).toHaveLength(1);
    const commonName = message.certificates[0]?.subject.getField("CN")?.value;
    expect(commonName).toBe(PROFILE_SIGNER_NAME);
  });

  it("rejects non-GET methods", () => {
    const response = POST();

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET");
  });
});

describe("personal mobileconfig profile", () => {
  it("points the DNS payload at the username and device path", () => {
    const profile = buildUserProfile({
      serverUrl: "https://dns.nearguard.biz.id/alice/iphone",
      username: "alice",
      device: "iphone",
    });

    expect(profile.xml).toContain(
      "<string>https://dns.nearguard.biz.id/alice/iphone</string>",
    );
    expect(profile.xml).toContain(
      "<string>id.nearguard.alice.iphone.profile</string>",
    );
    expect(profile.xml).toContain(
      "<string>id.nearguard.alice.iphone.profile.dns</string>",
    );
    expect(profile.xml).toContain("NEAR ADGUARD - iphone");
    expectWellFormedXml(profile.xml);
  });

  it("creates deterministic UUIDs from the profile seed", () => {
    const first = deterministicUuid("alice:iphone");
    const second = deterministicUuid("alice:iphone");
    const other = deterministicUuid("alice:ipad");

    expect(first).toBe(second);
    expect(first).not.toBe(other);
    expect(first).toMatch(UUID_PATTERN);
  });
});
