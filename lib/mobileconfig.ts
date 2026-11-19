import { createHash } from "node:crypto";

export const PROFILE_SIGNER_NAME = "FizzxDevv - Kograph Team";
export const PROFILE_ORGANIZATION = PROFILE_SIGNER_NAME;

export interface DnsProfileInput {
  serverUrl: string;
  profileIdentifier: string;
  displayName: string;
  description: string;
}

export interface DnsProfile {
  xml: string;
  profileIdentifier: string;
  displayName: string;
}

export function buildDnsProfile(input: DnsProfileInput): DnsProfile {
  const profileUuid = deterministicUuid(`${input.profileIdentifier}:profile`);
  const dnsUuid = deterministicUuid(`${input.profileIdentifier}:dns`);
  const serverUrl = escapeXml(input.serverUrl);
  const description = escapeXml(input.description);
  const displayName = escapeXml(input.displayName);
  const profileIdentifier = escapeXml(input.profileIdentifier);
  const signer = escapeXml(PROFILE_ORGANIZATION);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>DNSSettings</key>
      <dict>
        <key>DNSProtocol</key>
        <string>HTTPS</string>
        <key>ServerURL</key>
        <string>${serverUrl}</string>
      </dict>
      <key>PayloadDescription</key>
      <string>${description}</string>
      <key>PayloadDisplayName</key>
      <string>${displayName}</string>
      <key>PayloadIdentifier</key>
      <string>${profileIdentifier}.dns</string>
      <key>PayloadType</key>
      <string>com.apple.dnsSettings.managed</string>
      <key>PayloadUUID</key>
      <string>${dnsUuid}</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
    </dict>
  </array>
  <key>PayloadDescription</key>
  <string>${description}</string>
  <key>PayloadDisplayName</key>
  <string>${displayName}</string>
  <key>PayloadIdentifier</key>
  <string>${profileIdentifier}</string>
  <key>PayloadOrganization</key>
  <string>${signer}</string>
  <key>PayloadRemovalDisallowed</key>
  <false/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>${profileUuid}</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>
`;

  return {
    xml,
    profileIdentifier: input.profileIdentifier,
    displayName: input.displayName,
  };
}

export function buildFreeProfile(serverUrl: string): DnsProfile {
  return buildDnsProfile({
    serverUrl,
    profileIdentifier: "id.nearguard.free.profile",
    displayName: "NEAR ADGUARD DNS",
    description: "Profil DNS-over-HTTPS gratis NEAR ADGUARD.",
  });
}

export function buildUserProfile(options: {
  serverUrl: string;
  username: string;
  device: string;
}): DnsProfile {
  const username = identifierPart(options.username);
  const device = identifierPart(options.device);
  return buildDnsProfile({
    serverUrl: options.serverUrl,
    profileIdentifier: `id.nearguard.${username}.${device}.profile`,
    displayName: `NEAR ADGUARD - ${options.device}`,
    description: `Profil DNS-over-HTTPS NEAR ADGUARD untuk ${options.device}.`,
  });
}

export function deterministicUuid(seed: string): string {
  const bytes = Uint8Array.from(
    createHash("sha256").update(`nearguard:${seed}`).digest().subarray(0, 16),
  );
  bytes[6] = (bytes[6]! & 0x0f) | 0x50;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Buffer.from(bytes).toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

function identifierPart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "-");
}

function escapeXml(value: string): string {
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
        return "&apos;";
      default:
        return character;
    }
  });
}
