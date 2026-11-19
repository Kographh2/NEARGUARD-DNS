import { createRouteSupabaseClient } from "@/lib/auth";
import { toArrayBuffer } from "@/lib/dns/bytes";
import { getAppUrl } from "@/lib/env";
import { methodNotAllowed, plainNotFound, redirectTo } from "@/lib/http";
import { buildUserProfile } from "@/lib/mobileconfig";
import { signMobileConfig } from "@/lib/mobileconfig-sign";
import { deviceLabelSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ device: string }> },
): Promise<Response> {
  const { device } = await context.params;
  const parsed = deviceLabelSchema.safeParse(device);
  if (!parsed.success) {
    return plainNotFound();
  }

  let supabase;
  try {
    ({ supabase } = await createRouteSupabaseClient());
  } catch {
    return new Response("Profil belum bisa dibuat di deployment ini.", {
      status: 503,
    });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return redirectTo(request, "/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("username, status")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return new Response("Profil akun belum tersedia. Coba lagi nanti.", {
      status: 503,
    });
  }
  if (typeof profile?.username !== "string") {
    return new Response(
      "Username akun belum tersedia. Hubungi dukungan sebelum memasang profil.",
      { status: 409 },
    );
  }
  if (profile.status === "suspended") {
    return new Response("Akun ini sedang ditangguhkan.", { status: 403 });
  }

  const username = profile.username;
  const serverUrl = `${getAppUrl()}/${username}/${parsed.data}`;
  const profileFile = buildUserProfile({
    serverUrl,
    username,
    device: parsed.data,
  });
  const signed = await signMobileConfig(profileFile.xml);

  return new Response(toArrayBuffer(signed), {
    status: 200,
    headers: {
      "cache-control": "private, no-store",
      "content-disposition": `attachment; filename="nearguard-${username}-${parsed.data}.mobileconfig"`,
      "content-type": "application/x-apple-aspen-config",
      "x-content-type-options": "nosniff",
    },
  });
}

export function POST(): Response {
  return methodNotAllowed("GET");
}
