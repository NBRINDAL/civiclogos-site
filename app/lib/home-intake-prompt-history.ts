import type {
  HomeIntakePromptTrace,
  HomeIntakeRecord,
} from "./home-intake-types";

type HomeIntakePromptCarrier = Pick<
  HomeIntakeRecord,
  "id" | "prompt" | "createdAt" | "updatedAt" | "promptCount" | "relatedPrompts"
>;

export function getPromptTimestamp(value: string) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function formatPromptDate(value: string) {
  if (!value || !getPromptTimestamp(value)) {
    return undefined;
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getPromptHistoryCount(entry: HomeIntakePromptCarrier) {
  return entry.promptCount ?? entry.relatedPrompts?.length ?? 1;
}

export function getPromptHistoryHref(entry: Pick<HomeIntakeRecord, "id">) {
  return `/intake/${entry.id}#prompt-history`;
}

export function getPromptHistory(
  entry: HomeIntakePromptCarrier,
): HomeIntakePromptTrace[] {
  const promptHistory =
    entry.relatedPrompts?.length
      ? entry.relatedPrompts
      : [
          {
            id: `${entry.id}-seed`,
            prompt: entry.prompt,
            createdAt: entry.updatedAt || entry.createdAt,
          },
        ];

  return promptHistory
    .slice()
    .sort(
      (left, right) =>
        getPromptTimestamp(right.createdAt) - getPromptTimestamp(left.createdAt),
    );
}

export function getLatestAttachedPrompt(entry: HomeIntakePromptCarrier) {
  return getPromptHistory(entry)[0] ?? null;
}

export function getEarliestAttachedPrompt(entry: HomeIntakePromptCarrier) {
  const promptHistory = getPromptHistory(entry);
  return promptHistory[promptHistory.length - 1] ?? null;
}

export function getPromptEvolution(entry: HomeIntakePromptCarrier) {
  const earliest = getEarliestAttachedPrompt(entry);
  const latest = getLatestAttachedPrompt(entry);

  if (!earliest || !latest) {
    return null;
  }

  const changed =
    earliest.id !== latest.id || earliest.prompt !== latest.prompt;

  if (!changed) {
    return null;
  }

  return { earliest, latest };
}
