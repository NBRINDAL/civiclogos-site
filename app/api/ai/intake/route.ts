import { NextRequest, NextResponse } from "next/server";
import { getRoomHref } from "@/app/lib/civic-logos";
import { enforceWriteRequestSafety } from "@/app/lib/request-security";
import { throttleRequest } from "@/app/lib/request-throttle";
import {
  getHomeIntakeCookieName,
  serializeHomeIntakeCookie,
} from "@/app/lib/home-intake-cookie";
import { shouldUseSecureCookies } from "@/app/lib/cookie-security";
import { createHomeIntakeEntry, getHomeIntakeStoreMetadata } from "@/app/lib/home-intake-store";

export const runtime = "nodejs";

type IntakePayload = {
  prompt?: unknown;
  website?: unknown;
};

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  const unsafeRequest = enforceWriteRequestSafety(request, 16 * 1024);

  if (unsafeRequest) {
    return unsafeRequest;
  }

  const throttled = throttleRequest(request, {
    bucket: "home-intake-ai",
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });

  if (throttled) {
    return throttled;
  }

  let payload: IntakePayload;

  try {
    payload = (await request.json()) as IntakePayload;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const prompt = asTrimmedString(payload.prompt);
  const website = asTrimmedString(payload.website);

  if (website) {
    return NextResponse.json({ message: "Thanks." }, { status: 200 });
  }

  if (!prompt) {
    return NextResponse.json(
      { error: "Enter a question or idea first." },
      { status: 400 },
    );
  }

  if (prompt.length > 3000) {
    return NextResponse.json(
      { error: "Keep the intake prompt under 3000 characters for now." },
      { status: 400 },
    );
  }

  const [entry, metadata] = await Promise.all([
    createHomeIntakeEntry(prompt),
    getHomeIntakeStoreMetadata(),
  ]);

  if (!entry.routing.routeKind) {
    return NextResponse.json(
      {
        error:
          entry.routing.state === "unavailable"
            ? "The intake engine is not configured yet on this deployment."
            : "The intake engine could not route this idea right now.",
      },
      { status: entry.routing.state === "unavailable" ? 503 : 502 },
    );
  }

  const roomHref = entry.routing.roomSlug
    ? getRoomHref(entry.routing.roomSlug)
    : undefined;
  const destinationHref =
    entry.routing.routeKind === "existing-room" && roomHref
      ? `${roomHref}?intake=${entry.id}`
      : `/intake/${entry.id}`;

  const response = NextResponse.json({
    prototype: metadata.prototype,
    note: metadata.note,
    entryId: entry.id,
    destinationKind: entry.routing.routeKind,
    destinationHref,
    roomTitle: entry.routing.roomTitle,
    topicTitle: entry.routing.topicTitle || entry.routing.suggestedTopicTitle,
    fitSummary: entry.routing.fitSummary,
    routeConfidence: entry.routing.routeConfidence,
  });

  response.cookies.set(getHomeIntakeCookieName(), serializeHomeIntakeCookie(entry), {
    httpOnly: true,
    maxAge: 60 * 20,
    path: "/",
    sameSite: "lax",
    secure: shouldUseSecureCookies({
      protocol: request.nextUrl.protocol,
      host: request.nextUrl.host,
    }),
  });

  return response;
}
