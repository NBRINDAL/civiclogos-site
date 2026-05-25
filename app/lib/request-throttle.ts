import { NextRequest, NextResponse } from "next/server";

type RequestThrottleOptions = {
  bucket: string;
  limit: number;
  windowMs: number;
};

type RequestThrottleEntry = {
  count: number;
  resetAt: number;
};

const requestThrottleStore = new Map<string, RequestThrottleEntry>();
let lastCleanupAt = 0;

function getClientAddress(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim();

  return forwardedFor || realIp || cloudflareIp || "unknown-client";
}

function cleanupExpiredEntries(now: number) {
  if (now - lastCleanupAt < 60_000) {
    return;
  }

  lastCleanupAt = now;

  for (const [key, entry] of requestThrottleStore.entries()) {
    if (entry.resetAt <= now) {
      requestThrottleStore.delete(key);
    }
  }
}

export function throttleRequest(
  request: NextRequest,
  { bucket, limit, windowMs }: RequestThrottleOptions,
) {
  const now = Date.now();
  cleanupExpiredEntries(now);

  const clientAddress = getClientAddress(request);
  const throttleKey = `${bucket}:${clientAddress}`;
  const existing = requestThrottleStore.get(throttleKey);
  const entry =
    existing && existing.resetAt > now
      ? existing
      : {
          count: 0,
          resetAt: now + windowMs,
        };

  entry.count += 1;
  requestThrottleStore.set(throttleKey, entry);

  const retryAfterSeconds = Math.max(
    Math.ceil((entry.resetAt - now) / 1000),
    1,
  );
  const remaining = Math.max(limit - entry.count, 0);

  if (entry.count <= limit) {
    return null;
  }

  return NextResponse.json(
    {
      error: "Too many requests. Please wait a moment before trying again.",
    },
    {
      headers: {
        "RateLimit-Limit": String(limit),
        "RateLimit-Remaining": String(remaining),
        "RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
        "Retry-After": String(retryAfterSeconds),
      },
      status: 429,
    },
  );
}
