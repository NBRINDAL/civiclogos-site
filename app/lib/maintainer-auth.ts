import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const maintainerSessionCookieName = "civiclogos_maintainer_session";

const maintainerSessionMaxAgeSeconds = 60 * 60 * 12;

function getConfiguredMaintainerKey() {
  return (
    process.env.CIVIC_LOGOS_MAINTAINER_KEY?.trim() ||
    process.env.MAINTAINER_REVIEW_KEY?.trim() ||
    ""
  );
}

function hashMaintainerKey(key: string) {
  return createHash("sha256")
    .update(`civiclogos-maintainer-session:${key}`)
    .digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isMaintainerReviewConfigured() {
  return Boolean(getConfiguredMaintainerKey());
}

export function isValidMaintainerKey(candidate: string) {
  const configuredKey = getConfiguredMaintainerKey();
  const trimmedCandidate = candidate.trim();

  if (!configuredKey || !trimmedCandidate) {
    return false;
  }

  return safeEqual(hashMaintainerKey(trimmedCandidate), hashMaintainerKey(configuredKey));
}

export function isValidMaintainerSessionValue(value?: string | null) {
  const configuredKey = getConfiguredMaintainerKey();

  if (!configuredKey || !value) {
    return false;
  }

  return safeEqual(value, hashMaintainerKey(configuredKey));
}

export async function hasMaintainerSession() {
  const cookieStore = await cookies();
  return isValidMaintainerSessionValue(
    cookieStore.get(maintainerSessionCookieName)?.value,
  );
}

export async function setMaintainerSession(maintainerKey: string) {
  if (!isValidMaintainerKey(maintainerKey)) {
    return false;
  }

  const cookieStore = await cookies();
  cookieStore.set(maintainerSessionCookieName, hashMaintainerKey(maintainerKey.trim()), {
    httpOnly: true,
    maxAge: maintainerSessionMaxAgeSeconds,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return true;
}
