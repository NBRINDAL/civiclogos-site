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
import {
  createTopicChatMessage as createPrototypeTopicChatMessage,
  getTopicChatStoreMetadata as getPrototypeTopicChatStoreMetadata,
  listTopicChatMessages as listPrototypeTopicChatMessages,
} from "./prototype-topic-chat-store";

type ListTopicChatFilters = {
  sessionId: string;
  roomSlug?: IssueRoomSlug;
  topicId?: string;
  limit?: number;
};

const databaseStore = createDatabaseTopicChatStore();

function withFallbackNote(note: string) {
  return `${note} Database connection was unavailable, so Civic Logos fell back to the local prototype chat store for this request.`;
}

async function withTopicChatStore<T>(
  action: (
    store: {
      getTopicChatStoreMetadata: () => Promise<TopicChatStoreMetadata>;
      listTopicChatMessages: (
        filters: ListTopicChatFilters,
      ) => Promise<TopicChatMessage[]>;
      createTopicChatMessage: (
        input: CreateTopicChatMessageInput,
      ) => Promise<TopicChatMessage>;
    },
  ) => Promise<T>,
) {
  if (isDatabaseTopicChatStoreConfigured()) {
    try {
      return await action(databaseStore);
    } catch (error) {
      console.error("Topic chat database store failed, falling back to prototype store.", error);
    }
  }

  const metadata = await getPrototypeTopicChatStoreMetadata();
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
    listTopicChatMessages: listPrototypeTopicChatMessages,
    createTopicChatMessage: createPrototypeTopicChatMessage,
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
