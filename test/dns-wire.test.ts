import { describe, expect, it } from "vitest";

import {
  buildDnsQuery,
  buildDnsResponse,
  decodeBase64Url,
  DnsParseError,
  encodeBase64Url,
  encodeName,
  parseDnsQuery,
  RCODE_FORMERR,
  RCODE_NXDOMAIN,
  RCODE_REFUSED,
} from "@/lib/dns/wire";

describe("DNS wire format", () => {
  it("parses a standard query", () => {
    const raw = buildDnsQuery({
      id: 0x1234,
      name: "ads.example.com",
      type: 1,
    });
    const query = parseDnsQuery(raw);
    expect(query.id).toBe(0x1234);
    expect(query.question).toEqual({
      name: "ads.example.com",
      type: 1,
      class: 1,
    });
    expect(query.questionWire.length).toBe(raw.length - 12);
  });

  it("normalizes names to lowercase and strips the trailing dot", () => {
    const raw = buildDnsQuery({
      id: 7,
      name: "ADS.Example.COM.",
    });
    const query = parseDnsQuery(raw);
    expect(query.question.name).toBe("ads.example.com");
  });

  it("round-trips base64url", () => {
    const raw = buildDnsQuery({ id: 9, name: "example.com" });
    const encoded = encodeBase64Url(raw);
    const decoded = decodeBase64Url(encoded);
    expect(parseDnsQuery(decoded).id).toBe(9);
  });

  it("rejects invalid base64url", () => {
    expect(() => decodeBase64Url("!!!!")).toThrow(DnsParseError);
    expect(() => decodeBase64Url("")).toThrow(DnsParseError);
  });

  it("rejects short messages", () => {
    expect(() => parseDnsQuery(new Uint8Array([0, 1, 2]))).toThrow(
      DnsParseError,
    );
  });

  it("rejects a response instead of a query", () => {
    const raw = buildDnsQuery({ id: 1, name: "example.com" });
    raw[2] = 0x81;
    raw[3] = 0x80;
    expect(() => parseDnsQuery(raw)).toThrow(DnsParseError);
  });

  it("rejects a non-standard opcode", () => {
    const raw = buildDnsQuery({ id: 1, name: "example.com" });
    raw[2] = 0x08;
    expect(() => parseDnsQuery(raw)).toThrow(DnsParseError);
  });

  it("rejects zero or multiple questions", () => {
    const raw = buildDnsQuery({ id: 1, name: "example.com" });
    raw[4] = 0;
    raw[5] = 0;
    expect(() => parseDnsQuery(raw)).toThrow(DnsParseError);

    const two = buildDnsQuery({ id: 1, name: "example.com" });
    two[5] = 2;
    expect(() => parseDnsQuery(two)).toThrow(DnsParseError);
  });

  it("rejects compression pointer loops", () => {
    const raw = new Uint8Array(16);
    raw[5] = 1;
    raw[12] = 0xc0;
    raw[13] = 0x0c;
    raw[15] = 1;
    expect(() => parseDnsQuery(raw)).toThrow(DnsParseError);
  });

  it("follows a valid compression pointer", () => {
    const raw = new Uint8Array(27);
    raw[5] = 1;
    raw[12] = 0xc0;
    raw[13] = 0x12;
    raw[15] = 1;
    raw[17] = 1;
    raw[18] = 7;
    const label = "example";
    for (let index = 0; index < label.length; index += 1) {
      raw[19 + index] = label.charCodeAt(index);
    }
    raw[26] = 0;
    const query = parseDnsQuery(raw);
    expect(query.question.name).toBe("example");
  });

  it("rejects invalid label characters", () => {
    const raw = new Uint8Array(21);
    raw[5] = 1;
    raw[12] = 3;
    raw[13] = 0x01;
    raw[14] = 0x02;
    raw[15] = 0x03;
    raw[16] = 0;
    raw[18] = 1;
    raw[20] = 1;
    expect(() => parseDnsQuery(raw)).toThrow(DnsParseError);
  });

  it("builds an NXDOMAIN response with the question and SOA", () => {
    const query = parseDnsQuery(
      buildDnsQuery({ id: 0xabcd, name: "ads.example.com" }),
    );
    const response = buildDnsResponse({
      query,
      rcode: RCODE_NXDOMAIN,
      includeSoa: true,
    });
    const flags = (response[2]! << 8) | response[3]!;
    const qdcount = (response[4]! << 8) | response[5]!;
    const ancount = (response[6]! << 8) | response[7]!;
    const nscount = (response[8]! << 8) | response[9]!;

    expect((response[0]! << 8) | response[1]!).toBe(0xabcd);
    expect(flags & 0x8000).toBe(0x8000);
    expect(flags & 0x000f).toBe(RCODE_NXDOMAIN);
    expect(qdcount).toBe(1);
    expect(ancount).toBe(0);
    expect(nscount).toBe(1);
    expect(response.slice(12, 12 + query.questionWire.length)).toEqual(
      query.questionWire,
    );
  });

  it("builds a REFUSED response without an SOA", () => {
    const query = parseDnsQuery(
      buildDnsQuery({ id: 1, name: "example.com" }),
    );
    const response = buildDnsResponse({ query, rcode: RCODE_REFUSED });
    const flags = (response[2]! << 8) | response[3]!;
    const nscount = (response[8]! << 8) | response[9]!;
    expect(flags & 0x000f).toBe(RCODE_REFUSED);
    expect(nscount).toBe(0);
  });

  it("builds a minimal FORMERR response without a question", () => {
    const response = buildDnsResponse({ rcode: RCODE_FORMERR });
    const flags = (response[2]! << 8) | response[3]!;
    const qdcount = (response[4]! << 8) | response[5]!;
    expect(response.length).toBe(12);
    expect(flags & 0x000f).toBe(RCODE_FORMERR);
    expect(qdcount).toBe(0);
  });

  it("encodes root and normal names", () => {
    expect(Array.from(encodeName("."))).toEqual([0]);
    const encoded = encodeName("Example.COM.");
    expect(encoded[0]).toBe(7);
    expect(encoded[encoded.length - 1]).toBe(0);
  });

  it("rejects labels that are too long or non-ASCII", () => {
    expect(() => encodeName(`${"a".repeat(64)}.example`)).toThrow(
      DnsParseError,
    );
    expect(() => encodeName("bücher.example")).toThrow(DnsParseError);
  });
});
