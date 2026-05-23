import {
  getAnthropicProviderConfig,
  getOpenAIProviderConfig,
  type AiProviderName,
} from "./ai-provider-config";
import {
  getRoomTopicCard,
  getRoomTopicLabel,
  type IssueRoomSlug,
} from "./civic-logos";
import { isActualCardChange } from "./contribution-impact";
import { listPublicContributions } from "./contribution-store";
import type { TopicChatMessage, TopicChatPromotion } from "./topic-chat-types";

type TopicQuestionProvider = AiProviderName | "all";

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

export type TopicAiAnswer = {
  provider: AiProviderName;
  model: string;
  generatedAt: string;
  promptCategory: "topic-chat";
  response: string;
  promotion?: TopicChatPromotion;
};

export type TopicAiIssue = {
  provider: AiProviderName;
  model?: string;
  message: string;
};

export type TopicAiResult = {
  state: "completed" | "partial" | "error" | "unavailable";
  answers: TopicAiAnswer[];
  issues: TopicAiIssue[];
  disclaimer: string;
};

export type TopicCardReaderContext = {
  card: NonNullable<ReturnType<typeof getRoomTopicCard>>;
  context: string;
};

type TopicQuestionInput = {
  roomSlug: IssueRoomSlug;
  topicId: string;
  question: string;
  provider: TopicQuestionProvider;
  history?: TopicChatMessage[];
  preparedContext?: TopicCardReaderContext | null;
};

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

export async function getTopicCardReaderContext(
  roomSlug: IssueRoomSlug,
  topicId: string,
): Promise<TopicCardReaderContext | null> {
  const card = getRoomTopicCard(roomSlug, topicId);

  if (!card) {
    return null;
  }

  const contributions = await listPublicContributions({
    roomSlug,
    topicId,
    limit: 6,
  });

  const contributorObjection = contributions.find(
    (item) => item.lane === "objection" && isActualCardChange(item),
  );
  const liveObjection = contributions.find((item) => item.lane === "objection");

  const contributionLines =
    contributions.length > 0
      ? contributions.map((item) =>
          [
            `- [${item.status}] ${item.lane}: ${item.title}`,
            item.evidenceSource?.url
              ? `  Linked source: ${item.evidenceSource.label ?? item.evidenceSource.url} (${item.evidenceSource.url})`
              : null,
            item.evidenceDocument
              ? `  Uploaded document: ${item.evidenceDocument.fileName} [${item.evidenceDocument.mimeType}, ${item.evidenceDocument.extraction.status}]`
              : null,
            item.evidenceDocument?.extraction.note
              ? `  Extraction note: ${item.evidenceDocument.extraction.note}`
              : null,
            item.evidenceDocument?.extraction.excerpt
              ? `  Extracted excerpt: ${item.evidenceDocument.extraction.excerpt}`
              : null,
            item.aiIntake?.summary ? `  AI sorting: ${item.aiIntake.summary}` : null,
            isActualCardChange(item)
              ? "  Human review: changed the card."
              : item.review?.changedSynthesis === false
                ? "  Human review: did not change the card."
                : item.review
                  ? "  Human review: still open or needs stronger basis."
                  : null,
          ]
            .filter(Boolean)
            .join("\n"),
        )
      : ["- No contribution record is visible yet."];
  const uploadedEvidenceLines = contributions
    .filter((item) => item.evidenceDocument)
    .slice(0, 4)
    .map((item) =>
      [
        `- ${item.evidenceDocument!.fileName} [${item.status}] via contribution "${item.title}"`,
        item.evidenceDocument?.extraction.note
          ? `  Extraction note: ${item.evidenceDocument.extraction.note}`
          : null,
        item.evidenceDocument?.extraction.excerpt
          ? `  Extracted excerpt: ${item.evidenceDocument.extraction.excerpt}`
          : null,
      ]
        .filter(Boolean)
        .join("\n"),
    );

  return {
    card,
    context: [
      `Room: ${getRoomTopicLabel(roomSlug)}`,
      `Topic card: ${card.title}`,
      `Subtitle: ${card.subtitle}`,
      "",
      `Thesis: ${card.thesis}`,
      `Current read: ${card.currentRead}`,
      `Problem statement: ${card.problemStatement}`,
      `Proposed move: ${card.proposedSolution}`,
      "",
      "Mechanism:",
      ...card.mechanism.map((item) => `- ${item}`),
      "",
      "Core assumptions:",
      ...card.assumptions.map((item) => `- ${item}`),
      "",
      "Open questions:",
      ...card.openQuestions.map((item) => `- ${item}`),
      "",
      `Anticipated objection: ${card.anticipatedObjection ?? card.strongestObjection}`,
      contributorObjection
        ? `Contributor objection that changed the card: ${contributorObjection.title} — ${contributorObjection.body}`
        : liveObjection
          ? `Strongest live contributor objection in record: ${liveObjection.title} — ${liveObjection.body}`
          : "No contributor objection is in the visible record yet.",
      "",
      `Economic delta read: ${card.economicDelta.summary}`,
      "Economic delta metrics:",
      ...card.economicDelta.metrics.map((item) => `- ${item}`),
      "",
      "Evidence layer:",
      ...card.evidence.map(
        (item) => `- ${item.title} [${item.status}] — ${item.note}`,
      ),
      "",
      "Uploaded evidence documents already attached to recent contributions:",
      ...(uploadedEvidenceLines.length
        ? uploadedEvidenceLines
        : ["- No uploaded evidence document is in the visible record yet."]),
      "",
      "Recent contributions and review state:",
      ...contributionLines,
    ].join("\n"),
  };
}

