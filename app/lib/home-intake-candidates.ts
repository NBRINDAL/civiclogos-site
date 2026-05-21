import { randomUUID } from "node:crypto";
import type {
  HomeIntakePromptTrace,
  HomeIntakeRecord,
  HomeIntakeRouting,
} from "./home-intake-types";

const ignoredTokens = new Set([
  "a",
  "about",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "because",
  "been",
  "but",
  "by",
  "can",
  "could",
  "did",
  "do",
  "does",
  "for",
  "from",
  "had",
  "has",
  "have",
  "how",
  "i",
  "if",
  "im",
  "in",
  "into",
  "is",
  "it",
  "its",
  "itself",
  "just",
  "me",
  "more",
  "my",
  "not",
  "of",
  "on",
  "or",
  "our",
  "really",
  "said",
  "should",
  "so",
  "that",
  "the",
  "their",
  "them",
  "there",
  "they",
  "this",
  "to",
  "us",
  "was",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "with",
  "would",
]) as ReadonlySet<string>;

function normalizePromptText(value: string) {
  return value
    .toLowerCase()
    .replace(/9\s*\/\s*11/g, " 911 ")
    .replace(/tower\s*7/g, " tower7 ")
    .replace(/wtc\s*7/g, " wtc7 ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeToken(token: string) {
  const normalized = token.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (!normalized) {
    return [];
  }

  if (normalized === "ais") {
    return ["ai"];
  }

  const expanded = new Set<string>([normalized]);

  if (normalized.endsWith("s") && normalized.length > 3) {
    expanded.add(normalized.slice(0, -1));
  }

  return [...expanded];
}

function tokenize(text: string) {
  const normalizedText = normalizePromptText(text);
  const tokens = new Set<string>();

  for (const rawToken of normalizedText.split(/[^a-zA-Z0-9]+/)) {
    for (const token of normalizeToken(rawToken)) {
      if (token.length < 2 || ignoredTokens.has(token)) {
        continue;
      }

      tokens.add(token);
    }
  }

  return [...tokens];
}

function getCandidateCorpus(entry: HomeIntakeRecord) {
  const promptHistory = getPromptHistory(entry).map((item) => item.prompt);

  return [
    entry.prompt,
    entry.routing.suggestedTopicTitle,
    entry.routing.suggestedCentralQuestion,
    entry.routing.suggestedTopicSummary,
    ...promptHistory,
  ]
    .filter(Boolean)
    .join(" ");
}

function getDistinctiveTokens(tokens: readonly string[]) {
  return tokens.filter((token) => token.length >= 6 || /^\d+$/.test(token) || token === "911");
}

function getRoutingConfidenceRank(routing: HomeIntakeRouting) {
  switch (routing.routeConfidence) {
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
    default:
      return 0;
  }
}

export function createPromptTrace(
  prompt: string,
  createdAt: string,
): HomeIntakePromptTrace {
  return {
    id: randomUUID(),
    prompt,
    createdAt,
  };
}

export function getPromptHistory(entry: HomeIntakeRecord) {
  if (entry.relatedPrompts?.length) {
    return entry.relatedPrompts;
  }

  return [
    {
      id: `${entry.id}-seed`,
      prompt: entry.prompt,
      createdAt: entry.createdAt,
    },
  ];
}

export function findMatchingRoomCandidate(
  prompt: string,
  candidates: readonly HomeIntakeRecord[],
) {
  const normalizedPrompt = normalizePromptText(prompt);
  const promptTokens = tokenize(prompt);
  const promptDistinctive = getDistinctiveTokens(promptTokens);

  let bestMatch:
    | {
        entry: HomeIntakeRecord;
        score: number;
        overlapCount: number;
      }
    | null = null;

  for (const entry of candidates) {
    const promptHistory = getPromptHistory(entry);

    if (
      promptHistory.some(
        (item) => normalizePromptText(item.prompt) === normalizedPrompt,
      )
    ) {
      return entry;
    }

    const entryTokens = tokenize(getCandidateCorpus(entry));
    const overlap = promptTokens.filter((token) => entryTokens.includes(token));
    const overlapCount = overlap.length;
    const distinctiveOverlap = getDistinctiveTokens(overlap);
    const promptCoverage =
      promptTokens.length > 0 ? overlapCount / promptTokens.length : 0;
    const score =
      overlapCount * 5 + distinctiveOverlap.length * 8 + promptCoverage * 10;

    const isStrongMatch =
      overlapCount >= 4 ||
      (distinctiveOverlap.length >= 2 && overlapCount >= 2) ||
      (distinctiveOverlap.length >= 1 && promptCoverage >= 0.45 && overlapCount >= 2) ||
      (promptDistinctive.length >= 2 &&
        distinctiveOverlap.length >= 1 &&
        promptCoverage >= 0.55);

    if (!isStrongMatch) {
      continue;
    }

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = {
        entry,
        score,
        overlapCount,
      };
    }
  }

  return bestMatch?.entry ?? null;
}

export function mergeCandidateRouting(
  existing: HomeIntakeRouting,
  next: HomeIntakeRouting,
) {
  const existingRank = getRoutingConfidenceRank(existing);
  const nextRank = getRoutingConfidenceRank(next);

  if (nextRank > existingRank) {
    return next;
  }

  if (
    nextRank === existingRank &&
    (next.providers.some((item) => item.state === "completed") ||
      !existing.providers.some((item) => item.state === "completed"))
  ) {
    return {
      ...existing,
      ...next,
      providers: next.providers,
    };
  }

  return existing;
}

export function appendPromptToCandidate(
  entry: HomeIntakeRecord,
  prompt: string,
  timestamp: string,
  nextRouting: HomeIntakeRouting,
) {
  const promptHistory = getPromptHistory(entry);
  const normalizedPrompt = normalizePromptText(prompt);
  const alreadyTracked = promptHistory.some(
    (item) => normalizePromptText(item.prompt) === normalizedPrompt,
  );
  const relatedPrompts = alreadyTracked
    ? promptHistory
    : [...promptHistory, createPromptTrace(prompt, timestamp)];

  return {
    ...entry,
    updatedAt: timestamp,
    promptCount: relatedPrompts.length,
    relatedPrompts,
    routing: mergeCandidateRouting(entry.routing, nextRouting),
  } satisfies HomeIntakeRecord;
}

export function buildNewCandidateRecord(
  entry: HomeIntakeRecord,
  prompt: string,
  timestamp: string,
) {
  return {
    ...entry,
    updatedAt: timestamp,
    promptCount: 1,
    relatedPrompts: [createPromptTrace(prompt, timestamp)],
  } satisfies HomeIntakeRecord;
}
