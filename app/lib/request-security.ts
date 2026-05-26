import { NextRequest, NextResponse } from "next/server";

function normalizeLoopbackHostname(hostname: string) {
  const normalized = hostname.toLowerCase();

  if (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized === "[::1]"
  ) {
    return "loopback";
  }

  return normalized;
}

function getResolvedPort(url: URL) {
  if (url.port) {
    return url.port;
  }

  return url.protocol === "https:" ? "443" : "80";
}

function isEquivalentLoopbackOrigin(origin: string, request: NextRequest) {
  try {
    const originUrl = new URL(origin);
    const requestUrl = request.nextUrl;

    return (
      originUrl.protocol === requestUrl.protocol &&
      getResolvedPort(originUrl) === getResolvedPort(requestUrl) &&
      normalizeLoopbackHostname(originUrl.hostname) === "loopback" &&
      normalizeLoopbackHostname(requestUrl.hostname) === "loopback"
    );
  } catch {
    return false;
  }
}

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

  if (getAllowedOrigins(request).has(origin) || isEquivalentLoopbackOrigin(origin, request)) {
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