function buildHistoryBlock(history: TopicChatMessage[] | undefined) {
  const recentMessages = history?.slice(-8) ?? [];

  if (!recentMessages.length) {
    return "No prior topic chat is stored for this session yet.";
  }

  return recentMessages
    .map((item) => {
      if (item.role === "user") {
        return `Visitor: ${item.body}`;
      }

      const providerLabel = item.provider === "openai" ? "GPT AI" : "Claude AI";
      return `${providerLabel}: ${item.body}`;
    })
    .join("\n");
}

function buildReaderPrompt(
  question: string,
  context: string,
  history: TopicChatMessage[] | undefined,
) {
  return [
    "Answer the visitor's question only from the Civic Logos topic card context below.",
    "You are an AI assistant, not the final judge.",
    "Do not claim the public record has changed.",
    "Be calm, serious, and direct.",
    "If the question cannot be answered confidently from the current card, say what assumption, objection, evidence, or measurement gap is still open.",
    "Prefer 2-4 short paragraphs or a short bullet list when helpful.",
    "",
    "Recent scoped topic chat in this session:",
    buildHistoryBlock(history),
    "",
    "Visitor question:",
    question,
    "",
    "Topic card context:",
    context,
  ].join("\n");
}

async function askOpenAi(
  question: string,
  context: string,
  history: TopicChatMessage[] | undefined,
): Promise<TopicAiAnswer | TopicAiIssue> {
  const config = getOpenAIProviderConfig();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || !config.configured) {
    return {
      provider: "openai",
      model: config.model,
      message: "OpenAI is not configured for this deployment.",
    };
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
        max_output_tokens: 700,
        instructions:
          "You are an AI assistant inside Civic Logos. Help the user think through a live topic card. You do not declare final truth, do not change the record, and do not pretend that a provider model is the authority over the room.",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: buildReaderPrompt(question, context, history),
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI topic reader failed", errorText);
      return {
        provider: "openai",
        model: config.model,
        message: "OpenAI could not answer from this topic card right now.",
      };
    }

    const payload = (await response.json()) as OpenAIResponse;
    const outputText = extractOpenAiText(payload);

    if (!outputText) {
      return {
        provider: "openai",
        model: config.model,
        message: "OpenAI returned no readable topic answer.",
      };
    }

    return {
      provider: "openai",
      model: config.model,
      generatedAt: new Date().toISOString(),
      promptCategory: "topic-chat",
      response: outputText,
    };
  } catch (error) {
    console.error("OpenAI topic reader error", error);
    return {
      provider: "openai",
      model: config.model,
      message: "OpenAI could not answer from this topic card right now.",
    };
  }
}

async function askAnthropic(
  question: string,
  context: string,
  history: TopicChatMessage[] | undefined,
): Promise<TopicAiAnswer | TopicAiIssue> {
  const config = getAnthropicProviderConfig();
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || !config.configured) {
    return {
      provider: "anthropic",
      model: config.model,
      message: "Claude is not configured for this deployment.",
    };
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
        max_tokens: 700,
        system:
          "You are an AI assistant inside Civic Logos. Help the user think through a live topic card. You do not declare final truth, do not change the record, and do not pretend that the model is the authority over the room.",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: buildReaderPrompt(question, context, history),
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic topic reader failed", errorText);
      return {
        provider: "anthropic",
        model: config.model,
        message: "Claude could not answer from this topic card right now.",
      };
    }

    const payload = (await response.json()) as AnthropicResponse;
    const outputText = extractAnthropicText(payload);

    if (!outputText) {
      return {
        provider: "anthropic",
        model: config.model,
        message: "Claude returned no readable topic answer.",
      };
    }

    return {
      provider: "anthropic",
      model: config.model,
      generatedAt: new Date().toISOString(),
      promptCategory: "topic-chat",
      response: outputText,
    };
  } catch (error) {
    console.error("Anthropic topic reader error", error);
    return {
      provider: "anthropic",
      model: config.model,
      message: "Claude could not answer from this topic card right now.",
    };
  }
}

function isAnswer(
  value: TopicAiAnswer | TopicAiIssue,
): value is TopicAiAnswer {
  return "generatedAt" in value;
}

export async function askTopicCard(
  input: TopicQuestionInput,
): Promise<TopicAiResult | null> {
  const preparedContext =
    input.preparedContext ?? (await getTopicCardReaderContext(input.roomSlug, input.topicId));

  if (!preparedContext) {
    return null;
  }

  const requestedProviders =
    input.provider === "all"
      ? (["openai", "anthropic"] as const)
      : ([input.provider] as const);

  const results = await Promise.all(
    requestedProviders.map((provider) =>
      provider === "openai"
        ? askOpenAi(input.question, preparedContext.context, input.history)
        : askAnthropic(input.question, preparedContext.context, input.history),
    ),
  );

  const answers = results.filter(isAnswer);
  const issues = results.filter((item): item is TopicAiIssue => !isAnswer(item));

  return {
    state:
      answers.length === 0
        ? issues.every((item) => item.message.includes("not configured"))
          ? "unavailable"
          : "error"
        : answers.length === results.length
          ? "completed"
          : "partial",
    answers,
    issues,
    disclaimer:
      "These are AI responses generated from the current topic card, visible contribution record, and your scoped topic chat in this session. They only affect the public record when Civic Logos sends a proposal into human review or system-records a narrow AI-origin update with provenance under the current capture policy. AI is not the final judge.",
  };
}
