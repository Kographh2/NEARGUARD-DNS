import { NextResponse, type NextRequest } from "next/server";

import { DNS_CONTENT_TYPE } from "@/lib/constants";

export function middleware(request: NextRequest): NextResponse {
  const contentType =
    request.headers.get("content-type")?.toLowerCase() ?? "";
  const isDohPost =
    request.method === "POST" && contentType.startsWith(DNS_CONTENT_TYPE);
  const isDohGet =
    request.method === "GET" && request.nextUrl.searchParams.has("dns");

  if (isDohPost || isDohGet) {
    const url = request.nextUrl.clone();
    url.pathname = "/dns-query";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
