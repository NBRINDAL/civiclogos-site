import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { reviewHomeIntakeEntry } from "@/app/lib/home-intake-store";
import type {
  HomeIntakePromotionReview,
  HomeIntakePromotionStatus,
} from "@/app/lib/home-intake-types";
import { enforceWriteRequestSafety } from "@/app/lib/request-security";
import { throttleRequest } from "@/app/lib/request-throttle";

export const runtime = "nodejs";

const promotionStatuses = new Set<HomeIntakePromotionStatus>([
  "held",
  "ready_for_live_room",
  "ready_for_live_topic",
  "merged_into_existing_room",
  "rejected",
  "promoted",
]);

type PromotionReviewPayload = {
  status?: unknown;
  maintainerKey?: unknown;
  reviewerLabel?: unknown;
  reviewerNote?: unknown;
  neutralBaselineTitle?: unknown;
  neutralBaselineQuestion?: unknown;
  neutralBaselineSynthesis?: unknown;
  guardrailNote?: unknown;
};

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asPromotionStatus(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  return promotionStatuses.has(value as HomeIntakePromotionStatus)
    ? (value as HomeIntakePromotionStatus)
    : null;
}

function needsNeutralBaseline(status: HomeIntakePromotionStatus) {
  return status === "ready_for_live_room" || status === "ready_for_live_topic";
}

function getConfiguredMaintainerKey() {
  return (
    process.env.CIVIC_LOGOS_MAINTAINER_KEY?.trim() ||
    process.env.MAINTAINER_REVIEW_KEY?.trim() ||
    ""
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> },
) {
  const unsafeRequest = enforceWriteRequestSafety(request, 32 * 1024);

  if (unsafeRequest) {
    return unsafeRequest;
  }

  const throttled = throttleRequest(request, {
    bucket: "intake-promotion-review",
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });

  if (throttled) {
    return throttled;
  }

  const { entryId } = await params;
  let payload: PromotionReviewPayload;
  const configuredMaintainerKey = getConfiguredMaintainerKey();

  try {
    payload = (await request.json()) as PromotionReviewPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const status = asPromotionStatus(payload.status);
  const maintainerKey = asTrimmedString(payload.maintainerKey);
  const reviewerLabel = asTrimmedString(payload.reviewerLabel);
  const reviewerNote = asTrimmedString(payload.reviewerNote);
  const neutralBaselineTitle = asTrimmedString(payload.neutralBaselineTitle);
  const neutralBaselineQuestion = asTrimmedString(payload.neutralBaselineQuestion);
  const neutralBaselineSynthesis = asTrimmedString(payload.neutralBaselineSynthesis);
  const guardrailNote = asTrimmedString(payload.guardrailNote);

  if (!configuredMaintainerKey) {
    return NextResponse.json(
      {
        error:
          "Maintainer promotion review is not configured on this deployment.",
      },
      { status: 503 },
    );
  }

  if (maintainerKey !== configuredMaintainerKey) {
    return NextResponse.json(
      { error: "Maintainer key is required to save promotion review." },
      { status: 401 },
    );
  }

  if (!status) {
    return NextResponse.json(
      { error: "Choose a valid promotion review status." },
      { status: 400 },
    );
  }

  if (!reviewerLabel) {
    return NextResponse.json(
      { error: "Add a reviewer label before saving the promotion review." },
      { status: 400 },
    );
  }

  if (!reviewerNote) {
    return NextResponse.json(
      { error: "Add a reviewer note explaining the promotion decision." },
      { status: 400 },
    );
  }

  if (
    needsNeutralBaseline(status) &&
    (!neutralBaselineTitle ||
      !neutralBaselineQuestion ||
      !neutralBaselineSynthesis ||
      !guardrailNote)
  ) {
    return NextResponse.json(
      {
        error:
          "A candidate marked ready for a live room or topic needs a neutral title, question, synthesis, and guardrail note.",
      },
      { status: 400 },
    );
  }

  const promotionReview: HomeIntakePromotionReview = {
    status,
    reviewerLabel,
    reviewerNote,
    neutralBaselineTitle: neutralBaselineTitle || undefined,
    neutralBaselineQuestion: neutralBaselineQuestion || undefined,
    neutralBaselineSynthesis: neutralBaselineSynthesis || undefined,
    guardrailNote: guardrailNote || undefined,
    decidedAt: new Date().toISOString(),
  };

  const updatedEntry = await reviewHomeIntakeEntry(entryId, promotionReview);

  if (!updatedEntry) {
    return NextResponse.json(
      { error: "Intake artifact not found." },
      { status: 404 },
    );
  }

  revalidatePath(`/intake/${entryId}`);
  revalidatePath("/rooms");

  if (updatedEntry.routing.roomSlug) {
    revalidatePath(`/rooms/${updatedEntry.routing.roomSlug}`);
  }

  return NextResponse.json({
    entry: updatedEntry,
    message: "Promotion review saved.",
  });
}
