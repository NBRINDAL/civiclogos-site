"use server";

import { revalidatePath } from "next/cache";
import { getRoomHref, getRoomTopicHref, type IssueRoomSlug } from "@/app/lib/civic-logos";
import { reviewContribution } from "@/app/lib/contribution-store";
import { sendContributionReviewedNotification } from "@/app/lib/maintainer-notifications";
import {
  normalizeReviewStatus,
  normalizeReviewTargetKind,
} from "@/app/lib/reasoning-types";

function isRoomSlug(value: string): value is IssueRoomSlug {
  return value === "healthcare" || value === "governance" || value === "housing" || value === "ai-labor" || value === "institutional-trust";
}

export async function updateContributionReview(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const roomSlugRaw = String(formData.get("roomSlug") ?? "").trim();
  const topicId = String(formData.get("topicId") ?? "").trim();
  const status = normalizeReviewStatus(String(formData.get("status") ?? ""));
  const assignedToKind = normalizeReviewTargetKind(
    String(formData.get("assignedToKind") ?? ""),
  );
  const assignedToLabel = String(formData.get("assignedToLabel") ?? "").trim();
  const publicRecordNote = String(formData.get("publicRecordNote") ?? "").trim();
  const decisionReason = String(formData.get("decisionReason") ?? "").trim();
  const reviewerNote = String(formData.get("reviewerNote") ?? "").trim();
  const changedSynthesisRaw = String(formData.get("changedSynthesis") ?? "").trim();

  if (!id || !status) {
    return;
  }

  const changedSynthesis =
    changedSynthesisRaw === "yes"
      ? true
      : changedSynthesisRaw === "no"
        ? false
        : null;

  const reviewedContribution = await reviewContribution(id, {
    status,
    assignedToKind: assignedToKind ?? undefined,
    assignedToLabel: assignedToLabel || undefined,
    changedSynthesis,
    publicRecordNote: publicRecordNote || undefined,
    decisionReason: decisionReason || undefined,
    reviewerNote: reviewerNote || undefined,
  });

  if (reviewedContribution) {
    void sendContributionReviewedNotification(reviewedContribution);
  }

  revalidatePath("/review/contributions");

  if (isRoomSlug(roomSlugRaw) && topicId) {
    revalidatePath(getRoomHref(roomSlugRaw));
    revalidatePath(getRoomTopicHref(roomSlugRaw, topicId));
  }
}
