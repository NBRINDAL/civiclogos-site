import { NextRequest, NextResponse } from "next/server";
import { getRoomTopicCard, issueRooms, type IssueRoomSlug } from "@/app/lib/civic-logos";
import { createContribution, getContributionStoreMetadata, listPublicContributions } from "@/app/lib/contribution-store";
import { normalizeDebateLane } from "@/app/lib/reasoning-types";

export const runtime = "nodejs";

type ContributionPayload = {
  roomSlug?: unknown;
  topicId?: unknown;
  lane?: unknown;
  title?: unknown;
  body?: unknown;
  evidenceLabel?: unknown;
  evidenceUrl?: unknown;
  name?: unknown;
  email?: unknown;
  expertise?: unknown;
  website?: unknown;
};

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidHttpUrl(value: string) {
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isRoomSlug(value: string): value is IssueRoomSlug {
  return value in issueRooms;
}

export async function GET(request: NextRequest) {
  const roomSlug = request.nextUrl.searchParams.get("roomSlug")?.trim();
  const topicId = request.nextUrl.searchParams.get("topicId")?.trim();
  const limitValue = Number(request.nextUrl.searchParams.get("limit") ?? "8");
  const limit = Number.isFinite(limitValue)
    ? Math.min(Math.max(limitValue, 1), 20)
    : 8;

  if (roomSlug && !isRoomSlug(roomSlug)) {
    return NextResponse.json({ error: "Unknown room." }, { status: 400 });
  }

  const typedRoomSlug = roomSlug as IssueRoomSlug | undefined;

  if (typedRoomSlug && topicId && !getRoomTopicCard(typedRoomSlug, topicId)) {
    return NextResponse.json({ error: "Unknown topic card." }, { status: 404 });
  }

  const [contributions, metadata] = await Promise.all([
    listPublicContributions({
      roomSlug: typedRoomSlug,
      topicId: topicId || undefined,
      limit,
    }),
    getContributionStoreMetadata(),
  ]);

  return NextResponse.json({
    prototype: metadata.prototype,
    note: metadata.note,
    contributions,
  });
}

export async function POST(request: NextRequest) {
  let payload: ContributionPayload;

  try {
    payload = (await request.json()) as ContributionPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const roomSlug = asTrimmedString(payload.roomSlug);
  const topicId = asTrimmedString(payload.topicId);
  const lane = normalizeDebateLane(asTrimmedString(payload.lane));
  const title = asTrimmedString(payload.title);
  const body = asTrimmedString(payload.body);
  const evidenceLabel = asTrimmedString(payload.evidenceLabel);
  const evidenceUrl = asTrimmedString(payload.evidenceUrl);
  const name = asTrimmedString(payload.name);
  const email = asTrimmedString(payload.email);
  const expertise = asTrimmedString(payload.expertise);
  const website = asTrimmedString(payload.website);

  if (website) {
    return NextResponse.json({ message: "Thanks." }, { status: 200 });
  }

  if (!roomSlug || !isRoomSlug(roomSlug)) {
    return NextResponse.json({ error: "Pick a valid room." }, { status: 400 });
  }

  const topic = getRoomTopicCard(roomSlug, topicId);
  if (!topic) {
    return NextResponse.json({ error: "Pick a valid topic card." }, { status: 400 });
  }

  if (!lane) {
    return NextResponse.json({ error: "Choose a debate lane." }, { status: 400 });
  }

  if (!title || !body) {
    return NextResponse.json(
      { error: "Title and contribution body are required." },
      { status: 400 },
    );
  }

  if (title.length > 180 || body.length > 5000 || evidenceLabel.length > 180) {
    return NextResponse.json(
      { error: "One or more fields are too long." },
      { status: 400 },
    );
  }

  if (name.length > 120 || expertise.length > 180 || email.length > 240) {
    return NextResponse.json(
      { error: "Contributor information is too long." },
      { status: 400 },
    );
  }

  if (email && !isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (evidenceUrl && !isValidHttpUrl(evidenceUrl)) {
    return NextResponse.json(
      { error: "Enter a valid evidence or source URL." },
      { status: 400 },
    );
  }

  const contribution = await createContribution({
    roomSlug,
    topicId,
    topicTitle: topic.title,
    lane,
    title,
    body,
    evidenceSource: evidenceUrl
      ? {
          label: evidenceLabel || undefined,
          url: evidenceUrl,
        }
      : null,
    author: {
      name: name || undefined,
      email: email || undefined,
      expertise: expertise || undefined,
    },
  });

  return NextResponse.json({
    message:
      "Your contribution has been submitted for review. Civic Logos preserves strong objections, evidence, corrections, and nuance as part of the living public record.",
    contribution,
  });
}
