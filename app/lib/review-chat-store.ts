import type {
  CreateReviewChatMessageInput,
  ReviewChatMessage,
  ReviewChatStoreMetadata,
} from "./review-chat-types";
import {
  createDatabaseReviewChatStore,
  isDatabaseReviewChatStoreConfigured,
} from "./database-review-chat-store";

type ListReviewChatFilters = {
  contributionId: string;
  limit?: number;
};

type ReviewChatStoreAdapter = {
  getReviewChatStoreMetadata: () => Promise<ReviewChatStoreMetadata>;
  listReviewChatMessages: (
    filters: ListReviewChatFilters,
  ) => Promise<ReviewChatMessage[]>;
  createReviewChatMessage: (
    input: CreateReviewChatMessageInput,
  ) => Promise<ReviewChatMessage>;
};

const databaseStore = createDatabaseReviewChatStore();

function withFallbackNote(note: string) {
  return `${note} Database connection was unavailable, so Civic Logos fell back to the local prototype reviewer chat store for this request.`;
}

async function loadPrototypeReviewChatStore() {
  return import("./prototype-review-chat-store");
}

async function withReviewChatStore<T>(
  action: (store: ReviewChatStoreAdapter) => Promise<T>,
) {
  if (isDatabaseReviewChatStoreConfigured()) {
    try {
      return await action(databaseStore);
    } catch (error) {
      console.error("Reviewer chat database store failed, falling back to prototype store.", error);
    }
  }

  const prototypeStoreModule = await loadPrototypeReviewChatStore();
  const metadata = await prototypeStoreModule.getReviewChatStoreMetadata();
  const prototypeStore = {
    getReviewChatStoreMetadata: async () =>
      isDatabaseReviewChatStoreConfigured()
        ? {
            ...metadata,
            mode: "fallback" as const,
            note: withFallbackNote(metadata.note),
          }
        : {
            ...metadata,
            mode: "prototype" as const,
          },
    listReviewChatMessages: prototypeStoreModule.listReviewChatMessages,
    createReviewChatMessage: prototypeStoreModule.createReviewChatMessage,
  };

  return action(prototypeStore);
}

export async function getReviewChatStoreMetadata() {
  return withReviewChatStore((store) => store.getReviewChatStoreMetadata());
}

export async function listReviewChatMessages(filters: ListReviewChatFilters) {
  return withReviewChatStore((store) => store.listReviewChatMessages(filters));
}

export async function createReviewChatMessage(
  input: CreateReviewChatMessageInput,
) {
  return withReviewChatStore((store) => store.createReviewChatMessage(input));
}
