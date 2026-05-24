"use server";

import { revalidatePath } from "next/cache";
import {
  getRoomHref,
  getRoomTopicCard,
  getRoomTopicHref,
  type IssueRoomSlug,
} from "@/app/lib/civic-logos";
import {
  createContribution,
  getContributionById,
  listPublicContributions,
  reviewContribution,
} from "@/app/lib/contribution-store";
import { getContributionOrigin } from "@/app/lib/contribution-origin";
import { toPublicContributionRecord } from "@/app/lib/contribution-types";
import {
  sendContributionReviewedNotification,
  sendContributionSubmittedNotification,
} from "@/app/lib/maintainer-notifications";
import {
  buildPublicRecordSnapshot,
  getCurrentVisibleSynthesis,
  getNextPublicRecordVersionLabel,
  publicRecordConfirmationPhrase,
} from "@/app/lib/public-record-revisions";
import {
  normalizeDebateLane,
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
  const revisionSummary = String(formData.get("revisionSummary") ?? "").trim();
  const synthesisUpdate = String(formData.get("synthesisUpdate") ?? "").trim();
  const publicRecordConfirmation = String(
    formData.get("publicRecordConfirmation") ?? "",
  ).trim();
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

  const existingContribution = await getContributionById(id);
  const existingPublicContribution = existingContribution
    ? toPublicContributionRecord(existingContribution)
    : null;
  const isMaintainerRevision =
    existingPublicContribution &&
    getContributionOrigin(existingPublicContribution) === "founder-maintainer";
  const hasCompletedAiValidation =
    existingContribution?.aiIntake?.providers.some(
      (provider) => provider.state === "completed",
    ) ?? false;
  const guardMessages: string[] = [];

  if (status === "incorporated" && changedSynthesis === null) {
    guardMessages.push(
      "Civic Logos blocked incorporation because incorporated records must explicitly mark actual card change as yes or no.",
    );
  }

  if (status === "incorporated" && changedSynthesis === true) {
    if (!publicRecordNote) {
      guardMessages.push(
        "Civic Logos blocked incorporation because actual card changes require a public record note.",
      );
    }

    if (!revisionSummary) {
      guardMessages.push(
        "Civic Logos blocked incorporation because actual card changes require a revision summary.",
      );
    }
  }

  if (
    status === "incorporated" &&
    changedSynthesis === false &&
    !publicRecordNote &&
    !decisionReason &&
    !reviewerNote
  ) {
    guardMessages.push(
      "Civic Logos blocked incorporation because incorporated no-change decisions require an explanation.",
    );
  }

  if (isMaintainerRevision && status === "incorporated" && changedSynthesis === true) {
    if (!hasCompletedAiValidation) {
      guardMessages.push(
        "Civic Logos blocked incorporation because this founder-maintainer revision does not yet have a completed AI-assisted validation read. The proposal remains visible for review but has not moved the synthesis.",
      );
    }

    if (!synthesisUpdate) {
      guardMessages.push(
        "Civic Logos blocked incorporation because founder-maintainer synthesis revisions require a proposed visible synthesis update.",
      );
    }

    if (publicRecordConfirmation !== publicRecordConfirmationPhrase) {
      guardMessages.push(
        `Civic Logos blocked incorporation because the maintainer confirmation phrase was not entered exactly: "${publicRecordConfirmationPhrase}"`,
      );
    }
  }

  const isBlocked = guardMessages.length > 0;
  const guardedStatus = isBlocked ? "needs review" : status;
  const guardedChangedSynthesis = isBlocked ? null : changedSynthesis;
  const guardedReviewerNote = [...(reviewerNote ? [reviewerNote] : []), ...guardMessages]
    .filter(Boolean)
    .join("\n\n");
  const topicCard =
    existingPublicContribution && isRoomSlug(existingPublicContribution.roomSlug)
      ? getRoomTopicCard(
          existingPublicContribution.roomSlug,
          existingPublicContribution.topicId,
        )
      : null;
  const shouldCreatePublicRecordSnapshot =
    existingPublicContribution &&
    topicCard &&
    !existingPublicContribution.review?.publicRecordSnapshot &&
    guardedStatus === "incorporated" &&
    guardedChangedSynthesis === true;
  const existingTopicContributions =
    shouldCreatePublicRecordSnapshot && existingPublicContribution
      ? await listPublicContributions({
          roomSlug: existingPublicContribution.roomSlug,
          topicId: existingPublicContribution.topicId,
          limit: 50,
        })
      : [];
  const publicRecordSnapshot =
    existingPublicContribution?.review?.publicRecordSnapshot ??
    (shouldCreatePublicRecordSnapshot && existingPublicContribution && topicCard
      ? buildPublicRecordSnapshot({
          contribution: existingPublicContribution,
          input: {
            status: guardedStatus,
            assignedToKind: assignedToKind ?? undefined,
            assignedToLabel: assignedToLabel || undefined,
            changedSynthesis: guardedChangedSynthesis,
            publicRecordNote: publicRecordNote || undefined,
            decisionReason: decisionReason || undefined,
            reviewerNote: guardedReviewerNote || undefined,
            revisionSummary: revisionSummary || undefined,
            synthesisUpdate: synthesisUpdate || undefined,
          },
          previousSynthesis: getCurrentVisibleSynthesis({
            baseSynthesis: topicCard.thesis,
            contributions: existingTopicContributions,
            excludeRecordId: existingPublicContribution.id,
          }),
          timestamp: new Date().toISOString(),
          versionLabel: getNextPublicRecordVersionLabel({
            card: topicCard,
            contributions: existingTopicContributions,
          }),
        })
      : undefined);

  const reviewedContribution = await reviewContribution(id, {
    status: guardedStatus,
    assignedToKind: assignedToKind ?? undefined,
    assignedToLabel: assignedToLabel || undefined,
    changedSynthesis: guardedChangedSynthesis,
    publicRecordNote: publicRecordNote || undefined,
    decisionReason: decisionReason || undefined,
    reviewerNote: guardedReviewerNote || undefined,
    revisionSummary: revisionSummary || undefined,
    synthesisUpdate:
      guardedChangedSynthesis === true && guardedStatus === "incorporated"
        ? synthesisUpdate || undefined
        : undefined,
    publicRecordSnapshot,
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

export async function createFounderMaintainerRevision(formData: FormData) {
  const roomSlugRaw = String(formData.get("roomSlug") ?? "").trim();
  const topicId = String(formData.get("topicId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const proposedSynthesis = String(formData.get("proposedSynthesis") ?? "").trim();
  const revisionSummary = String(formData.get("revisionSummary") ?? "").trim();
  const reviewerNote = String(formData.get("reviewerNote") ?? "").trim();
  const lane = normalizeDebateLane(String(formData.get("lane") ?? "")) ?? "correction";

  if (!isRoomSlug(roomSlugRaw) || !topicId || !title || !proposedSynthesis) {
    return;
  }

  const topicCard = getRoomTopicCard(roomSlugRaw, topicId);

  if (!topicCard) {
    return;
  }

  const body = [
    "Founder-maintainer proposed synthesis revision. This is not an outside public submission and does not change the card until AI-assisted sorting and human review incorporate it.",
    "",
    "Proposed visible synthesis:",
    proposedSynthesis,
    "",
    revisionSummary ? `Revision summary: ${revisionSummary}` : "",
    reviewerNote ? `Maintainer validation request: ${reviewerNote}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const contribution = await createContribution({
    roomSlug: roomSlugRaw,
    topicId,
    topicTitle: topicCard.title,
    lane,
    title,
    body,
    author: {
      name: "Civic Logos founder-maintainer",
      expertise: "Founder-maintainer synthesis proposal requiring AI-assisted sorting and human incorporation.",
    },
  });

  void sendContributionSubmittedNotification({
    ...contribution,
    author: {
      name: "Civic Logos founder-maintainer",
      expertise: "Founder-maintainer synthesis proposal requiring AI-assisted sorting and human incorporation.",
    },
  });

  revalidatePath("/review/contributions");
  revalidatePath(getRoomHref(roomSlugRaw));
  revalidatePath(getRoomTopicHref(roomSlugRaw, topicId));
}
