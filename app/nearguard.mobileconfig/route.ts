import { methodNotAllowed } from "@/lib/http";

const FREE_PROFILE = `<?xml version="1.0" encoding="UTF-8"?>
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
        <string>https://dns.nearguard.biz.id/dns-query</string>
      </dict>
      <key>PayloadDescription</key>
      <string>Encrypted DNS-over-HTTPS for NEAR ADGUARD.</string>
      <key>PayloadDisplayName</key>
      <string>NEAR ADGUARD DNS</string>
      <key>PayloadIdentifier</key>
      <string>id.nearguard.free.dns</string>
      <key>PayloadType</key>
      <string>com.apple.dnsSettings.managed</string>
      <key>PayloadUUID</key>
      <string>ad6d7af7-3349-499f-a7ea-0ab7a9ffd080</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
    </dict>
  </array>
  <key>PayloadDescription</key>
  <string>Free NEAR ADGUARD DNS-over-HTTPS profile.</string>
  <key>PayloadDisplayName</key>
  <string>NEAR ADGUARD</string>
  <key>PayloadIdentifier</key>
  <string>id.nearguard.free.profile</string>
  <key>PayloadOrganization</key>
  <string>NEAR ADGUARD</string>
  <key>PayloadRemovalDisallowed</key>
  <false/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>42f3c475-6a4f-473d-b3fe-c69df4905e4a</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>
`;

export const dynamic = "force-static";

export function GET(): Response {
  return new Response(FREE_PROFILE, {
    status: 200,
    headers: {
      "cache-control": "public, max-age=3600",
      "content-disposition": 'attachment; filename="nearguard.mobileconfig"',
      "content-type": "application/x-apple-aspen-config",
      "x-content-type-options": "nosniff",
    },
  });
}

export function POST(): Response {
  return methodNotAllowed("GET");
}
