import { MAX_DNS_MESSAGE_BYTES } from "@/lib/constants";

export const DNS_HEADER_BYTES = 12;
export const DNS_TYPE_A = 1;
export const DNS_TYPE_AAAA = 28;
export const DNS_TYPE_SOA = 6;
export const DNS_CLASS_IN = 1;

export const RCODE_NOERROR = 0;
export const RCODE_FORMERR = 1;
export const RCODE_SERVFAIL = 2;
export const RCODE_NXDOMAIN = 3;
export const RCODE_REFUSED = 5;

const MAX_NAME_LENGTH = 255;
const MAX_LABEL_LENGTH = 63;
const MAX_POINTER_DEPTH = 20;
const SOA_TTL_SECONDS = 60;

export class DnsParseError extends Error {
  readonly rcode: number;

  constructor(message: string, rcode = RCODE_FORMERR) {
    super(message);
    this.name = "DnsParseError";
    this.rcode = rcode;
  }
}

export interface DnsQuestion {
  name: string;
  type: number;
  class: number;
}

export interface ParsedDnsQuery {
  raw: Uint8Array;
  id: number;
  flags: number;
  question: DnsQuestion;
  questionWire: Uint8Array;
  questionEnd: number;
}

export function decodeBase64Url(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+={0,2}$/u.test(value)) {
    throw new DnsParseError("Invalid base64url encoding");
  }
  const decoded = Buffer.from(value, "base64url");
  if (decoded.length === 0) {
    throw new DnsParseError("Empty DNS message");
  }
  if (decoded.length > MAX_DNS_MESSAGE_BYTES) {
    throw new DnsParseError("DNS message is too large");
  }
  return new Uint8Array(decoded);
}

export function encodeBase64Url(value: Uint8Array): string {
  return Buffer.from(value).toString("base64url");
}

export function normalizeDnsName(value: string): string {
  let name = value.trim().toLowerCase();
  while (name.endsWith(".")) {
    name = name.slice(0, -1);
  }
  return name;
}

export function parseDnsQuery(raw: Uint8Array): ParsedDnsQuery {
  if (raw.length < DNS_HEADER_BYTES) {
    throw new DnsParseError("DNS message is shorter than the header");
  }
  if (raw.length > MAX_DNS_MESSAGE_BYTES) {
    throw new DnsParseError("DNS message is too large");
  }

  const id = readUint16(raw, 0);
  const flags = readUint16(raw, 2);
  const qdcount = readUint16(raw, 4);

  if ((flags & 0x8000) !== 0) {
    throw new DnsParseError("Expected a DNS query, not a response");
  }
  if ((flags & 0x7800) !== 0) {
    throw new DnsParseError("Unsupported DNS opcode", RCODE_SERVFAIL);
  }
  if (qdcount !== 1) {
    throw new DnsParseError("Exactly one DNS question is supported");
  }

  const parsedName = readName(raw, DNS_HEADER_BYTES);
  const questionEnd = parsedName.nextOffset + 4;
  if (questionEnd > raw.length) {
    throw new DnsParseError("Truncated DNS question");
  }

  const question: DnsQuestion = {
    name: parsedName.name,
    type: readUint16(raw, parsedName.nextOffset),
    class: readUint16(raw, parsedName.nextOffset + 2),
  };

  return {
    raw,
    id,
    flags,
    question,
    questionWire: raw.slice(DNS_HEADER_BYTES, questionEnd),
    questionEnd,
  };
}

export function buildDnsQuery(options: {
  id: number;
  name: string;
  type?: number;
  class?: number;
  rd?: boolean;
}): Uint8Array {
  const name = encodeName(options.name);
  const message = new Uint8Array(DNS_HEADER_BYTES + name.length + 4);
  writeUint16(message, 0, options.id & 0xffff);
  writeUint16(message, 2, options.rd === false ? 0 : 0x0100);
  writeUint16(message, 4, 1);
  writeUint16(message, 6, 0);
  writeUint16(message, 8, 0);
  writeUint16(message, 10, 0);
  message.set(name, DNS_HEADER_BYTES);
  const offset = DNS_HEADER_BYTES + name.length;
  writeUint16(message, offset, options.type ?? DNS_TYPE_A);
  writeUint16(message, offset + 2, options.class ?? DNS_CLASS_IN);
  return message;
}

