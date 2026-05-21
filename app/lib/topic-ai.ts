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
import { listPublicContributions } from "./contribution-store";

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
  promptCategory: "topic-question";
  response: string;
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

type TopicQuestionInput = {
  roomSlug: IssueRoomSlug;
  topicId: string;
  question: string;
  provider: TopicQuestionProvider;
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

async function buildTopicContext(roomSlug: IssueRoomSlug, topicId: string) {
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
    (item) => item.lane === "objection" && item.review?.changedSynthesis === true,
  );
  const liveObjection = contributions.find((item) => item.lane === "objection");

  const contributionLines =
    contributions.length > 0
      ? contributions.map((item) =>
          [
            `- [${item.status}] ${item.lane}: ${item.title}`,
            item.aiIntake?.summary ? `  AI sorting: ${item.aiIntake.summary}` : null,
            item.review?.changedSynthesis === true
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
      "Recent contributions and review state:",
      ...contributionLines,
    ].join("\n"),
  };
}

function buildReaderPrompt(question: string, context: string) {
  return [
    "Answer the visitor's question only from the Civic Logos topic card context below.",
    "You are an assisted reader, not the final judge.",
    "Do not claim the public record has changed.",
    "Be calm, serious, and direct.",
    "If the question cannot be answered confidently from the current card, say what assumption, objection, evidence, or measurement gap is still open.",
    "Prefer 2-4 short paragraphs or a short bullet list when helpful.",
    "",
    "Visitor question:",
    question,
    "",
    "Topic card context:",
    context,
  ].join("\n");
}

async function askOpenAi(question: string, context: string): Promise<TopicAiAnswer | TopicAiIssue> {
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
          "You are an assisted reader inside Civic Logos. Help the reader think through a live topic card. You do not declare final truth, do not change the record, and do not pretend that a provider model is the authority over the room.",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: buildReaderPrompt(question, context),
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
      promptCategory: "topic-question",
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

async function askAnthropic(question: string, context: string): Promise<TopicAiAnswer | TopicAiIssue> {
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
          "You are an assisted reader inside Civic Logos. Help the reader think through a live topic card. You do not declare final truth, do not change the record, and do not pretend that the model is the authority over the room.",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: buildReaderPrompt(question, context),
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
      promptCategory: "topic-question",
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
  const context = await buildTopicContext(input.roomSlug, input.topicId);

  if (!context) {
    return null;
  }

  const requestedProviders =
    input.provider === "all"
      ? (["openai", "anthropic"] as const)
      : ([input.provider] as const);

  const results = await Promise.all(
    requestedProviders.map((provider) =>
      provider === "openai"
        ? askOpenAi(input.question, context.context)
        : askAnthropic(input.question, context.context),
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
      "These are assisted-reader responses generated from the current topic card and visible contribution record. They do not change the public record unless a maintainer turns them into a reviewed update.",
  };
}
