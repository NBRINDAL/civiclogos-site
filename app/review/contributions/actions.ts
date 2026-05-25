"use server";

import { revalidatePath } from "next/cache";
import {
  getRoomHref,
  getRoomTopicCard,
  getRoomTopicHref,
  issueRooms,
  type IssueRoomSlug,
} from "@/app/lib/civic-logos";
import {
  createContribution,
  getContributionById,
  listPublicContributions,
  refreshContributionAiIntake,
  reviewContribution,
  updateContributionEvidenceDocument,
  updateContributionEvidenceExcerpt as persistContributionEvidenceExcerpt,
} from "@/app/lib/contribution-store";
import {
  createEvidenceDocument,
  refreshEvidenceDocumentExtraction,
} from "@/app/lib/evidence-document-store";
import { getContributionOrigin } from "@/app/lib/contribution-origin";
import {
  toPublicContributionRecord,
  type ContributionReview,
  type ReviewContributionInput,
} from "@/app/lib/contribution-types";
import {
  createReviewEvidenceRecord,
  getReviewEvidenceRecord,
  updateReviewEvidenceDocument,
} from "@/app/lib/review-evidence-store";
import { normalizeReviewEvidenceVisibility } from "@/app/lib/review-evidence-types";
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
  return value in issueRooms;
}

function asUploadFile(value: FormDataEntryValue | null) {
  if (!value || typeof value === "string" || !value.size) {
    return null;
  }

  return value;
}

function normalizeReviewForComparison(
  review: ContributionReview | ReviewContributionInput | undefined,
) {
  return {
    reviewerLabel: review?.reviewerLabel || undefined,
    reviewerDisclosureNote: review?.reviewerDisclosureNote || undefined,
    reviewerConflictNote: review?.reviewerConflictNote || undefined,
    assignedToKind: review?.assignedToKind || undefined,
    assignedToLabel: review?.assignedToLabel || undefined,
    changedSynthesis: review?.changedSynthesis ?? null,
    publicRecordNote: review?.publicRecordNote || undefined,
    decisionReason: review?.decisionReason || undefined,
    reviewerNote: review?.reviewerNote || undefined,
    revisionSummary: review?.revisionSummary || undefined,
    synthesisUpdate: review?.synthesisUpdate || undefined,
    publicRecordSnapshot: review?.publicRecordSnapshot,
  };
}

export async function updateContributionReview(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const roomSlugRaw = String(formData.get("roomSlug") ?? "").trim();
  const topicId = String(formData.get("topicId") ?? "").trim();
  const status = normalizeReviewStatus(String(formData.get("status") ?? ""));
  const reviewerLabel = String(formData.get("reviewerLabel") ?? "").trim();
  const reviewerDisclosureNote = String(
    formData.get("reviewerDisclosureNote") ?? "",
  ).trim();
  const reviewerConflictNote = String(
    formData.get("reviewerConflictNote") ?? "",
  ).trim();
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
  const resolvedReviewerLabel = reviewerLabel || "Civic Logos maintainer review";
  const resolvedReviewerDisclosureNote =
    reviewerDisclosureNote ||
    "Maintainer review for the current Civic Logos prototype; external reviewer governance is not yet formalized.";
  const resolvedReviewerConflictNote =
    reviewerConflictNote || "No additional conflict disclosed in this review record.";

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
            reviewerLabel: resolvedReviewerLabel,
            reviewerDisclosureNote: resolvedReviewerDisclosureNote,
            reviewerConflictNote: resolvedReviewerConflictNote,
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

  const nextReviewInput: ReviewContributionInput = {
    status: guardedStatus,
    reviewerLabel: resolvedReviewerLabel,
    reviewerDisclosureNote: resolvedReviewerDisclosureNote,
    reviewerConflictNote: resolvedReviewerConflictNote,
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
  };

  const isDuplicateReviewSave =
    existingContribution?.status === nextReviewInput.status &&
    JSON.stringify(normalizeReviewForComparison(existingContribution.review)) ===
      JSON.stringify(normalizeReviewForComparison(nextReviewInput));

  if (isDuplicateReviewSave) {
    revalidatePath("/review/contributions");

    if (isRoomSlug(roomSlugRaw) && topicId) {
      revalidatePath(getRoomHref(roomSlugRaw));
      revalidatePath(getRoomTopicHref(roomSlugRaw, topicId));
    }

    return;
  }

  const reviewedContribution = await reviewContribution(id, nextReviewInput);

  if (reviewedContribution) {
    void sendContributionReviewedNotification(reviewedContribution);
  }

  revalidatePath("/review/contributions");

  if (isRoomSlug(roomSlugRaw) && topicId) {
    revalidatePath(getRoomHref(roomSlugRaw));
    revalidatePath(getRoomTopicHref(roomSlugRaw, topicId));
  }
}

