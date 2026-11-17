import { isUnroutableUsername } from "@/lib/constants";
import { handleDohRequest } from "@/lib/dns/handler";
import { plainNotFound } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ username: string }> },
): Promise<Response> {
  const { username } = await context.params;
  if (isUnroutableUsername(username)) {
    return plainNotFound();
  }
  return handleDohRequest(request, { route: "username", username });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ username: string }> },
): Promise<Response> {
  const { username } = await context.params;
  if (isUnroutableUsername(username)) {
    return plainNotFound();
  }
  return handleDohRequest(request, { route: "username", username });
}
