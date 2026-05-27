import {
  getAnthropicProviderConfig,
  getOpenAIProviderConfig,
} from "./ai-provider-config";
import type {
  CandidateAiProvider,
  CandidateAttachmentTarget,
  CandidateEvidentialDistance,
  CandidateEvidenceStatus,
  CandidateInternalAiNote,
  CandidateLane,
} from "./candidate-types";
import { candidateLaneOptions } from "./candidate-types";
import type { AskCandidateRoute } from "./ask-routing";
import {
  hasFoundationalPhysicsSignal,
  hasHealthcareAskSignal,
  hasSavingsCaptureSignal,
  hasSymbolicPhysicsSignal,
} from "./ask-intake-signals";
import { getRoomTopicCard } from "./civic-logos";
import { reviewTargetKindOptions } from "./reasoning-types";

type CandidateAiDraft = {
  reply: string;
  normalized_title: string;
  normalized_body: string;
  proposed_lane: CandidateLane;
  proposed_attachment_target_kind: CandidateAttachmentTarget["kind"];
  proposed_attachment_target_label: string;
  scale_map: string[];
  evidence_status: CandidateEvidenceStatus;
  evidence_anchor: string;
  evidential_distance: CandidateEvidentialDistance;
  impact_field: string[];
  internal_ai_note: string;
  limitations: string[];
};

type OpenAIResponse = {
  output_text?: string;
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

type CandidateDraftResult = {
  draft: CandidateAiDraft;
  note: CandidateInternalAiNote;
};

const candidateSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "reply",
    "normalized_title",
    "normalized_body",
    "proposed_lane",
    "proposed_attachment_target_kind",
    "proposed_attachment_target_label",
    "scale_map",
    "evidence_status",
    "evidence_anchor",
    "evidential_distance",
    "impact_field",
    "internal_ai_note",
    "limitations",
  ],
  properties: {
    reply: { type: "string" },
    normalized_title: { type: "string" },
    normalized_body: { type: "string" },
    proposed_lane: {
      type: "string",
      enum: [...candidateLaneOptions],
    },
    proposed_attachment_target_kind: {
      type: "string",
      enum: [...reviewTargetKindOptions],
    },
    proposed_attachment_target_label: { type: "string" },
    scale_map: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
    },
    evidence_status: {
      type: "string",
      enum: [
        "unsourced but coherent",
        "symbolic/mathematical proposal, not empirical evidence",
        "source-linked",
        "document-backed",
        "unsupported",
      ],
    },
    evidence_anchor: { type: "string" },
    evidential_distance: {
      type: "string",
      enum: ["direct", "near", "moderate", "far"],
    },
    impact_field: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
    },
    internal_ai_note: { type: "string" },
    limitations: {
      type: "array",
      items: { type: "string" },
    },
  },
} as const;

function buildCandidatePrompt(args: {
  routing: AskCandidateRoute;
  rawUserText: string;
}) {
  const routeNote =
    args.routing.routeType === "existing-topic"
      ? (() => {
          const card = getRoomTopicCard(args.routing.roomId, args.routing.topicId);

          if (!card) {
            throw new Error("Candidate AI could not load the routed live topic card.");
          }

          return {
            route: {
              state: "existing-topic",
              room: args.routing.roomId,
              topicId: args.routing.topicId,
              title: card.title,
              fitSummary: args.routing.fitSummary,
            },
            current_topic: {
              room: args.routing.roomId,
              topicId: args.routing.topicId,
              title: card.title,
              thesis: card.thesis,
              currentRead: card.currentRead,
              assumptions: card.assumptions,
              openQuestions: card.openQuestions,
              economicDelta: card.economicDelta,
              stakeholders: card.stakeholders,
            },
          };
        })()
      : {
          route: {
            state: "unrouted",
            room: args.routing.roomId,
            topicId: args.routing.topicId,
            title: args.routing.topicTitle,
            fitSummary: args.routing.fitSummary,
          },
          current_topic: null,
        };

  return JSON.stringify(
    {
      instructions: [
        "You are a Civic Logos pre-ledger candidate structurer.",
        "Convert one user message into a structured internal candidate record for human review.",
        "Do not claim the public record changed.",
        "Do not create a revision, synthesis change, or public contribution.",
        "If the message is coherent but unsourced, preserve it honestly instead of inventing evidence.",
        "If the route is unrouted, keep the candidate internal and scoped for maintainer routing rather than pretending it already belongs to a public card.",
        "Prefer the smallest honest record that a human reviewer can later promote, reject, archive, or route.",
        "Treat symbolic or mathematical reformulations as proposals, not empirical evidence.",
      ],
      ...routeNote,
      raw_user_text: args.rawUserText,
      reminder:
        "Return only JSON. The candidate is internal and starts with actual card change false by default because human review has not promoted it.",
    },
    null,
    2,
  );
}

