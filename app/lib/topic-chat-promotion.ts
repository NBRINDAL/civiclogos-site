import {
  getAnthropicProviderConfig,
  getOpenAIProviderConfig,
  type AiProviderName,
} from "./ai-provider-config";
import type { DebateLane, ReviewTargetKind } from "./reasoning-types";

type TopicChatPromotionDecision = "obvious" | "review" | "none";

type TopicChatPromotionSchemaResult = {
  decision: TopicChatPromotionDecision;
  lane: DebateLane;
  title: string;
  body: string;
  assignment_kind:
    | ReviewTargetKind
    | "unclear";
  assignment_label: string;
  changed_synthesis: "yes" | "no" | "unclear";
  public_record_note: string;
  reviewer_note: string;
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

export type TopicChatPromotionProposal = {
  provider: AiProviderName;
  model?: string;
  decision: TopicChatPromotionDecision;
  lane: DebateLane;
  title: string;
  body: string;
  assignmentKind?: ReviewTargetKind;
  assignmentLabel?: string;
  changedSynthesis?: boolean | null;
  publicRecordNote?: string;
  reviewerNote?: string;
};

const promotionSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "decision",
    "lane",
    "title",
    "body",
    "assignment_kind",
    "assignment_label",
    "changed_synthesis",
    "public_record_note",
    "reviewer_note",
  ],
  properties: {
    decision: {
      type: "string",
      enum: ["obvious", "review", "none"],
    },
    lane: {
      type: "string",
      enum: [
        "support",
        "objection",
        "evidence",
        "correction",
        "nuance",
        "implementation-concern",
        "economic-assumption-challenge",
        "alternate-topic",
        "personal-perspective",
      ],
    },
    title: { type: "string" },
    body: { type: "string" },
    assignment_kind: {
      type: "string",
      enum: ["claim", "objection", "evidence", "assumption", "open-question", "unclear"],
    },
    assignment_label: { type: "string" },
    changed_synthesis: {
      type: "string",
      enum: ["yes", "no", "unclear"],
    },
    public_record_note: { type: "string" },
    reviewer_note: { type: "string" },
  },
} as const;

function extractOpenAiText(response: OpenAIResponse) {
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

  return parts.join("").trim();
}

function extractAnthropicText(response: AnthropicResponse) {
  return (
    response.content
      ?.flatMap((item) =>
        item.type === "text" && item.text ? [item.text] : [],
      )
      .join("")
      .trim() ?? ""
  );
}

function extractJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return "";
  }

  return text.slice(start, end + 1);
}

function normalizeProposal(
  provider: AiProviderName,
  model: string | undefined,
  result: TopicChatPromotionSchemaResult,
): TopicChatPromotionProposal {
  return {
    provider,
    model,
    decision: result.decision,
    lane: result.lane,
    title: result.title.trim(),
    body: result.body.trim(),
    assignmentKind:
      result.assignment_kind === "unclear" ? undefined : result.assignment_kind,
    assignmentLabel: result.assignment_label.trim() || undefined,
    changedSynthesis:
      result.changed_synthesis === "yes"
        ? true
        : result.changed_synthesis === "no"
          ? false
          : null,
    publicRecordNote: result.public_record_note.trim() || undefined,
    reviewerNote: result.reviewer_note.trim() || undefined,
  };
}

function buildPromotionPrompt(args: {
  question: string;
  answer: string;
  context: string;
}) {
  return [
    "Decide whether this AI answer should become part of the Civic Logos topic record.",
    "Most chat exchanges should remain exploratory and return decision=none.",
    "Use decision=obvious only when the answer contains a narrow, inspectable, directly grounded update that fits the explicit AI-origin capture policy. It must be system-recorded with provenance, remain challengeable, and never be framed as human-approved or final.",
    "Use decision=review when the answer suggests a useful record change, but it still depends on interpretive judgment, contested framing, or a human deciding whether the change should move the card.",
    "When decision=none, leave title/body as brief placeholders and keep assignment_kind=unclear.",
    "Return only JSON that matches the requested schema.",
    "",
    "Visitor question:",
    args.question,
    "",
    "AI answer:",
    args.answer,
    "",
    "Current topic context:",
    args.context,
  ].join("\n");
}

async function buildOpenAiProposal(args: {
  question: string;
  answer: string;
  context: string;
}): Promise<TopicChatPromotionProposal | null> {
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
        max_output_tokens: 500,
        instructions:
          "You are a Civic Logos record-gate assistant. You do not rewrite the public record or decide truth. You only classify whether a chat answer should remain exploratory, go to human review, or fit the narrow AI-origin capture policy for a system-recorded provisional record.",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: buildPromotionPrompt(args),
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "civic_logos_topic_chat_promotion",
            strict: true,
            schema: promotionSchema,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI topic promotion failed", errorText);
      return null;
    }

    const payload = (await response.json()) as OpenAIResponse;
    const outputText = extractOpenAiText(payload);

    if (!outputText) {
      return null;
    }

    return normalizeProposal(
      "openai",
      config.model,
      JSON.parse(outputText) as TopicChatPromotionSchemaResult,
    );
  } catch (error) {
    console.error("OpenAI topic promotion error", error);
    return null;
  }
}

async function buildAnthropicProposal(args: {
  question: string;
  answer: string;
  context: string;
}): Promise<TopicChatPromotionProposal | null> {
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
        max_tokens: 500,
        system:
          "You are a Civic Logos record-gate assistant. You do not rewrite the public record or decide truth. You only classify whether a chat answer should remain exploratory, go to human review, or fit the narrow AI-origin capture policy for a system-recorded provisional record. Return only JSON that matches the requested schema.",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: [
                  "Return only JSON with this schema:",
                  JSON.stringify(promotionSchema, null, 2),
                  "",
                  buildPromotionPrompt(args),
                ].join("\n"),
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic topic promotion failed", errorText);
      return null;
    }

    const payload = (await response.json()) as AnthropicResponse;
    const outputText = extractJsonObject(extractAnthropicText(payload));

    if (!outputText) {
      return null;
    }

    return normalizeProposal(
      "anthropic",
      config.model,
      JSON.parse(outputText) as TopicChatPromotionSchemaResult,
    );
  } catch (error) {
    console.error("Anthropic topic promotion error", error);
    return null;
  }
}

export async function buildTopicChatPromotionProposal(args: {
  provider: AiProviderName;
  question: string;
  answer: string;
  context: string;
}) {
  return args.provider === "openai"
    ? buildOpenAiProposal(args)
    : buildAnthropicProposal(args);
}
