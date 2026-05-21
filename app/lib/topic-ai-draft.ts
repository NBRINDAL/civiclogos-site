import type { AiProvider } from "./contribution-types";

export const topicAiDraftEventName = "civiclogos:topic-ai-draft";

export type TopicAiDraftDetail = {
  roomSlug: string;
  topicId: string;
  provider: AiProvider;
  providerLabel: string;
  model: string;
  question: string;
  response: string;
};