export function buildDnsResponse(options: {
  query?: Pick<ParsedDnsQuery, "id" | "flags" | "question" | "questionWire">;
  rcode: number;
  includeSoa?: boolean;
}): Uint8Array {
  const question = options.query?.question;
  const questionWire = options.query?.questionWire;
  const includeSoa =
    options.includeSoa === true &&
    options.rcode === RCODE_NXDOMAIN &&
    question !== undefined;

  const soa = includeSoa && question ? buildSoaRecord(question.name) : undefined;
  const qdcount = questionWire ? 1 : 0;
  const nscount = soa ? 1 : 0;
  const length =
    DNS_HEADER_BYTES +
    (questionWire?.length ?? 0) +
    (soa?.length ?? 0);

  const response = new Uint8Array(length);
  const requestFlags = options.query?.flags ?? 0;
  const flags =
    0x8000 |
    (requestFlags & 0x0100) |
    (requestFlags & 0x0010) |
    0x0080 |
    (options.rcode & 0x000f);

  writeUint16(response, 0, options.query?.id ?? 0);
  writeUint16(response, 2, flags);
  writeUint16(response, 4, qdcount);
  writeUint16(response, 6, 0);
  writeUint16(response, 8, nscount);
  writeUint16(response, 10, 0);

  let offset = DNS_HEADER_BYTES;
  if (questionWire) {
    response.set(questionWire, offset);
    offset += questionWire.length;
  }
  if (soa) {
    response.set(soa, offset);
  }
  return response;
}

export function buildSoaRecord(name: string): Uint8Array {
  const owner = encodeName(name);
  const mname = encodeName("ns.nearguard.biz.id");
  const rname = encodeName("hostmaster.nearguard.biz.id");
  const rdataLength = mname.length + rname.length + 20;
  const record = new Uint8Array(owner.length + 10 + rdataLength);
  let offset = 0;

  record.set(owner, offset);
  offset += owner.length;
  writeUint16(record, offset, DNS_TYPE_SOA);
  offset += 2;
  writeUint16(record, offset, DNS_CLASS_IN);
  offset += 2;
  writeUint32(record, offset, SOA_TTL_SECONDS);
  offset += 4;
  writeUint16(record, offset, rdataLength);
  offset += 2;
  record.set(mname, offset);
  offset += mname.length;
  record.set(rname, offset);
  offset += rname.length;
  writeUint32(record, offset, 1);
  offset += 4;
  writeUint32(record, offset, 3600);
  offset += 4;
  writeUint32(record, offset, 600);
  offset += 4;
  writeUint32(record, offset, 86400);
  offset += 4;
  writeUint32(record, offset, SOA_TTL_SECONDS);
  return record;
}

export function encodeName(value: string): Uint8Array {
  const name = normalizeDnsName(value);
  if (name.length === 0) {
    return new Uint8Array([0]);
  }

  const labels = name.split(".");
  const parts: Uint8Array[] = [];
  let total = 1;

  for (const label of labels) {
    if (label.length === 0 || label.length > MAX_LABEL_LENGTH) {
      throw new DnsParseError("Invalid DNS label length");
    }
    const bytes = new TextEncoder().encode(label);
    if (bytes.length !== label.length) {
      throw new DnsParseError("Non-ASCII DNS labels must be punycode-encoded");
    }
    for (const byte of bytes) {
      if (byte < 0x21 || byte > 0x7e || byte === 0x2e) {
        throw new DnsParseError("Invalid DNS label character");
      }
    }
    total += 1 + bytes.length;
    if (total > MAX_NAME_LENGTH) {
      throw new DnsParseError("DNS name is too long");
    }
    parts.push(bytes);
  }

  const encoded = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    encoded[offset] = part.length;
    offset += 1;
    encoded.set(part, offset);
    offset += part.length;
  }
  encoded[offset] = 0;
  return encoded;
}

