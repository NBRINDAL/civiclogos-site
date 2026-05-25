import { NextRequest, NextResponse } from "next/server";

function getAllowedOrigins(request: NextRequest) {
  const configuredOrigins = (process.env.CIVIC_LOGOS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const requestOrigin = request.nextUrl.origin;

  return new Set([requestOrigin, ...configuredOrigins]);
}

export function requireSameOriginRequest(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return null;
  }

  if (getAllowedOrigins(request).has(origin)) {
    return null;
  }

  return NextResponse.json(
    { error: "Cross-site write requests are not allowed." },
    { status: 403 },
  );
}

export function rejectOversizedRequest(request: NextRequest, maxBytes: number) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);

  if (!Number.isFinite(contentLength) || contentLength <= maxBytes) {
    return null;
  }

  return NextResponse.json(
    { error: "Request body is too large." },
    { status: 413 },
  );
}

export function enforceWriteRequestSafety(request: NextRequest, maxBytes: number) {
  return requireSameOriginRequest(request) ?? rejectOversizedRequest(request, maxBytes);
}
