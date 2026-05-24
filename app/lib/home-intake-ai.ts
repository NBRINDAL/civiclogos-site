import {
  getInspectableTopics,
  getRoomTopicCard,
  issueRooms,
  roomDirectory,
  type IssueRoomSlug,
} from "./civic-logos";
import {
  getAnthropicProviderConfig,
  getOpenAIProviderConfig,
} from "./ai-provider-config";
import type {
  HomeIntakeRouting,
  ProviderHomeIntakeRouting,
} from "./home-intake-types";

type RoutingDraft = Omit<ProviderHomeIntakeRouting, "provider" | "state" | "model">;

type TopicHeuristicMatch = {
  topicId?: string;
  topicTitle?: string;
  score: number;
  topicOverlapCount?: number;
  title?: string;
  summary?: string;
};

type RoomHeuristicMatch = {
  roomSlug: IssueRoomSlug;
  roomTitle: string;
  roomQuestion: string;
  score: number;
  topicMatch: TopicHeuristicMatch;
  matchedKeywords: string[];
  matchedTokenCount: number;
};

type RoutingSchemaResult = {
  route_kind: "existing-room" | "room-topic-draft" | "new-room-draft";
  room_slug:
    | IssueRoomSlug
    | "new-room-draft";
  topic_id: string;
  route_confidence: "high" | "medium" | "low";
  fit_summary: string;
  suggested_central_question: string;
  suggested_topic_title: string;
  suggested_topic_summary: string;
  suggested_first_questions: string[];
  why_not_existing_rooms: string;
};

type OpenAIResponse = {
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

type AnthropicResponse = {
  content?: Array<{
    type?: string;
    text?: string;
  }>;
};

const roomSlugOptions = Object.keys(issueRooms) as IssueRoomSlug[];

const ignoredPromptTokens = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "be",
  "been",
  "being",
  "but",
  "by",
  "do",
  "does",
  "for",
  "from",
  "how",
  "if",
  "in",
  "into",
  "is",
  "it",
  "more",
  "need",
  "needs",
  "of",
  "on",
  "or",
  "our",
  "should",
  "that",
  "the",
  "their",
  "them",
  "this",
  "to",
  "we",
  "what",
  "which",
  "who",
  "will",
  "with",
  "without",
]) as ReadonlySet<string>;

const roomKeywordMap: Record<IssueRoomSlug, readonly string[]> = {
  healthcare: [
    "healthcare",
    "health",
    "hospital",
    "hospitals",
    "doctor",
    "doctors",
    "nurse",
    "nurses",
    "insurance",
    "insurer",
    "insurers",
    "patient",
    "patients",
    "pharma",
    "pharmaceutical",
    "pharmaceuticals",
    "medicare",
    "medicaid",
    "clinic",
    "care",
    "provider",
    "providers",
  ],
  governance: [
    "governance",
    "government",
    "governments",
    "democracy",
    "democratic",
    "election",
    "elections",
    "authority",
    "authorities",
    "policy",
    "policies",
    "constitution",
    "constitutional",
    "federal",
    "state",
    "states",
    "city",
    "cities",
    "local",
    "bureaucracy",
    "govern",
    "tax",
    "taxes",
    "taxation",
    "income",
    "earners",
    "irs",
    "fiscal",
    "redistribution",
    "budget",
    "budgets",
  ],
  housing: [
    "housing",
    "home",
    "homes",
    "rent",
    "rents",
    "rental",
    "zoning",
    "land",
    "development",
    "developments",
    "build",
    "building",
    "buildings",
    "affordability",
    "affordable",
    "homelessness",
    "neighborhood",
    "density",
  ],
  "ai-labor": [
    "ai",
    "artificial",
    "intelligence",
    "model",
    "models",
    "llm",
    "llms",
    "automation",
    "automated",
    "deepfake",
    "deepfakes",
    "synthetic",
    "surveillance",
    "propaganda",
    "labor",
    "job",
    "jobs",
    "compute",
    "alignment",
    "robot",
    "robots",
  ],
  "institutional-trust": [
    "trust",
    "institution",
    "institutions",
    "institutional",
    "corruption",
    "disclosure",
    "transparency",
    "legitimacy",
    "correction",
    "corrections",
    "conflict",
    "conflicts",
    "whistleblower",
    "whistleblowing",
    "credibility",
    "reputation",
    "repair",
    "propaganda",
    "epstein",
    "blackmail",
    "coverup",
    "coverups",
    "trafficking",
    "elite",
    "elites",
    "abuse",
    "power-network",
    "network",
  ],
};

