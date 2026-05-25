import type { EvidenceDocument } from "./contribution-types";

export const reviewEvidenceVisibilityOptions = [
  "review-only",
  "publicly-cited",
] as const;

export type ReviewEvidenceVisibility =
  (typeof reviewEvidenceVisibilityOptions)[number];

export type ReviewEvidenceRecord = {
  id: string;
  contributionId: string;
  document: EvidenceDocument;
  label: string;
  reviewerLabel: string;
  visibility: ReviewEvidenceVisibility;
  note?: string;
  createdAt: string;
};

export type CreateReviewEvidenceRecordInput = Omit<
  ReviewEvidenceRecord,
  "id"
>;

export type ReviewEvidenceStoreMetadata = {
  prototype: boolean;
  mode: "prototype" | "database" | "fallback";
  note: string;
  storePath?: string;
};

export type ReviewEvidenceStoreDocument = {
  prototype: true;
  note: string;
  updatedAt: string;
  records: ReviewEvidenceRecord[];
};

export function normalizeReviewEvidenceVisibility(value: unknown) {
  if (typeof value !== "string") {
    return "review-only";
  }

  return reviewEvidenceVisibilityOptions.find((item) => item === value) ?? "review-only";
}