function readName(
  raw: Uint8Array,
  startOffset: number,
  depth = 0,
  visited = new Set<number>(),
): { name: string; nextOffset: number } {
  if (depth > MAX_POINTER_DEPTH) {
    throw new DnsParseError("DNS compression pointer depth exceeded");
  }

  const labels: string[] = [];
  let cursor = startOffset;
  let nextOffset = startOffset;
  let jumped = false;
  let nameLength = 0;
  let steps = 0;

  while (true) {
    if (cursor >= raw.length) {
      throw new DnsParseError("Truncated DNS name");
    }
    if (steps++ > 128) {
      throw new DnsParseError("DNS name is too long");
    }

    const lengthByte = raw[cursor];
    if (lengthByte === undefined) {
      throw new DnsParseError("Truncated DNS name");
    }

    if (lengthByte === 0) {
      cursor += 1;
      if (!jumped) {
        nextOffset = cursor;
      }
      break;
    }

    if ((lengthByte & 0xc0) === 0xc0) {
      if (cursor + 1 >= raw.length) {
        throw new DnsParseError("Truncated DNS compression pointer");
      }
      const low = raw[cursor + 1];
      if (low === undefined) {
        throw new DnsParseError("Truncated DNS compression pointer");
      }
      const pointer = ((lengthByte & 0x3f) << 8) | low;
      if (pointer >= raw.length) {
        throw new DnsParseError("DNS compression pointer out of range");
      }
      if (visited.has(pointer)) {
        throw new DnsParseError("DNS compression pointer loop");
      }
      visited.add(pointer);
      if (!jumped) {
        nextOffset = cursor + 2;
        jumped = true;
      }
      const result = readName(raw, pointer, depth + 1, visited);
      if (result.name.length > 0 && result.name !== ".") {
        labels.push(result.name);
      }
      break;
    }

    if ((lengthByte & 0xc0) !== 0) {
      throw new DnsParseError("Unsupported DNS label type");
    }

    const labelLength = lengthByte;
    if (labelLength > MAX_LABEL_LENGTH) {
      throw new DnsParseError("DNS label is too long");
    }
    if (cursor + 1 + labelLength > raw.length) {
      throw new DnsParseError("Truncated DNS label");
    }

    nameLength += 1 + labelLength;
    if (nameLength > MAX_NAME_LENGTH) {
      throw new DnsParseError("DNS name is too long");
    }

    let label = "";
    for (let index = 0; index < labelLength; index += 1) {
      const byte = raw[cursor + 1 + index];
      if (byte === undefined) {
        throw new DnsParseError("Truncated DNS label");
      }
      if (byte < 0x21 || byte > 0x7e || byte === 0x2e) {
        throw new DnsParseError("Invalid DNS label character");
      }
      label += String.fromCharCode(byte);
    }
    labels.push(label.toLowerCase());
    cursor += 1 + labelLength;
  }

  const name = labels.length === 0 ? "." : labels.join(".");
  if (name.length > MAX_NAME_LENGTH) {
    throw new DnsParseError("DNS name is too long");
  }
  return {
    name,
    nextOffset,
  };
}

function readUint16(raw: Uint8Array, offset: number): number {
  const high = raw[offset];
  const low = raw[offset + 1];
  if (high === undefined || low === undefined) {
    throw new DnsParseError("Truncated DNS message");
  }
  return (high << 8) | low;
}

function writeUint16(raw: Uint8Array, offset: number, value: number): void {
  raw[offset] = (value >>> 8) & 0xff;
  raw[offset + 1] = value & 0xff;
}

function writeUint32(raw: Uint8Array, offset: number, value: number): void {
  raw[offset] = (value >>> 24) & 0xff;
  raw[offset + 1] = (value >>> 16) & 0xff;
  raw[offset + 2] = (value >>> 8) & 0xff;
  raw[offset + 3] = value & 0xff;
}