const highSalienceKeywords = new Set([
  "epstein",
  "blackmail",
  "coverup",
  "coverups",
  "trafficking",
  "elite",
  "elites",
  "abuse",
  "corruption",
  "scandal",
  "tax",
  "taxes",
  "taxation",
  "income",
  "earners",
  "irs",
  "fiscal",
  "redistribution",
  "poverty",
  "wealth",
  "inequality",
]);

const physicsFoundationKeywords = new Set([
  "physics",
  "quantum",
  "mechanic",
  "mechanics",
  "relativity",
  "planck",
  "hbar",
  "gravity",
  "gr",
  "qm",
  "spacetime",
  "cosmology",
  "particle",
  "particles",
  "field",
  "fields",
  "qft",
  "standardmodel",
  "standard",
]);

const intakeSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "route_kind",
    "room_slug",
    "topic_id",
    "route_confidence",
    "fit_summary",
    "suggested_central_question",
    "suggested_topic_title",
    "suggested_topic_summary",
    "suggested_first_questions",
    "why_not_existing_rooms",
  ],
  properties: {
    route_kind: {
      type: "string",
      enum: ["existing-room", "room-topic-draft", "new-room-draft"],
    },
    room_slug: {
      type: "string",
      enum: [...roomSlugOptions, "new-room-draft"],
    },
    topic_id: { type: "string" },
    route_confidence: {
      type: "string",
      enum: ["high", "medium", "low"],
    },
    fit_summary: { type: "string" },
    suggested_central_question: { type: "string" },
    suggested_topic_title: { type: "string" },
    suggested_topic_summary: { type: "string" },
    suggested_first_questions: {
      type: "array",
      items: { type: "string" },
    },
    why_not_existing_rooms: { type: "string" },
  },
} as const;

function buildRoomContext() {
  return roomDirectory.map((room) => {
    const roomSlug = room.slug as IssueRoomSlug;
    const roomData = issueRooms[roomSlug];

    return {
      slug: roomSlug,
      title: room.title,
      question: roomData.question,
      summary: room.summary,
      stage: room.stage,
      domain: room.domain,
      currentSynthesis: roomData.currentSynthesis,
      topicField: getInspectableTopics(roomData).map((item) => ({
        id: item.href?.split("/").pop() ?? "",
        title: item.title,
        summary: item.summary,
      })),
    };
  });
}

function buildRoutingPrompt(prompt: string) {
  return JSON.stringify(
    {
      user_prompt: prompt,
      current_room_map: buildRoomContext(),
      routing_instruction:
        "Use existing-room when the idea already fits a live room and one of the current live topic cards can reasonably absorb it. Use room-topic-draft when the room is clearly right but the current live topic cards do not hold the idea cleanly enough yet, so Civic Logos should open a durable draft topic inside that room. Only recommend a new-room-draft when the current room map itself is a genuinely poor fit.",
    },
    null,
    2,
  );
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
  const tokens = new Set<string>();

  for (const rawToken of text.split(/[^a-zA-Z0-9]+/)) {
    for (const token of normalizeToken(rawToken)) {
      if (token.length < 2 || ignoredPromptTokens.has(token)) {
        continue;
      }

      tokens.add(token);
    }
  }

  return [...tokens];
}

function scoreKeywordHits(promptTokens: readonly string[], keywords: readonly string[]) {
  const keywordSet = new Set<string>(keywords.flatMap((item) => normalizeToken(item)));
  return promptTokens.filter((token) => keywordSet.has(token)).length;
}

