import { FREE_DOH_URL } from "@/lib/constants";
import { toArrayBuffer } from "@/lib/dns/bytes";
import { methodNotAllowed } from "@/lib/http";
import { buildFreeProfile } from "@/lib/mobileconfig";
import { signMobileConfig } from "@/lib/mobileconfig-sign";

export const runtime = "nodejs";
export const dynamic = "force-static";

let profilePromise: Promise<Uint8Array> | null = null;

function getProfile(): Promise<Uint8Array> {
  if (!profilePromise) {
    profilePromise = signMobileConfig(buildFreeProfile(FREE_DOH_URL).xml).catch(
      (error: unknown) => {
        profilePromise = null;
        throw error;
      },
    );
  }
  return profilePromise;
}

export async function GET(): Promise<Response> {
  const profile = await getProfile();
  return new Response(toArrayBuffer(profile), {
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
