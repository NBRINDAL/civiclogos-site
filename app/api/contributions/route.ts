import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import {
  getRoomHref,
  getRoomTopicCard,
  getRoomTopicHref,
  issueRooms,
  type IssueRoomSlug,
} from "@/app/lib/civic-logos";
import type { AssistedDraftSource } from "@/app/lib/contribution-types";
import { topicCardVisibleContributionLimit } from "@/app/lib/contribution-constants";
import { createContribution, getContributionStoreMetadata, listPublicContributions } from "@/app/lib/contribution-store";
import { createEvidenceDocument } from "@/app/lib/evidence-document-store";
import { sendContributionSubmittedNotification } from "@/app/lib/maintainer-notifications";
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
  draftSource?: unknown;
  website?: unknown;
};

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asFile(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value instanceof File ? value : null;
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

function parseDraftSource(value: unknown): AssistedDraftSource | undefined {
  if (typeof value === "string") {
    try {
      return parseDraftSource(JSON.parse(value));
    } catch {
      return undefined;
    }
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const source = value as Record<string, unknown>;

  if (
    typeof source.provider !== "string" ||
    typeof source.providerLabel !== "string" ||
    typeof source.model !== "string" ||
    typeof source.question !== "string" ||
    typeof source.generatedAt !== "string"
  ) {
    return undefined;
  }

  return {
    provider:
      source.provider === "openai" || source.provider === "anthropic"
        ? source.provider
        : "openai",
    providerLabel: source.providerLabel.trim(),
    model: source.model.trim(),
    question: source.question.trim(),
    generatedAt: source.generatedAt.trim(),
  };
}

function revalidateTopicSurfaces(roomSlug: IssueRoomSlug, topicId: string) {
  revalidatePath(getRoomHref(roomSlug));
  revalidatePath(getRoomTopicHref(roomSlug, topicId));
  revalidatePath("/review/contributions");
}

export async function GET(request: NextRequest) {
  const roomSlug = request.nextUrl.searchParams.get("roomSlug")?.trim();
  const topicId = request.nextUrl.searchParams.get("topicId")?.trim();
  const limitValue = Number(
    request.nextUrl.searchParams.get("limit") ?? String(topicCardVisibleContributionLimit),
  );
  const limit = Number.isFinite(limitValue)
    ? Math.min(Math.max(limitValue, 1), 20)
    : topicCardVisibleContributionLimit;

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
    mode: metadata.mode,
    note: metadata.note,
    contributions,
  });
}

export async function POST(request: NextRequest) {
  let payload: ContributionPayload;
  let uploadedEvidenceFile: File | null = null;

  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      uploadedEvidenceFile = asFile(formData.get("evidenceFile"));
      payload = {
        roomSlug: formData.get("roomSlug"),
        topicId: formData.get("topicId"),
        lane: formData.get("lane"),
        title: formData.get("title"),
        body: formData.get("body"),
        evidenceLabel: formData.get("evidenceLabel"),
        evidenceUrl: formData.get("evidenceUrl"),
        name: formData.get("name"),
        email: formData.get("email"),
        expertise: formData.get("expertise"),
        draftSource: formData.get("draftSource"),
        website: formData.get("website"),
      };
    } else {
      payload = (await request.json()) as ContributionPayload;
    }
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
  const draftSource = parseDraftSource(payload.draftSource);
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

  if (uploadedEvidenceFile) {
    if (!uploadedEvidenceFile.size) {
      return NextResponse.json(
        { error: "The selected evidence document was empty." },
        { status: 400 },
      );
    }

    if (uploadedEvidenceFile.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Keep uploaded evidence documents under 8 MB for this MVP." },
        { status: 400 },
      );
    }
  }

  const evidenceDocument =
    uploadedEvidenceFile && uploadedEvidenceFile.size
      ? await createEvidenceDocument({
          roomSlug,
          topicId,
          topicTitle: topic.title,
          fileName: uploadedEvidenceFile.name || "uploaded-evidence",
          mimeType:
            uploadedEvidenceFile.type || "application/octet-stream",
          bytes: Buffer.from(await uploadedEvidenceFile.arrayBuffer()),
        })
      : null;

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
    evidenceDocument,
    author: {
      name: name || undefined,
      email: email || undefined,
      expertise: expertise || undefined,
    },
    draftSource,
  });

  void sendContributionSubmittedNotification({
    ...contribution,
    author: {
      name: name || undefined,
      email: email || undefined,
      expertise: expertise || undefined,
    },
  });

  revalidateTopicSurfaces(roomSlug, topicId);

  return NextResponse.json({
    message:
      "Your contribution has been submitted for review. Civic Logos preserves strong objections, evidence, corrections, and nuance as part of the living public record.",
    contribution,
  });
}
