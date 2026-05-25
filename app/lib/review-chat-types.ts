import type { AiProviderName } from "./ai-provider-config";

export type ReviewChatMode = "chat" | "synthesis";

export type ReviewChatMessage = {
  id: string;
  contributionId: string;
  role: "user" | "assistant";
  body: string;
  createdAt: string;
  provider?: AiProviderName;
  model?: string;
  mode?: ReviewChatMode;
};

export type CreateReviewChatMessageInput = Omit<ReviewChatMessage, "id">;

export type ReviewChatStoreMetadata = {
  prototype: boolean;
  mode: "prototype" | "database" | "fallback";
  note: string;
  storePath?: string;
};

export type ReviewChatStoreDocument = {
  prototype: true;
  note: string;
  updatedAt: string;
  messages: ReviewChatMessage[];
};
