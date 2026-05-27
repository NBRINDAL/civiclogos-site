import {
  debateLaneLabels,
  debateLaneOptions,
  type DebateLane,
  type ReviewTargetKind,
} from "./reasoning-types";

export type CandidateOrigin = "human_submitted_via_ai_intake";

export const candidateInternalLaneOptions = [
  "proposed_reformulation",
  "symbolic_interpretation",
] as const;

export type CandidateInternalLane = (typeof candidateInternalLaneOptions)[number];

export const candidateLaneOptions = [
  ...debateLaneOptions,
  ...candidateInternalLaneOptions,
] as const;

export type CandidateLane = (typeof candidateLaneOptions)[number];

export type CandidateRoutingStatus =
  | "routed"
  | "needs_routing"
  | "rejected_route";

export type CandidateRouteConfidence = "high" | "medium" | "low";

export type CandidateRejectedRoute = {
  roomId: string;
  topicId?: string;
  confidence: CandidateRouteConfidence;
  reason: string;
  matchedSignals: string[];
};

export type CandidateRoutingMetadata = {
  routingStatus: CandidateRoutingStatus;
  routedRoomId?: string;
  routedTopicId?: string;
  routeConfidence: CandidateRouteConfidence;
  routeReason: string;
  matchedSignals: string[];
  rejectedRoutes: CandidateRejectedRoute[];
};

export type CandidateReviewStatus =
  | "needs_routing"
  | "pending_human_review"
  | "promoted_to_public_contribution"
  | "rejected"
  | "archived";

export type CandidateEvidenceStatus =
  | "unsourced but coherent"
  | "symbolic/mathematical proposal, not empirical evidence"
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
  proposedLane: CandidateLane;
  proposedAttachmentTarget: CandidateAttachmentTarget;
  scaleMap: string[];
  evidenceStatus: CandidateEvidenceStatus;
  evidenceAnchor?: string;
  evidentialDistance: CandidateEvidentialDistance;
  impactField: string[];
  internalAiNotes: CandidateInternalAiNote[];
  reviewStatus: CandidateReviewStatus;
  promotedContributionId?: string;
  routingStatus: CandidateRoutingStatus;
  routedRoomId?: string;
  routedTopicId?: string;
  routeConfidence: CandidateRouteConfidence;
  routeReason: string;
  matchedSignals: string[];
  rejectedRoutes: CandidateRejectedRoute[];
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

export type RouteCandidateToTopicInput = {
  roomId: string;
  topicId: string;
  reviewStatus: CandidateReviewStatus;
  routingStatus: CandidateRoutingStatus;
  routedRoomId?: string;
  routedTopicId?: string;
  routeConfidence?: CandidateRouteConfidence;
  routeReason?: string;
  matchedSignals?: string[];
  rejectedRoutes?: CandidateRejectedRoute[];
  scaleMap?: string[];
};

export type CandidateStoreDocument = {
  prototype: true;
  note: string;
  updatedAt: string;
  candidates: CandidateRecord[];
};

const candidateLaneLabels: Record<CandidateLane, string> = {
  ...debateLaneLabels,
  proposed_reformulation: "Proposed reformulation",
  symbolic_interpretation: "Symbolic interpretation",
};

export function getCandidateLaneLabel(value: CandidateLane) {
  return candidateLaneLabels[value];
}

export function getPromotableContributionLane(value: CandidateLane): DebateLane {
  switch (value) {
    case "proposed_reformulation":
    case "symbolic_interpretation":
      return "nuance";
    default:
      return value;
  }
}

export function resolveCandidateRoutingMetadata(input: {
  roomId: string;
  topicId: string;
  reviewStatus: CandidateReviewStatus;
  routingStatus?: CandidateRoutingStatus;
  routedRoomId?: string;
  routedTopicId?: string;
  routeConfidence?: CandidateRouteConfidence;
  routeReason?: string;
  matchedSignals?: string[];
  rejectedRoutes?: CandidateRejectedRoute[];
}): CandidateRoutingMetadata {
  const inferredRoutingStatus =
    input.routingStatus ??
    (input.roomId !== "unrouted" && input.topicId !== "unrouted"
      ? "routed"
      : input.reviewStatus === "needs_routing"
        ? "needs_routing"
        : "rejected_route");
  const routedRoomId =
    input.routedRoomId ??
    (inferredRoutingStatus === "routed" ? input.roomId : undefined);
  const routedTopicId =
    input.routedTopicId ??
    (inferredRoutingStatus === "routed" ? input.topicId : undefined);

  return {
    routingStatus: inferredRoutingStatus,
    routedRoomId,
    routedTopicId,
    routeConfidence:
      input.routeConfidence ??
      (inferredRoutingStatus === "routed" ? "high" : "low"),
    routeReason:
      input.routeReason ??
      (inferredRoutingStatus === "routed"
        ? "Attached to an existing topic before human review."
        : inferredRoutingStatus === "rejected_route"
          ? "A possible route was considered, but Civic Logos refused to force a weak fit."
          : "Civic Logos could not confidently attach this to an existing topic."),
    matchedSignals: input.matchedSignals ?? [],
    rejectedRoutes: input.rejectedRoutes ?? [],
  };
}