export async function uploadReviewerEvidence(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const roomSlugRaw = String(formData.get("roomSlug") ?? "").trim();
  const topicId = String(formData.get("topicId") ?? "").trim();
  const label = String(formData.get("reviewEvidenceLabel") ?? "")
    .trim()
    .slice(0, 180);
  const reviewerLabel = String(formData.get("reviewEvidenceReviewer") ?? "")
    .trim()
    .slice(0, 120);
  const note = String(formData.get("reviewEvidenceNote") ?? "")
    .trim()
    .slice(0, 900);
  const visibility = normalizeReviewEvidenceVisibility(
    formData.get("reviewEvidenceVisibility"),
  );
  const upload = asUploadFile(formData.get("reviewEvidenceFile"));

  if (!id || !upload || !isRoomSlug(roomSlugRaw) || !topicId) {
    return;
  }

  if (upload.size > 8 * 1024 * 1024) {
    return;
  }

  const contribution = await getContributionById(id);
  const topicCard = getRoomTopicCard(roomSlugRaw, topicId);

  if (
    !contribution ||
    !topicCard ||
    contribution.roomSlug !== roomSlugRaw ||
    contribution.topicId !== topicId
  ) {
    return;
  }

  const evidenceDocument = await createEvidenceDocument({
    roomSlug: roomSlugRaw,
    topicId,
    topicTitle: topicCard.title,
    fileName: upload.name || "reviewer-evidence",
    mimeType: upload.type || "application/octet-stream",
    bytes: Buffer.from(await upload.arrayBuffer()),
  });

  await createReviewEvidenceRecord({
    contributionId: id,
    document: evidenceDocument,
    label: label || evidenceDocument.fileName,
    reviewerLabel: reviewerLabel || "Civic Logos maintainer review",
    visibility,
    note: note || undefined,
    createdAt: new Date().toISOString(),
  });

  revalidatePath("/review/contributions");
  revalidatePath(getRoomHref(roomSlugRaw));
  revalidatePath(getRoomTopicHref(roomSlugRaw, topicId));
}

export async function reprocessReviewerEvidenceDocument(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const recordId = String(formData.get("reviewEvidenceRecordId") ?? "").trim();
  const roomSlugRaw = String(formData.get("roomSlug") ?? "").trim();
  const topicId = String(formData.get("topicId") ?? "").trim();

  if (!id || !recordId) {
    return;
  }

  const record = await getReviewEvidenceRecord(recordId);

  if (!record || record.contributionId !== id) {
    return;
  }

  const refreshedDocument = await refreshEvidenceDocumentExtraction(record.document.id);

  if (refreshedDocument) {
    await updateReviewEvidenceDocument(record.id, refreshedDocument);
  }

  revalidatePath("/review/contributions");

  if (isRoomSlug(roomSlugRaw) && topicId) {
    revalidatePath(getRoomHref(roomSlugRaw));
    revalidatePath(getRoomTopicHref(roomSlugRaw, topicId));
  }
}

export async function retryContributionAiIntake(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const roomSlugRaw = String(formData.get("roomSlug") ?? "").trim();
  const topicId = String(formData.get("topicId") ?? "").trim();

  if (!id) {
    return;
  }

  await refreshContributionAiIntake(id);
  revalidatePath("/review/contributions");

  if (isRoomSlug(roomSlugRaw) && topicId) {
    revalidatePath(getRoomHref(roomSlugRaw));
    revalidatePath(getRoomTopicHref(roomSlugRaw, topicId));
  }
}

export async function reprocessContributionEvidenceDocument(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const roomSlugRaw = String(formData.get("roomSlug") ?? "").trim();
  const topicId = String(formData.get("topicId") ?? "").trim();

  if (!id) {
    return;
  }

  const contribution = await getContributionById(id);
  const evidenceDocumentId = contribution?.evidenceDocument?.id;

  if (!contribution || !evidenceDocumentId) {
    return;
  }

  const refreshedDocument = await refreshEvidenceDocumentExtraction(evidenceDocumentId);

  if (refreshedDocument) {
    await updateContributionEvidenceDocument(id, refreshedDocument);
    await refreshContributionAiIntake(id);
  }

  revalidatePath("/review/contributions");

  if (isRoomSlug(roomSlugRaw) && topicId) {
    revalidatePath(getRoomHref(roomSlugRaw));
    revalidatePath(getRoomTopicHref(roomSlugRaw, topicId));
  }
}

export async function updateContributionEvidenceExcerpt(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const roomSlugRaw = String(formData.get("roomSlug") ?? "").trim();
  const topicId = String(formData.get("topicId") ?? "").trim();
  const evidenceExcerpt = String(formData.get("evidenceExcerpt") ?? "")
    .trim()
    .slice(0, 8000);

  if (!id) {
    return;
  }

  await persistContributionEvidenceExcerpt(id, evidenceExcerpt);
  await refreshContributionAiIntake(id);
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