function collectTextValues(value: unknown): string[] {
  if (!value || typeof value !== "object") {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectTextValues);
  }

  return Object.entries(value).flatMap(([key, child]) => {
    if ((key === "text" || key === "output_text") && typeof child === "string") {
      return [child];
    }

    if (child && typeof child === "object") {
      return collectTextValues(child);
    }

    return [];
  });
}

function extractOpenAIText(response: OpenAIResponse) {
  const directOutput = response.output_text ? [response.output_text] : [];
  const messageOutput =
    response.output?.flatMap((item) =>
      item.type === "message"
        ? item.content?.flatMap((content) =>
            content.type === "output_text" && content.text ? [content.text] : [],
          ) ?? []
        : [],
    ) ?? [];
  const fallbackOutput = collectTextValues(response);

  return [...directOutput, ...messageOutput, ...fallbackOutput]
    .filter(Boolean)
    .join("")
    .trim();
}

function parseModelJsonText(text: string): CandidateAiDraft {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const jsonStart = withoutFence.indexOf("{");
  const jsonEnd = withoutFence.lastIndexOf("}");
  const candidate =
    jsonStart >= 0 && jsonEnd > jsonStart
      ? withoutFence.slice(jsonStart, jsonEnd + 1)
      : withoutFence;

  return JSON.parse(candidate) as CandidateAiDraft;
}

function buildNote(
  provider: CandidateAiProvider,
  model: string | undefined,
  draft: CandidateAiDraft,
): CandidateInternalAiNote {
  return {
    provider,
    model,
    summary: draft.internal_ai_note.trim(),
    shortReply: draft.reply.trim(),
    limitations: draft.limitations.length
      ? draft.limitations
      : [
          "This is an internal candidate structuring pass, not a public ledger decision.",
        ],
    createdAt: new Date().toISOString(),
  };
}

function buildSavingsCaptureDraft(): CandidateAiDraft {
  return {
    reply:
      "This reads like a coherent challenge to the healthcare card's savings-capture assumption. I structured it as an internal candidate for human review, and nothing has been written into the public ledger.",
    normalized_title: "Institutions may capture savings before patients benefit",
    normalized_body:
      "This candidate challenges the healthcare card's savings-capture assumption. It argues that even if administrative simplification produces nominal savings, institutions may retain those gains instead of allowing patients to benefit directly. The claim is coherent enough to preserve for review, but it remains unsourced until evidence is attached.",
    proposed_lane: "economic-assumption-challenge",
    proposed_attachment_target_kind: "assumption",
    proposed_attachment_target_label: "Savings-capture assumption",
    scale_map: [
      "room:healthcare",
      "topic:topic-001",
      "assumption:savings-capture",
      "economic-delta",
    ],
    evidence_status: "unsourced but coherent",
    evidence_anchor:
      "Savings capture must be evidenced before net savings are treated as established",
    evidential_distance: "moderate",
    impact_field: ["patients", "providers", "insurers", "employers"],
    internal_ai_note:
      "Structured as an economic assumption challenge against the healthcare card's savings-capture assumption. The pressure is coherent, but evidence is still missing.",
    limitations: [
      "No source or document was attached to the message.",
      "The candidate remains pre-ledger until human review promotes it.",
    ],
  };
}

function buildFoundationalPhysicsDraft(args: {
  rawUserText: string;
  routedToExistingTopic: boolean;
}): CandidateAiDraft {
  const proposedLane: CandidateLane = hasSymbolicPhysicsSignal(args.rawUserText)
    ? "symbolic_interpretation"
    : "proposed_reformulation";
  const routingScaleMap = args.routedToExistingTopic
    ? [
        "room:physics-foundations",
        "topic:topic-001",
        "claim:reformulation-review-boundary",
      ]
    : [
        "room:unrouted",
        "topic:unrouted",
        "routing:needs-maintainer-routing",
        "domain:foundational-physics",
      ];

  return {
    reply:
      args.routedToExistingTopic
        ? "This reads like a symbolic or reformulation-style pressure on the Physics Foundations card. I structured it as an internal candidate for human review, and nothing has been written into the public ledger."
        : "This reads like a foundational-physics proposal, but Civic Logos could not attach it to a topic confidently enough for public routing. I saved it as an internal candidate needing maintainer routing, and nothing has been written into the public ledger.",
    normalized_title: "Symbolic reformulation pressure on physics foundations",
    normalized_body:
      "This candidate preserves a symbolic or mathematical proposal aimed at foundational physics. The message appears to offer a reformulation or interpretive chain rather than empirical evidence. It should be reviewed for whether it changes notation, assumptions, predictions, or physical interpretation before any public attachment is considered.",
    proposed_lane: proposedLane,
    proposed_attachment_target_kind: "claim",
    proposed_attachment_target_label:
      "Distinguish an equivalent reformulation from a new physical claim",
    scale_map: routingScaleMap,
    evidence_status: "symbolic/mathematical proposal, not empirical evidence",
    evidence_anchor:
      "Clarify what changes notation, assumptions, predictions, or empirical commitments before treating the proposal as synthesis pressure",
    evidential_distance: "far",
    impact_field: [
      "physicists",
      "physics students",
      "reviewers",
      "public readers",
    ],
    internal_ai_note:
      "Structured as a foundational-physics reformulation candidate. The message should be reviewed as symbolic pressure first, not as empirical support or a public-record change.",
    limitations: [
      "The message does not supply empirical evidence or a document-backed source.",
      "The candidate remains pre-ledger until human review promotes it.",
    ],
  };
}

