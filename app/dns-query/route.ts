import { handleDohRequest } from "@/lib/dns/handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request): Promise<Response> {
  return handleDohRequest(request, { route: "free" });
}

export function POST(request: Request): Promise<Response> {
  return handleDohRequest(request, { route: "free" });
}
