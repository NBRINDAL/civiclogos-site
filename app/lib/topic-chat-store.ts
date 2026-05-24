import type {
  CreateTopicChatMessageInput,
  TopicChatMessage,
  TopicChatStoreMetadata,
} from "./topic-chat-types";
import type { IssueRoomSlug } from "./civic-logos";
import {
  createDatabaseTopicChatStore,
  isDatabaseTopicChatStoreConfigured,
} from "./database-topic-chat-store";

type ListTopicChatFilters = {
  sessionId: string;
  roomSlug?: IssueRoomSlug;
  topicId?: string;
  limit?: number;
};

type TopicChatStoreAdapter = {
  getTopicChatStoreMetadata: () => Promise<TopicChatStoreMetadata>;
  listTopicChatMessages: (
    filters: ListTopicChatFilters,
  ) => Promise<TopicChatMessage[]>;
  createTopicChatMessage: (
    input: CreateTopicChatMessageInput,
  ) => Promise<TopicChatMessage>;
};

const databaseStore = createDatabaseTopicChatStore();

function withFallbackNote(note: string) {
  return `${note} Database connection was unavailable, so Civic Logos fell back to the local prototype chat store for this request.`;
}

async function loadPrototypeTopicChatStore() {
  return import("./prototype-topic-chat-store");
}

async function withTopicChatStore<T>(
  action: (store: TopicChatStoreAdapter) => Promise<T>,
) {
  if (isDatabaseTopicChatStoreConfigured()) {
    try {
      return await action(databaseStore);
    } catch (error) {
      console.error("Topic chat database store failed, falling back to prototype store.", error);
    }
  }

  const prototypeStoreModule = await loadPrototypeTopicChatStore();
  const metadata = await prototypeStoreModule.getTopicChatStoreMetadata();
  const prototypeStore = {
    getTopicChatStoreMetadata: async () =>
      isDatabaseTopicChatStoreConfigured()
        ? {
            ...metadata,
            mode: "fallback" as const,
            note: withFallbackNote(metadata.note),
          }
        : {
            ...metadata,
            mode: "prototype" as const,
          },
    listTopicChatMessages: prototypeStoreModule.listTopicChatMessages,
    createTopicChatMessage: prototypeStoreModule.createTopicChatMessage,
  };

  return action(prototypeStore);
}

export async function getTopicChatStoreMetadata() {
  return withTopicChatStore((store) => store.getTopicChatStoreMetadata());
}

export async function listTopicChatMessages(filters: ListTopicChatFilters) {
  return withTopicChatStore((store) => store.listTopicChatMessages(filters));
}

export async function createTopicChatMessage(input: CreateTopicChatMessageInput) {
  return withTopicChatStore((store) => store.createTopicChatMessage(input));
}
