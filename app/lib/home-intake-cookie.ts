import type { HomeIntakeRecord } from "./home-intake-types";

export type HomeIntakeCookiePayload = {
  id: string;
  prompt: string;
  promptCount?: number;
  relatedPrompts?: HomeIntakeRecord["relatedPrompts"];
  routing: HomeIntakeRecord["routing"];
};

const cookieName = "civiclogos-latest-intake";

function truncate(value: string | undefined, maxLength: number) {
  if (!value) {
    return value;
  }

  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

export function getHomeIntakeCookieName() {
  return cookieName;
}

export function serializeHomeIntakeCookie(entry: HomeIntakeRecord) {
  const payload: HomeIntakeCookiePayload = {
    id: entry.id,
    prompt: truncate(entry.prompt, 700) ?? "",
    promptCount: entry.promptCount,
    relatedPrompts: entry.relatedPrompts?.slice(-6).map((item) => ({
      ...item,
      prompt: truncate(item.prompt, 240) ?? item.prompt,
    })),
    routing: {
      ...entry.routing,
      fitSummary: truncate(entry.routing.fitSummary, 420),
      suggestedCentralQuestion: truncate(
        entry.routing.suggestedCentralQuestion,
        320,
      ),
      suggestedTopicSummary: truncate(entry.routing.suggestedTopicSummary, 420),
      whyNotExistingRooms: truncate(entry.routing.whyNotExistingRooms, 320),
      providers: entry.routing.providers.map((provider) => ({
        ...provider,
        fitSummary: truncate(provider.fitSummary, 260),
        suggestedCentralQuestion: truncate(
          provider.suggestedCentralQuestion,
          220,
        ),
        suggestedTopicSummary: truncate(provider.suggestedTopicSummary, 260),
        whyNotExistingRooms: truncate(provider.whyNotExistingRooms, 220),
        errorMessage: truncate(provider.errorMessage, 180),
      })),
    },
  };

  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function parseHomeIntakeCookie(
  value: string | undefined,
): HomeIntakeCookiePayload | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as HomeIntakeCookiePayload;

    if (!parsed?.id || !parsed?.routing) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
