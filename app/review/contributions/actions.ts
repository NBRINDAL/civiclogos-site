"use server";

import { revalidatePath } from "next/cache";
import { reviewContribution } from "@/app/lib/contribution-store";
import {
  normalizeReviewStatus,
  normalizeReviewTargetKind,
} from "@/app/lib/reasoning-types";

export async function updateContributionReview(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const status = normalizeReviewStatus(String(formData.get("status") ?? ""));
  const assignedToKind = normalizeReviewTargetKind(
    String(formData.get("assignedToKind") ?? ""),
  );
  const assignedToLabel = String(formData.get("assignedToLabel") ?? "").trim();
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

  await reviewContribution(id, {
    status,
    assignedToKind: assignedToKind ?? undefined,
    assignedToLabel: assignedToLabel || undefined,
    changedSynthesis,
    decisionReason: decisionReason || undefined,
    reviewerNote: reviewerNote || undefined,
  });

  revalidatePath("/review/contributions");
}
