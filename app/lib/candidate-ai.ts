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
} from "./candidate-types";
import { getRoomTopicCard, type IssueRoomSlug } from "./civic-logos";
import { debateLaneOptions, reviewTargetKindOptions, type DebateLane } from "./reasoning-types";

type CandidateAiDraft = {
  reply: string;
  normalized_title: string;
  normalized_body: string;
  proposed_lane: DebateLane;
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
      enum: [...debateLaneOptions],
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
  roomSlug: IssueRoomSlug;
  topicId: string;
  rawUserText: string;
}) {
  const card = getRoomTopicCard(args.roomSlug, args.topicId);

  if (!card) {
    throw new Error("Candidate AI could not load the live topic card.");
  }

  return JSON.stringify(
    {
      instructions: [
        "You are a Civic Logos pre-ledger candidate structurer.",
        "Convert one user message into a structured candidate record for human review.",
        "Do not claim the public record changed.",
        "Do not create a revision, synthesis change, or public contribution.",
        "Use the existing healthcare topic only. If the message is coherent but unsourced, preserve it as unsourced but coherent instead of pretending it has evidence.",
        "Prefer the smallest honest record that a human reviewer can later promote, reject, or archive.",
        "Treat savings-capture concerns as assumption pressure, not proof.",
      ],
      current_topic: {
        room: args.roomSlug,
        topicId: args.topicId,
        title: card.title,
        thesis: card.thesis,
        currentRead: card.currentRead,
        assumptions: card.assumptions,
        openQuestions: card.openQuestions,
        economicDelta: card.economicDelta,
        stakeholders: card.stakeholders,
      },
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

function hasSavingsCaptureSignal(rawUserText: string) {
  const lower = rawUserText.trim().toLowerCase();

  return (
    lower.includes("capture") ||
    lower.includes("captured") ||
    (lower.includes("savings") && lower.includes("patients")) ||
    lower.includes("institutions")
  );
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

function buildGenericHeuristicDraft(): CandidateAiDraft {
  return {
    reply:
      "I turned this into a healthcare-topic candidate for human review. It remains internal, unsourced, and non-public until a reviewer decides whether to promote it.",
    normalized_title: "Healthcare topic pressure identified from /ask",
    normalized_body:
      "This candidate captures a coherent pressure on the live healthcare topic card. It remains an internal pre-ledger candidate until a human reviewer decides whether it belongs in the public contribution queue.",
    proposed_lane: "nuance",
    proposed_attachment_target_kind: "claim",
    proposed_attachment_target_label: "Visible healthcare topic synthesis",
    scale_map: [
      "room:healthcare",
      "topic:topic-001",
      "claim:visible-healthcare-topic-synthesis",
    ],
    evidence_status: "unsourced but coherent",
    evidence_anchor: "Visible healthcare topic synthesis",
    evidential_distance: "moderate",
    impact_field: ["patients", "providers"],
    internal_ai_note:
      "Fallback heuristic preserved the message as coherent healthcare-topic pressure pending human review.",
    limitations: [
      "Fallback heuristic used because a configured AI candidate structurer was unavailable.",
      "The candidate remains pre-ledger until human review promotes it.",
    ],
  };
}

function canonicalizeCandidateDraft(args: {
  rawUserText: string;
  draft: CandidateAiDraft;
}) {
  if (hasSavingsCaptureSignal(args.rawUserText)) {
    return buildSavingsCaptureDraft();
  }

  return args.draft;
}

async function structureWithOpenAI(args: {
  roomSlug: IssueRoomSlug;
  topicId: string;
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
  roomSlug: IssueRoomSlug;
  topicId: string;
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

function buildHeuristicCandidate(rawUserText: string): CandidateDraftResult {
  const draft = hasSavingsCaptureSignal(rawUserText)
    ? buildSavingsCaptureDraft()
    : buildGenericHeuristicDraft();

  return {
    draft,
    note: buildNote("heuristic", undefined, draft),
  };
}

export async function buildCandidateSuggestion(args: {
  roomSlug: IssueRoomSlug;
  topicId: string;
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

  return buildHeuristicCandidate(args.rawUserText);
}
