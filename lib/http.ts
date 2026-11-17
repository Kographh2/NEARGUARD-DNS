import { NextResponse } from "next/server";

export function methodNotAllowed(allow: string): Response {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: {
      allow,
      "content-type": "text/plain; charset=utf-8",
    },
  });
}

export function plainNotFound(): Response {
  return new Response("Not Found", {
    status: 404,
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}

export function redirectTo(request: Request, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

export function redirectWithError(
  request: Request,
  path: string,
  message: string,
): NextResponse {
  const url = new URL(path, request.url);
  url.searchParams.set("error", message.slice(0, 240));
  return NextResponse.redirect(url, 303);
}
