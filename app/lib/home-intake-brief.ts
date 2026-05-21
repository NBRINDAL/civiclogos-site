import {
  getAnthropicProviderConfig,
  getOpenAIProviderConfig,
  type AiProviderName,
} from "./ai-provider-config";
import type { HomeIntakeRecord } from "./home-intake-types";

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

export type HomeIntakeBriefAnswer = {
  provider: AiProviderName;
  model: string;
  generatedAt: string;
  response: string;
};

export type HomeIntakeBriefIssue = {
  provider: AiProviderName;
  model?: string;
  message: string;
};

export type HomeIntakeBriefResult = {
  state: "completed" | "partial" | "error" | "unavailable";
  answers: HomeIntakeBriefAnswer[];
  issues: HomeIntakeBriefIssue[];
  disclaimer: string;
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

function buildBriefPrompt(entry: HomeIntakeRecord) {
  const topicLabel =
    entry.routing.suggestedTopicTitle ??
    entry.routing.suggestedCentralQuestion ??
    "New public issue candidate";

  return [
    "You are an assisted public reasoning reader for Civic Logos.",
    "Develop this room candidate from multiple serious perspectives.",
    "Do not claim final truth. Do not endorse unsupported allegations. Do not flatten contested issues into one narrative.",
    "If the prompt names a disputed event, person, institution, or technical claim, briefly explain the best-known public or institutional account in plain language instead of staying purely meta.",
    "For controversial or disputed topics, explicitly distinguish between:",
    "1. the public, institutional, or mainstream account,",
    "2. the strongest skeptical or dissenting account worth examining,",
    "3. the evidence or technical questions that would most discriminate between them,",
    "4. the incentive, institutional, or trust question underneath the dispute.",
    "If the prompt raises a technical or physical claim, name the concrete mechanism or measurement dispute a serious reviewer would examine.",
    "Be calm, serious, and concise.",
    "Use short sections with these exact headings and fill them with actual issue development, not generic placeholders:",
    "Institutional account",
    "Skeptical account",
    "What needs to be checked",
    "Underlying civic issue",
    "",
    `Candidate label: ${topicLabel}`,
    `Prompt: ${entry.prompt}`,
    entry.routing.whyNotExistingRooms
      ? `Routing note: ${entry.routing.whyNotExistingRooms}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}

async function askOpenAi(entry: HomeIntakeRecord): Promise<HomeIntakeBriefAnswer | HomeIntakeBriefIssue> {
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
        max_output_tokens: 900,
        instructions:
          "You are an assisted reader inside Civic Logos. Help develop a new public issue candidate from multiple perspectives without pretending to settle the issue or replace human review.",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: buildBriefPrompt(entry),
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI intake brief failed", errorText);
      return {
        provider: "openai",
        model: config.model,
        message: "OpenAI could not develop this room candidate right now.",
      };
    }

    const payload = (await response.json()) as OpenAIResponse;
    const outputText = extractOpenAiText(payload);

    if (!outputText) {
      return {
        provider: "openai",
        model: config.model,
        message: "OpenAI returned no readable issue-development output.",
      };
    }

    return {
      provider: "openai",
      model: config.model,
      generatedAt: new Date().toISOString(),
      response: outputText,
    };
  } catch (error) {
    console.error("OpenAI intake brief error", error);
    return {
      provider: "openai",
      model: config.model,
      message: "OpenAI could not develop this room candidate right now.",
    };
  }
}

async function askAnthropic(entry: HomeIntakeRecord): Promise<HomeIntakeBriefAnswer | HomeIntakeBriefIssue> {
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
        max_tokens: 900,
        system:
          "You are an assisted reader inside Civic Logos. Help develop a new public issue candidate from multiple perspectives without pretending to settle the issue or replace human review.",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: buildBriefPrompt(entry),
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic intake brief failed", errorText);
      return {
        provider: "anthropic",
        model: config.model,
        message: "Claude could not develop this room candidate right now.",
      };
    }

    const payload = (await response.json()) as AnthropicResponse;
    const outputText = extractAnthropicText(payload);

    if (!outputText) {
      return {
        provider: "anthropic",
        model: config.model,
        message: "Claude returned no readable issue-development output.",
      };
    }

    return {
      provider: "anthropic",
      model: config.model,
      generatedAt: new Date().toISOString(),
      response: outputText,
    };
  } catch (error) {
    console.error("Anthropic intake brief error", error);
    return {
      provider: "anthropic",
      model: config.model,
      message: "Claude could not develop this room candidate right now.",
    };
  }
}

function isAnswer(
  value: HomeIntakeBriefAnswer | HomeIntakeBriefIssue,
): value is HomeIntakeBriefAnswer {
  return "generatedAt" in value;
}

export async function buildHomeIntakeBrief(
  entry: HomeIntakeRecord,
): Promise<HomeIntakeBriefResult> {
  const results = await Promise.all([askOpenAi(entry), askAnthropic(entry)]);
  const answers = results.filter(isAnswer);
  const issues = results.filter((item): item is HomeIntakeBriefIssue => !isAnswer(item));

  const configuredCount = [getOpenAIProviderConfig(), getAnthropicProviderConfig()].filter(
    (item) => item.configured,
  ).length;

  const state =
    answers.length === 2
      ? "completed"
      : answers.length > 0
        ? "partial"
        : configuredCount === 0
          ? "unavailable"
          : "error";

  return {
    state,
    answers,
    issues,
    disclaimer:
      "These are assisted-reader development passes on a room candidate. They help surface perspectives, evidence questions, and civic pressure points, but they do not settle the issue or replace human review.",
  };
}
