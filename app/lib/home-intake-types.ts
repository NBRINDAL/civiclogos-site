import type { AiProvider } from "./contribution-types";
import type { IssueRoomSlug } from "./civic-logos";

export type HomeIntakeRouteKind =
  | "existing-room"
  | "room-topic-draft"
  | "new-room-draft";

export type HomeIntakeConfidence = "high" | "medium" | "low";

export type ProviderHomeIntakeRouting = {
  provider: AiProvider;
  state: "completed" | "unavailable" | "error";
  model?: string;
  routeKind?: HomeIntakeRouteKind;
  roomSlug?: IssueRoomSlug;
  roomTitle?: string;
  topicId?: string;
  topicTitle?: string;
  routeConfidence?: HomeIntakeConfidence;
  fitSummary?: string;
  suggestedCentralQuestion?: string;
  suggestedTopicTitle?: string;
  suggestedTopicSummary?: string;
  suggestedFirstQuestions?: string[];
  whyNotExistingRooms?: string;
  errorMessage?: string;
};

export type HomeIntakeRouting = {
  state: "completed" | "partial" | "unavailable" | "error";
  routeKind?: HomeIntakeRouteKind;
  roomSlug?: IssueRoomSlug;
  roomTitle?: string;
  topicId?: string;
  topicTitle?: string;
  routeConfidence?: HomeIntakeConfidence;
  fitSummary?: string;
  suggestedCentralQuestion?: string;
  suggestedTopicTitle?: string;
  suggestedTopicSummary?: string;
  suggestedFirstQuestions?: string[];
  whyNotExistingRooms?: string;
  providers: ProviderHomeIntakeRouting[];
};

export type HomeIntakePromptTrace = {
  id: string;
  prompt: string;
  createdAt: string;
};

export type HomeIntakePromotionStatus =
  | "held"
  | "ready_for_live_room"
  | "ready_for_live_topic"
  | "merged_into_existing_room"
  | "rejected"
  | "promoted";

export type HomeIntakePromotionReview = {
  status: HomeIntakePromotionStatus;
  reviewerLabel: string;
  reviewerNote: string;
  neutralBaselineTitle?: string;
  neutralBaselineQuestion?: string;
  neutralBaselineSynthesis?: string;
  guardrailNote?: string;
  decidedAt: string;
};

export type HomeIntakeRecord = {
  id: string;
  prompt: string;
  createdAt: string;
  updatedAt: string;
  promptCount?: number;
  relatedPrompts?: HomeIntakePromptTrace[];
  routing: HomeIntakeRouting;
  promotionReview?: HomeIntakePromotionReview;
};

export type HomeIntakeStoreDocument = {
  prototype: true;
  note: string;
  updatedAt: string;
  entries: HomeIntakeRecord[];
};

export type HomeIntakeStoreMetadata = {
  prototype: boolean;
  mode: "prototype" | "database" | "fallback";
  note: string;
  storePath?: string;
};
