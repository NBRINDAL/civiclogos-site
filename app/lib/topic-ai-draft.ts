import type { AiProvider } from "./contribution-types";
import type { DebateLane } from "./reasoning-types";

export const topicAiDraftEventName = "civiclogos:topic-ai-draft";

export type TopicAiDraftDetail = {
  roomSlug: string;
  topicId: string;
  messageId: string;
  provider: AiProvider;
  providerLabel: string;
  model: string;
  generatedAt: string;
  question: string;
  response: string;
  suggestedLane?: DebateLane;
};
