import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import type {
  CreateTopicChatMessageInput,
  TopicChatMessage,
  TopicChatStoreDocument,
} from "./topic-chat-types";
import type { IssueRoomSlug } from "./civic-logos";

type ListTopicChatFilters = {
  sessionId: string;
  roomSlug?: IssueRoomSlug;
  topicId?: string;
  limit?: number;
};

const defaultDocument: TopicChatStoreDocument = {
  prototype: true,
  note: "Prototype topic chat storage is active while persistent storage is being finalized.",
  updatedAt: new Date().toISOString(),
  messages: [],
};

let storePathPromise: Promise<string> | null = null;
let writeQueue = Promise.resolve();

async function ensureStoreFile(filePath: string) {
  await mkdir(path.dirname(filePath), { recursive: true });

  try {
    await access(filePath);
  } catch {
    await writeFile(filePath, JSON.stringify(defaultDocument, null, 2), "utf8");
  }
}

async function resolveStorePath() {
  if (!storePathPromise) {
    storePathPromise = (async () => {
      const preferredPath = path.join(
        /* turbopackIgnore: true */ process.cwd(),
        "data",
        "prototype-topic-chat.runtime.json",
      );

      try {
        await ensureStoreFile(preferredPath);
        return preferredPath;
      } catch {
        const fallbackPath = path.join(
          tmpdir(),
          "civiclogos-prototype-topic-chat.runtime.json",
        );
        await ensureStoreFile(fallbackPath);
        return fallbackPath;
      }
    })();
  }

  return storePathPromise;
}

async function readStoreDocument() {
  const storePath = await resolveStorePath();
  const raw = await readFile(storePath, "utf8");
  return JSON.parse(raw) as TopicChatStoreDocument;
}

async function writeStoreDocument(document: TopicChatStoreDocument) {
  const storePath = await resolveStorePath();
  document.updatedAt = new Date().toISOString();
  await writeFile(storePath, JSON.stringify(document, null, 2), "utf8");
}

function enqueueWrite<T>(task: () => Promise<T>) {
  const result = writeQueue.then(task, task);
  writeQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

export async function getTopicChatStoreMetadata() {
  const storePath = await resolveStorePath();

  return {
    prototype: true as const,
    mode: "prototype" as const,
    storePath,
    note: defaultDocument.note,
  };
}

export async function listTopicChatMessages(filters: ListTopicChatFilters) {
  const document = await readStoreDocument();
  const limit = Math.min(Math.max(filters.limit ?? 18, 1), 60);

  return [...document.messages]
    .filter((item) => {
      if (item.sessionId !== filters.sessionId) {
        return false;
      }

      if (filters.roomSlug && item.roomSlug !== filters.roomSlug) {
        return false;
      }

      if (filters.topicId && item.topicId !== filters.topicId) {
        return false;
      }

      return true;
    })
    .sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    )
    .slice(-limit);
}

export async function createTopicChatMessage(
  input: CreateTopicChatMessageInput,
): Promise<TopicChatMessage> {
  return enqueueWrite(async () => {
    const document = await readStoreDocument();
    const message: TopicChatMessage = {
      ...input,
      id: randomUUID(),
    };

    document.messages.push(message);
    await writeStoreDocument(document);
    return message;
  });
}
