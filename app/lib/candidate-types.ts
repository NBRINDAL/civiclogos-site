import type { DebateLane, ReviewTargetKind } from "./reasoning-types";

export type CandidateOrigin = "human_submitted_via_ai_intake";

export type CandidateReviewStatus =
  | "pending_human_review"
  | "promoted_to_public_contribution"
  | "rejected"
  | "archived";

export type CandidateEvidenceStatus =
  | "unsourced but coherent"
  | "source-linked"
  | "document-backed"
  | "unsupported";

export type CandidateEvidentialDistance =
  | "direct"
  | "near"
  | "moderate"
  | "far";

export type CandidateAiProvider = "openai" | "anthropic" | "heuristic";

export type CandidateAttachmentTarget = {
  kind: ReviewTargetKind;
  label: string;
};

export type CandidateInternalAiNote = {
  provider: CandidateAiProvider;
  model?: string;
  summary: string;
  shortReply?: string;
  limitations: string[];
  createdAt: string;
};

export type CandidateRecord = {
  id: string;
  sourceMessageId: string;
  roomId: string;
  topicId: string;
  rawUserText: string;
  normalizedTitle: string;
  normalizedBody: string;
  proposedLane: DebateLane;
  proposedAttachmentTarget: CandidateAttachmentTarget;
  scaleMap: string[];
  evidenceStatus: CandidateEvidenceStatus;
  evidenceAnchor?: string;
  evidentialDistance: CandidateEvidentialDistance;
  impactField: string[];
  internalAiNotes: CandidateInternalAiNote[];
  reviewStatus: CandidateReviewStatus;
  promotedContributionId?: string;
  aiAssisted: true;
  origin: CandidateOrigin;
  createdAt: string;
  updatedAt: string;
};

export type CreateCandidateInput = Omit<
  CandidateRecord,
  "id" | "createdAt" | "updatedAt" | "reviewStatus" | "promotedContributionId"
> & {
  reviewStatus?: CandidateReviewStatus;
  promotedContributionId?: string;
};

export type CandidateStoreDocument = {
  prototype: true;
  note: string;
  updatedAt: string;
  candidates: CandidateRecord[];
};
