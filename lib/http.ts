import { NextResponse } from "next/server";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    return request.method === "GET" || request.method === "HEAD";
  }

  try {
    const originHost = new URL(origin).host;
    const host = request.headers.get("host");
    return Boolean(host) && originHost === host;
  } catch {
    return false;
  }
}

export function requireSameOrigin(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid request origin.", 403);
  }
  return null;
}
