import { isUnroutableUsername } from "@/lib/constants";
import { handleDohRequest } from "@/lib/dns/handler";
import { plainNotFound } from "@/lib/http";
import { deviceLabelSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ username: string; device: string }> },
): Promise<Response> {
  const { username, device } = await context.params;
  if (isUnroutableUsername(username)) {
    return plainNotFound();
  }
  const parsed = deviceLabelSchema.safeParse(device);
  if (!parsed.success) {
    return plainNotFound();
  }
  return handleDohRequest(request, {
    route: "username",
    username,
    device: parsed.data,
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ username: string; device: string }> },
): Promise<Response> {
  const { username, device } = await context.params;
  if (isUnroutableUsername(username)) {
    return plainNotFound();
  }
  const parsed = deviceLabelSchema.safeParse(device);
  if (!parsed.success) {
    return plainNotFound();
  }
  return handleDohRequest(request, {
    route: "username",
    username,
    device: parsed.data,
  });
}