function buildUnroutedDraft(rawUserText: string): CandidateAiDraft {
  return {
    reply:
      "I preserved this as an internal candidate needing maintainer routing because Civic Logos could not confidently attach it to an existing topic. Nothing has been written into the public ledger.",
    normalized_title: "Internal candidate awaiting maintainer routing",
    normalized_body: `This candidate preserves a coherent pressure or concern from /ask, but it is not yet attached to an existing topic. The current message was saved for maintainer routing instead of being forced into the wrong public card: ${rawUserText.trim()}`,
    proposed_lane: "nuance",
    proposed_attachment_target_kind: "unclear",
    proposed_attachment_target_label: "Maintainer routing required",
    scale_map: [
      "room:unrouted",
      "topic:unrouted",
      "routing:needs-maintainer-routing",
    ],
    evidence_status: "unsourced but coherent",
    evidence_anchor: "No confident existing-topic attachment was available",
    evidential_distance: "far",
    impact_field: ["maintainer review", "topic routing"],
    internal_ai_note:
      "Structured as an unrouted candidate because the message did not match an existing live topic strongly enough.",
    limitations: [
      "No existing topic was selected confidently enough for attachment.",
      "The candidate remains pre-ledger until a maintainer routes or rejects it.",
    ],
  };
}

function buildGenericHeuristicDraft(route: AskCandidateRoute): CandidateAiDraft {
  if (route.routeType === "existing-topic") {
    return {
      reply:
        `I turned this into an internal candidate attached to ${route.roomId} / ${route.topicId} for human review. It remains unsourced, non-public, and does not change the ledger on its own.`,
      normalized_title: `${route.topicTitle} pressure identified from /ask`,
      normalized_body:
        `This candidate captures a coherent pressure on the existing topic ${route.topicTitle}. It remains an internal pre-ledger candidate until a human reviewer decides whether it belongs in the public contribution queue.`,
      proposed_lane: "nuance",
      proposed_attachment_target_kind: "claim",
      proposed_attachment_target_label: `${route.topicTitle} synthesis pressure`,
      scale_map: [
        `room:${route.roomId}`,
        `topic:${route.topicId}`,
        `claim:${route.topicId}-synthesis-pressure`,
      ],
      evidence_status: "unsourced but coherent",
      evidence_anchor: route.topicTitle,
      evidential_distance: "moderate",
      impact_field:
        route.roomId === "physics-foundations"
          ? ["physicists", "physics students", "reviewers"]
          : route.roomId === "healthcare"
            ? ["patients", "providers"]
            : ["public readers", "maintainer review"],
      internal_ai_note:
        `Fallback heuristic preserved the message as coherent pressure on ${route.roomId} / ${route.topicId} pending human review.`,
      limitations: [
        "Fallback heuristic used because a configured AI candidate structurer was unavailable.",
        "The candidate remains pre-ledger until human review promotes it.",
      ],
    };
  }

  return {
    reply:
      "I preserved this as an internal unrouted candidate for human review. It remains internal, unsourced, and non-public until a maintainer decides where it belongs.",
    normalized_title: "Internal unrouted pressure identified from /ask",
    normalized_body:
      "This candidate captures a coherent pressure from /ask, but Civic Logos could not confidently attach it to an existing topic. It remains an internal pre-ledger candidate until a maintainer routes it or decides it should be rejected or archived.",
    proposed_lane: "nuance",
    proposed_attachment_target_kind: "unclear",
    proposed_attachment_target_label: "Maintainer routing required",
    scale_map: [
      "room:unrouted",
      "topic:unrouted",
      "routing:needs-maintainer-routing",
    ],
    evidence_status: "unsourced but coherent",
    evidence_anchor: "No confident existing-topic attachment was available",
    evidential_distance: "far",
    impact_field: ["maintainer review", "topic routing"],
    internal_ai_note:
      "Fallback heuristic preserved the message as coherent internal pressure pending maintainer routing.",
    limitations: [
      "Fallback heuristic used because a configured AI candidate structurer was unavailable.",
      "The candidate remains pre-ledger until a maintainer routes, promotes, rejects, or archives it.",
    ],
  };
}

