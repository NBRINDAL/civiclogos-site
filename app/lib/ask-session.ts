import { randomUUID } from "node:crypto";

const askSessionCookieName = "civiclogos-ask-session";

export function getAskSessionCookieName() {
  return askSessionCookieName;
}

export function isAskSessionId(value: string | undefined) {
  return Boolean(value?.trim());
}

export function createAskSessionId() {
  return randomUUID();
}