function scoreCorpusOverlap(
  promptTokens: readonly string[],
  corpusTokens: readonly string[],
) {
  const corpusSet = new Set<string>(corpusTokens);
  return promptTokens.filter((token) => corpusSet.has(token)).length;
}

function getTopicIdFromHref(href: string | undefined) {
  return href?.split("/").pop();
}

function summarizePrompt(prompt: string, maxLength: number) {
  const cleaned = prompt.trim().replace(/\s+/g, " ");
  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength - 1).trimEnd()}…`;
}

function buildFallbackTopicTitle(prompt: string) {
  return summarizePrompt(prompt.replace(/[?!.]+$/, ""), 88);
}

function buildFallbackTopicSummary(prompt: string) {
  return `This room candidate was opened because the current room map did not cleanly absorb the question: ${summarizePrompt(prompt, 170)}`;
}

function buildQuestionFromPrompt(prompt: string, maxLength = 180) {
  return prompt.trim().endsWith("?")
    ? summarizePrompt(prompt.trim(), maxLength)
    : `${summarizePrompt(prompt.trim(), maxLength - 4)}?`;
}

function isHighSaliencePrompt(promptTokens: readonly string[]) {
  return promptTokens.some((token) => highSalienceKeywords.has(token));
}

function buildPhysicsFoundationsRouting(
  prompt: string,
  promptTokens = tokenize(prompt),
): RoutingDraft | null {
  const normalizedPrompt = prompt.toLowerCase();
  const keywordHits = promptTokens.filter((token) =>
    physicsFoundationKeywords.has(token),
  );
  const hasPhysicsPhrase =
    /general\s+relativity/i.test(prompt) ||
    /quantum\s+(mechanics|theory|field)/i.test(prompt) ||
    /planck\s+(unit|units|scale|length|time|mass|energy)/i.test(prompt) ||
    /standard\s+physics/i.test(prompt);
  const hasEnoughPhysicsSignal =
    keywordHits.length >= 2 ||
    (keywordHits.length >= 1 && hasPhysicsPhrase) ||
    (normalizedPrompt.includes("quantum") &&
      normalizedPrompt.includes("relativity"));

  if (!hasEnoughPhysicsSignal) {
    return null;
  }

  return {
    routeKind: "new-room-draft",
    roomTitle: "Room candidate",
    routeConfidence: "high",
    fitSummary:
      "This prompt is about physics foundations, which sits outside the current active room map. Civic Logos is opening a room candidate instead of forcing it into Healthcare, Governance, Housing, AI, or Institutional Trust.",
    suggestedCentralQuestion:
      "How should standard quantum theory, general relativity, and Planck-unit definitions be mapped before evaluating proposed reformulations?",
    suggestedTopicTitle:
      "Physics Foundations: Quantum Theory, General Relativity, and Planck Units",
    suggestedTopicSummary:
      "A neutral room candidate for standard physics foundations that separates established definitions, empirical domains, unresolved incompatibilities, and open questions before any alternative framework is evaluated.",
    suggestedFirstQuestions: [
      "Which definitions are established conventions rather than contested claims?",
      "Where are quantum theory and general relativity empirically strongest, and where do their domains fail to merge cleanly?",
      "What would an alternative framework need to predict, explain, or measure before it should pressure the synthesis?",
    ],
    whyNotExistingRooms:
      "The active room map does not yet include a science or physics foundations room. Shared words such as evidence, standards, or models are not enough to place this inside Healthcare or AI.",
  };
}

function buildHeuristicRouting(prompt: string): RoutingDraft {
  const promptTokens = tokenize(prompt);
  const domainGapRouting = buildPhysicsFoundationsRouting(prompt, promptTokens);

  if (domainGapRouting) {
    return domainGapRouting;
  }

  const roomMatches = roomDirectory.map((room): RoomHeuristicMatch => {
    const roomSlug = room.slug as IssueRoomSlug;
    const roomData = issueRooms[roomSlug];
    const topicField = getInspectableTopics(roomData);
    const keywordTokens = roomKeywordMap[roomSlug].flatMap((item) => normalizeToken(item));
    const topicMatch = topicField.reduce<TopicHeuristicMatch>(
      (best, item) => {
        const topicTokens = tokenize(
          [item.title, item.summary, item.metric, item.label].join(" "),
        );
        const topicOverlapCount = scoreCorpusOverlap(promptTokens, topicTokens);
        const score =
          topicOverlapCount * 2 +
          scoreKeywordHits(promptTokens, roomKeywordMap[roomSlug]);

        if (score <= best.score) {
          return best;
        }

        return {
          topicId: getTopicIdFromHref(item.href),
          topicTitle: item.title,
          score,
          topicOverlapCount,
          title: item.title,
          summary: item.summary,
        };
      },
      { score: 0 },
    );

    const roomTokens = tokenize(
      [
        room.title,
        room.domain,
        room.summary,
        roomData.question,
        roomData.currentSynthesis,
      ].join(" "),
    );
    const keywordHits = scoreKeywordHits(promptTokens, roomKeywordMap[roomSlug]);
    const overlap = scoreCorpusOverlap(promptTokens, roomTokens);
    const matchedKeywords = promptTokens.filter((token) => keywordTokens.includes(token));
    const topicTokens = topicField.flatMap((item) =>
      tokenize([item.title, item.summary, item.metric, item.label].join(" ")),
    );
    const matchedTokenCount = promptTokens.filter(
      (token) =>
        roomTokens.includes(token) ||
        keywordTokens.includes(token) ||
        topicTokens.includes(token),
    ).length;

    return {
      roomSlug,
      roomTitle: room.title,
      roomQuestion: roomData.question,
      score: keywordHits * 3 + overlap * 2 + topicMatch.score,
      topicMatch,
      matchedKeywords,
      matchedTokenCount,
    };
  });

  const [bestRoom, secondRoom] = [...roomMatches].sort((left, right) => right.score - left.score);
  const bestScore = bestRoom?.score ?? 0;
  const secondScore = secondRoom?.score ?? 0;
  const highSalience = isHighSaliencePrompt(promptTokens);
  const promptCoverage =
    bestRoom && promptTokens.length
      ? bestRoom.matchedTokenCount / promptTokens.length
      : 0;
  const useExistingRoom =
    Boolean(bestRoom) &&
    (
      (bestScore >= 10 && bestRoom.matchedTokenCount >= 2) ||
      (bestScore >= 6 &&
        (bestRoom.topicMatch.score >= 2 || bestRoom.matchedKeywords.length >= 2) &&
        bestRoom.matchedTokenCount >= 2 &&
        promptCoverage >= 0.22) ||
      (bestScore >= 4 &&
        bestScore >= secondScore + 2 &&
        (bestRoom.topicMatch.score >= 4 || bestRoom.matchedKeywords.length >= 3) &&
        bestRoom.matchedTokenCount >= 2 &&
        promptCoverage >= 0.28)
    );
  const strongTopicFit =
    Boolean(bestRoom?.topicMatch.topicId) &&
    Boolean(bestRoom) &&
    (bestRoom.topicMatch.topicOverlapCount ?? 0) >= 2;

  if (!bestRoom || !useExistingRoom) {
    const closestRoom =
      bestRoom && bestRoom.score > 0
        ? `The closest current room is ${bestRoom.roomTitle}, but the overlap is still too weak to place this there confidently.`
        : "None of the current rooms show enough overlap to place this idea confidently.";

    return {
      routeKind: "new-room-draft",
      roomTitle: "Room candidate",
      routeConfidence: bestScore >= 3 ? "medium" : "low",
      fitSummary: highSalience
        ? "This looks like a real public issue, but the current room map does not yet hold it cleanly. Civic Logos is opening a room candidate instead of minimizing it with a forced fit."
        : "The current room map does not cleanly absorb this question yet, so Civic Logos is opening a room candidate instead of forcing a weak fit.",
      suggestedCentralQuestion: buildQuestionFromPrompt(prompt),
      suggestedTopicTitle: buildFallbackTopicTitle(prompt),
      suggestedTopicSummary: buildFallbackTopicSummary(prompt),
      suggestedFirstQuestions: [
        "What is the core public question here?",
        "Which stakeholders and tradeoffs would this room have to hold together?",
        highSalience
          ? "What institutions, incentives, or power relationships may be distorting this issue?"
          : "What current institutions, incentives, or technologies are driving the issue?",
      ],
      whyNotExistingRooms: highSalience
        ? `${closestRoom} This does not mean the issue is minor. It means the current room map is still incomplete for this kind of question.`
        : closestRoom,
    };
  }

  const matchedTopic =
    bestRoom.topicMatch.score > 0
      ? bestRoom.topicMatch
      : undefined;
  const matchedKeywordSummary = bestRoom.matchedKeywords.length
    ? `It overlaps most strongly with ${bestRoom.matchedKeywords.slice(0, 3).join(", ")}.`
    : `It is closer to ${bestRoom.roomTitle} than the other current rooms.`;

  if (!strongTopicFit) {
    return {
      routeKind: "room-topic-draft",
      roomSlug: bestRoom.roomSlug,
      roomTitle: bestRoom.roomTitle,
      topicId: matchedTopic?.topicId,
      topicTitle: matchedTopic?.topicTitle,
      routeConfidence:
        bestScore >= 10 || bestRoom.matchedKeywords.length >= 3 ? "high" : "medium",
      fitSummary:
        `This idea clearly belongs inside ${bestRoom.roomTitle}, but the current live topic cards do not absorb it cleanly enough yet. Civic Logos should open a durable draft topic inside the room instead of forcing the fit into an existing card.`,
      suggestedCentralQuestion: buildQuestionFromPrompt(prompt),
      suggestedTopicTitle: buildFallbackTopicTitle(prompt),
      suggestedTopicSummary:
        matchedTopic
          ? `This issue belongs inside ${bestRoom.roomTitle}, but it needs a sharper draft topic than the current live card ${matchedTopic.title}. ${matchedKeywordSummary}`
          : `This issue belongs inside ${bestRoom.roomTitle}, but the room still needs a dedicated draft topic to hold it cleanly. ${matchedKeywordSummary}`,
      suggestedFirstQuestions: [
        "What is the cleanest central question for this draft topic inside the room?",
        "How does this pressure or complicate the room's current live cards?",
        "What objection, evidence, or implementation detail would most shape this draft topic first?",
      ],
      whyNotExistingRooms: `The room map judged ${bestRoom.roomTitle} to be the right host room, but the current live topic cards still leave this idea under-modeled.`,
    };
  }

  return {
    routeKind: "existing-room",
    roomSlug: bestRoom.roomSlug,
    roomTitle: bestRoom.roomTitle,
    topicId: matchedTopic?.topicId,
    topicTitle: matchedTopic?.topicTitle,
    routeConfidence: bestScore >= 10 ? "high" : bestScore >= 6 ? "medium" : "low",
    fitSummary: matchedTopic
      ? `This idea appears closest to ${bestRoom.roomTitle}, especially the topic direction ${matchedTopic.title}. ${matchedKeywordSummary}`
      : `This idea appears closest to ${bestRoom.roomTitle}. ${matchedKeywordSummary}`,
    suggestedCentralQuestion: bestRoom.roomQuestion,
    suggestedTopicTitle: matchedTopic?.title ?? buildFallbackTopicTitle(prompt),
    suggestedTopicSummary:
      matchedTopic?.summary ??
      `This question appears to belong inside ${bestRoom.roomTitle}, but the room still needs a sharper topic card to absorb it cleanly.`,
    suggestedFirstQuestions: [
      "Which existing claim, objection, or open question in this room does the idea pressure most directly?",
      "What is the strongest competing interpretation of the issue?",
      "What evidence or implementation detail would most change the current read?",
    ],
    whyNotExistingRooms: `The room map judged ${bestRoom.roomTitle} to be a cleaner fit than the other active rooms.`,
  };
}

function extractOpenAIText(response: OpenAIResponse) {
  const parts =
    response.output
      ?.flatMap((item) =>
        item.type === "message"
          ? item.content?.flatMap((content) =>
              content.type === "output_text" && content.text ? [content.text] : [],
            ) ?? []
          : [],
      )
      .filter(Boolean) ?? [];

  return parts.join("");
}

function tryParseRoutingResult(text: string): RoutingSchemaResult | null {
  const candidates = new Set<string>();
  const trimmed = text.trim();

  if (trimmed) {
    candidates.add(trimmed);
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    candidates.add(fencedMatch[1].trim());
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    candidates.add(trimmed.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as RoutingSchemaResult;
      if (
        parsed &&
        typeof parsed.route_kind === "string" &&
        typeof parsed.room_slug === "string" &&
        typeof parsed.fit_summary === "string"
      ) {
        return parsed;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function isRoomSlug(value: string): value is IssueRoomSlug {
  return roomSlugOptions.includes(value as IssueRoomSlug);
}

function parseRoutingResult(
  result: RoutingSchemaResult,
): Omit<ProviderHomeIntakeRouting, "provider" | "state" | "model"> {
  const routeKind = result.route_kind;
  const roomSlug =
    routeKind !== "new-room-draft" && isRoomSlug(result.room_slug)
      ? result.room_slug
      : undefined;
  const roomTitle = roomSlug
    ? issueRooms[roomSlug].title
    : routeKind === "new-room-draft"
      ? "Room candidate"
      : "Current room";
  const topicCard =
    roomSlug && result.topic_id ? getRoomTopicCard(roomSlug, result.topic_id) : undefined;

  return {
    routeKind,
    roomSlug,
    roomTitle,
    topicId: topicCard?.id,
    topicTitle: topicCard?.title,
    routeConfidence: result.route_confidence,
    fitSummary: result.fit_summary,
    suggestedCentralQuestion: result.suggested_central_question,
    suggestedTopicTitle: result.suggested_topic_title,
    suggestedTopicSummary: result.suggested_topic_summary,
    suggestedFirstQuestions: result.suggested_first_questions,
    whyNotExistingRooms: result.why_not_existing_rooms,
  };
}

async function classifyWithOpenAI(prompt: string): Promise<ProviderHomeIntakeRouting> {
  const config = getOpenAIProviderConfig();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || !config.configured) {
    return { provider: "openai", state: "unavailable" };
  }

  const model = config.model;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        store: false,
        temperature: 0.2,
        max_output_tokens: 650,
        instructions:
          "You are a routing reader for Civic Logos. Read a user's question or idea and decide whether it belongs in one of the current rooms or whether it needs a new room candidate. You are not writing a manifesto. You are mapping the idea into the cleanest current public reasoning object.",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: buildRoutingPrompt(prompt),
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "civic_logos_home_intake_routing",
            strict: true,
            schema: intakeSchema,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI home intake failed", errorText);
      return {
        provider: "openai",
        state: "error",
        model,
        errorMessage: "OpenAI could not route this prompt.",
      };
    }

    const payload = (await response.json()) as OpenAIResponse;
    const outputText = extractOpenAIText(payload);

    if (!outputText) {
      return {
        provider: "openai",
        state: "error",
        model,
        errorMessage: "OpenAI returned no routing output.",
      };
    }

    const parsed = tryParseRoutingResult(outputText);

    if (!parsed) {
      return {
        provider: "openai",
        state: "error",
        model,
        errorMessage: "OpenAI returned routing output that could not be parsed.",
      };
    }

    return {
      provider: "openai",
      state: "completed",
      model,
      ...parseRoutingResult(parsed),
    };
  } catch (error) {
    console.error("OpenAI home intake error", error);
    return {
      provider: "openai",
      state: "error",
      model,
      errorMessage: "OpenAI could not route this prompt.",
    };
  }
}

async function classifyWithAnthropic(prompt: string): Promise<ProviderHomeIntakeRouting> {
  const config = getAnthropicProviderConfig();
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || !config.configured) {
    return { provider: "anthropic", state: "unavailable" };
  }

  const model = config.model;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 650,
        system:
          "You are a routing reader for Civic Logos. Read a user's question or idea and decide whether it belongs in one of the current rooms or whether it needs a new room candidate. Return only JSON that matches the requested schema.",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: [
                  "Return only JSON with this schema:",
                  JSON.stringify(intakeSchema, null, 2),
                  "",
                  buildRoutingPrompt(prompt),
                ].join("\n"),
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic home intake failed", errorText);
      return {
        provider: "anthropic",
        state: "error",
        model,
        errorMessage: "Claude could not route this prompt.",
      };
    }

    const payload = (await response.json()) as AnthropicResponse;
    const outputText =
      payload.content
        ?.flatMap((item) =>
          item.type === "text" && item.text ? [item.text] : [],
        )
        .join("") ?? "";

    if (!outputText) {
      return {
        provider: "anthropic",
        state: "error",
        model,
        errorMessage: "Claude returned no routing output.",
      };
    }

    const parsed = tryParseRoutingResult(outputText);

    if (!parsed) {
      return {
        provider: "anthropic",
        state: "error",
        model,
        errorMessage: "Claude returned routing output that could not be parsed.",
      };
    }

    return {
      provider: "anthropic",
      state: "completed",
      model,
      ...parseRoutingResult(parsed),
    };
  } catch (error) {
    console.error("Anthropic home intake error", error);
    return {
      provider: "anthropic",
      state: "error",
      model,
      errorMessage: "Claude could not route this prompt.",
    };
  }
}

export async function buildHomeIntakeRouting(
  prompt: string,
): Promise<HomeIntakeRouting> {
  const domainGapRouting = buildPhysicsFoundationsRouting(prompt);
  const heuristicRouting = domainGapRouting ?? buildHeuristicRouting(prompt);
  const providers = await Promise.all([
    classifyWithOpenAI(prompt),
    classifyWithAnthropic(prompt),
  ]);
  const completedProviders = providers.filter((item) => item.state === "completed");
  const primaryProvider = completedProviders[0];

  if (!providers.length || providers.every((item) => item.state === "unavailable")) {
    return {
      state: "partial",
      ...heuristicRouting,
      providers,
    };
  }

  if (!completedProviders.length || !primaryProvider) {
    return {
      state: "partial",
      ...heuristicRouting,
      providers,
    };
  }

  if (
    primaryProvider.routeKind === "existing-room" &&
    heuristicRouting.routeKind === "room-topic-draft" &&
    heuristicRouting.roomSlug === primaryProvider.roomSlug
  ) {
    return {
      state: completedProviders.length === providers.length ? "completed" : "partial",
      ...heuristicRouting,
      providers,
    };
  }

  if (domainGapRouting && primaryProvider.routeKind !== "new-room-draft") {
    return {
      state: completedProviders.length === providers.length ? "completed" : "partial",
      ...domainGapRouting,
      providers,
    };
  }

  return {
    state: completedProviders.length === providers.length ? "completed" : "partial",
    routeKind: primaryProvider.routeKind,
    roomSlug: primaryProvider.roomSlug,
    roomTitle: primaryProvider.roomTitle,
    topicId: primaryProvider.topicId,
    topicTitle: primaryProvider.topicTitle,
    routeConfidence: primaryProvider.routeConfidence,
    fitSummary: primaryProvider.fitSummary,
    suggestedCentralQuestion: primaryProvider.suggestedCentralQuestion,
    suggestedTopicTitle: primaryProvider.suggestedTopicTitle,
    suggestedTopicSummary: primaryProvider.suggestedTopicSummary,
    suggestedFirstQuestions: primaryProvider.suggestedFirstQuestions,
    whyNotExistingRooms: primaryProvider.whyNotExistingRooms,
    providers,
  };
}