function canonicalizeCandidateDraft(args: {
  route: AskCandidateRoute;
  rawUserText: string;
  draft: CandidateAiDraft;
}) {
  if (
    args.route.routeType === "existing-topic" &&
    args.route.roomId === "healthcare" &&
    hasSavingsCaptureSignal(args.rawUserText)
  ) {
    return buildSavingsCaptureDraft();
  }

  if (hasFoundationalPhysicsSignal(args.rawUserText)) {
    return buildFoundationalPhysicsDraft({
      rawUserText: args.rawUserText,
      routedToExistingTopic:
        args.route.routeType === "existing-topic" &&
        args.route.roomId === "physics-foundations",
    });
  }

  if (
    args.route.routeType === "unrouted" &&
    !hasHealthcareAskSignal(args.rawUserText)
  ) {
    return buildUnroutedDraft(args.rawUserText);
  }

  return args.draft;
}

async function structureWithOpenAI(args: {
  routing: AskCandidateRoute;
  rawUserText: string;
}): Promise<CandidateDraftResult | null> {
  const config = getOpenAIProviderConfig();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || !config.configured) {
    return null;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        store: false,
        temperature: 0.2,
        max_output_tokens: 900,
        instructions:
          "You are a Civic Logos pre-ledger candidate structurer. You may help create internal candidate records and internal AI notes only. You may not create a public contribution, revision event, synthesis change, or any direct public-ledger mutation.",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: buildCandidatePrompt(args),
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "civic_logos_candidate_structuring",
            strict: true,
            schema: candidateSchema,
          },
        },
      }),
    });

    if (!response.ok) {
      console.error("OpenAI candidate structuring failed", await response.text());
      return null;
    }

    const payload = (await response.json()) as OpenAIResponse;
    const outputText = extractOpenAIText(payload);

    if (!outputText) {
      return null;
    }

    const draft = parseModelJsonText(outputText);
    const canonicalDraft = canonicalizeCandidateDraft({
      route: args.routing,
      rawUserText: args.rawUserText,
      draft,
    });

    return {
      draft: canonicalDraft,
      note: buildNote("openai", config.model, canonicalDraft),
    };
  } catch (error) {
    console.error("OpenAI candidate structuring error", error);
    return null;
  }
}

async function structureWithAnthropic(args: {
  routing: AskCandidateRoute;
  rawUserText: string;
}): Promise<CandidateDraftResult | null> {
  const config = getAnthropicProviderConfig();
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || !config.configured) {
    return null;
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 900,
        system:
          "You are a Civic Logos pre-ledger candidate structurer. Return only JSON that matches the requested schema. You may help create internal candidate records and internal AI notes only.",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: [
                  "Return only JSON with this schema:",
                  JSON.stringify(candidateSchema, null, 2),
                  "",
                  buildCandidatePrompt(args),
                ].join("\n"),
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("Anthropic candidate structuring failed", await response.text());
      return null;
    }

    const payload = (await response.json()) as AnthropicResponse;
    const outputText =
      payload.content
        ?.flatMap((item) =>
          item.type === "text" && item.text ? [item.text] : [],
        )
        .join("")
        .trim() ?? "";

    if (!outputText) {
      return null;
    }

    const draft = parseModelJsonText(outputText);
    const canonicalDraft = canonicalizeCandidateDraft({
      route: args.routing,
      rawUserText: args.rawUserText,
      draft,
    });

    return {
      draft: canonicalDraft,
      note: buildNote("anthropic", config.model, canonicalDraft),
    };
  } catch (error) {
    console.error("Anthropic candidate structuring error", error);
    return null;
  }
}

function buildHeuristicCandidate(args: {
  routing: AskCandidateRoute;
  rawUserText: string;
}): CandidateDraftResult {
  const canonicalDraft = canonicalizeCandidateDraft({
    route: args.routing,
    rawUserText: args.rawUserText,
    draft: buildGenericHeuristicDraft(args.routing),
  });

  return {
    draft: canonicalDraft,
    note: buildNote("heuristic", undefined, canonicalDraft),
  };
}

export async function buildCandidateSuggestion(args: {
  routing: AskCandidateRoute;
  rawUserText: string;
}) {
  const openAiResult = await structureWithOpenAI(args);

  if (openAiResult) {
    return openAiResult;
  }

  const anthropicResult = await structureWithAnthropic(args);

  if (anthropicResult) {
    return anthropicResult;
  }

  return buildHeuristicCandidate(args);
}
