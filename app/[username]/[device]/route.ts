import { handleDohRequest } from "@/lib/dns/handler";
import { deviceLabelSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ username: string; device: string }> },
): Promise<Response> {
  const { username, device } = await context.params;
  const parsed = deviceLabelSchema.safeParse(device);
  if (!parsed.success) {
    return new Response("Not Found", { status: 404 });
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
  const parsed = deviceLabelSchema.safeParse(device);
  if (!parsed.success) {
    return new Response("Not Found", { status: 404 });
  }
  return handleDohRequest(request, {
    route: "username",
    username,
    device: parsed.data,
  });
}
