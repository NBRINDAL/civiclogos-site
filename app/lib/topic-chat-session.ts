import { randomUUID } from "node:crypto";

const topicChatSessionCookieName = "civiclogos-topic-chat-session";

export function getTopicChatSessionCookieName() {
  return topicChatSessionCookieName;
}

export function isTopicChatSessionId(value: string | undefined) {
  return Boolean(value?.trim());
}

export function createTopicChatSessionId() {
  return randomUUID();
}
