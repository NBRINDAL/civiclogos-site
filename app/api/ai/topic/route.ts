import { NextRequest, NextResponse } from "next/server";
import { issueRooms, type IssueRoomSlug } from "@/app/lib/civic-logos";
import { askTopicCard } from "@/app/lib/topic-ai";

export const runtime = "nodejs";

type TopicAiPayload = {
  roomSlug?: unknown;
  topicId?: unknown;
  question?: unknown;
  provider?: unknown;
};

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isRoomSlug(value: string): value is IssueRoomSlug {
  return value in issueRooms;
}

function isProvider(value: string): value is "openai" | "anthropic" | "all" {
  return value === "openai" || value === "anthropic" || value === "all";
}

export async function POST(request: NextRequest) {
  let payload: TopicAiPayload;

  try {
    payload = (await request.json()) as TopicAiPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const roomSlug = asTrimmedString(payload.roomSlug);
  const topicId = asTrimmedString(payload.topicId);
  const question = asTrimmedString(payload.question);
  const provider = asTrimmedString(payload.provider) || "all";

  if (!roomSlug || !isRoomSlug(roomSlug)) {
    return NextResponse.json({ error: "Pick a valid room." }, { status: 400 });
  }

  if (!topicId) {
    return NextResponse.json({ error: "Pick a valid topic card." }, { status: 400 });
  }

  if (!question || question.length < 8) {
    return NextResponse.json(
      { error: "Ask a fuller question so the topic readers have something real to respond to." },
      { status: 400 },
    );
  }

  if (question.length > 2500) {
    return NextResponse.json(
      { error: "Keep the question under 2,500 characters for this first reader pass." },
      { status: 400 },
    );
  }

  if (!isProvider(provider)) {
    return NextResponse.json({ error: "Choose a valid provider." }, { status: 400 });
  }

  const result = await askTopicCard({
    roomSlug,
    topicId,
    question,
    provider,
  });

  if (!result) {
    return NextResponse.json({ error: "Unknown topic card." }, { status: 404 });
  }

  if (result.state === "unavailable") {
    return NextResponse.json(
      {
        error:
          "The assisted readers are not configured for this deployment yet.",
        ...result,
      },
      { status: 503 },
    );
  }

  if (!result.answers.length) {
    return NextResponse.json(
      {
        error:
          "The assisted readers could not answer from this topic card right now.",
        ...result,
      },
      { status: 502 },
    );
  }

  return NextResponse.json(result);
}
