import type { AiProvider } from "./contribution-types";
import type { IssueRoomSlug } from "./civic-logos";

export type HomeIntakeRouteKind = "existing-room" | "new-room-draft";

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

export type HomeIntakeRecord = {
  id: string;
  prompt: string;
  createdAt: string;
  updatedAt: string;
  routing: HomeIntakeRouting;
};

export type HomeIntakeStoreDocument = {
  prototype: true;
  note: string;
  updatedAt: string;
  entries: HomeIntakeRecord[];
};
