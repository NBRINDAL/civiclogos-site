import type {
  CreateContributionInput,
  ContributionAiIntake,
  ProviderContributionAiIntake,
} from "./contribution-types";
import {
  getAnthropicProviderConfig,
  getOpenAIProviderConfig,
} from "./ai-provider-config";
import { debateLaneOptions } from "./reasoning-types";

type IntakeSchemaResult = {
  summary: string;
  suggested_assignment_kind:
    | "claim"
    | "objection"
    | "evidence"
    | "assumption"
    | "open-question"
    | "unclear";
  suggested_assignment_label: string;
  lane_fit: (typeof debateLaneOptions)[number];
  changed_synthesis_likely: "yes" | "no" | "unclear";
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

const intakeSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "summary",
    "suggested_assignment_kind",
    "suggested_assignment_label",
    "lane_fit",
    "changed_synthesis_likely",
    "reviewer_note",
  ],
  properties: {
    summary: { type: "string" },
    suggested_assignment_kind: {
      type: "string",
      enum: ["claim", "objection", "evidence", "assumption", "open-question", "unclear"],
    },
    suggested_assignment_label: { type: "string" },
    lane_fit: {
      type: "string",
      enum: [...debateLaneOptions],
    },
    changed_synthesis_likely: {
      type: "string",
      enum: ["yes", "no", "unclear"],
    },
    reviewer_note: { type: "string" },
  },
} as const;

function buildIntakePrompt(input: CreateContributionInput) {
  return JSON.stringify(
    {
      room: input.roomSlug,
      topicTitle: input.topicTitle,
      lane: input.lane,
      title: input.title,
      body: input.body,
      evidenceSource: input.evidenceSource ?? null,
      evidenceDocument: input.evidenceDocument
        ? {
            fileName: input.evidenceDocument.fileName,
            mimeType: input.evidenceDocument.mimeType,
            sizeBytes: input.evidenceDocument.sizeBytes,
            extraction: input.evidenceDocument.extraction,
          }
        : null,
      contributorContext: input.author.expertise ?? null,
      maintainerRevisionMode:
        input.author.name?.toLowerCase().includes("founder-maintainer") ||
        input.author.expertise?.toLowerCase().includes("founder-maintainer") ||
        false,
    },
    null,
    2,
  );
}

function getContributionIntakeInstructions(input: CreateContributionInput) {
  const isMaintainerRevision =
    input.author.name?.toLowerCase().includes("founder-maintainer") ||
    input.author.expertise?.toLowerCase().includes("founder-maintainer") ||
    false;
  const base =
    "You are an intake reader for Civic Logos, a public reasoning platform. You do not decide truth. You classify contributions into the most useful place for later maintainer review, preserve strong objections and evidence, and write calm, institutional summaries.";

  if (!isMaintainerRevision) {
    return base;
  }

  return `${base} This contribution is a founder-maintainer proposed synthesis revision. Do not rubber-stamp it. Evaluate whether the proposed synthesis is plausibly better than the prior framing, identify overclaims, missing evidence burdens, implementation risks, and any reason human review should not incorporate it yet. AI output is advisory only.`;
}

function parseIntakeResult(result: IntakeSchemaResult) {
  return {
    summary: result.summary,
    suggestedAssignmentKind:
      result.suggested_assignment_kind === "unclear"
        ? undefined
        : result.suggested_assignment_kind,
    suggestedAssignmentLabel: result.suggested_assignment_label,
    laneFit: result.lane_fit,
    changedSynthesisLikely:
      result.changed_synthesis_likely === "yes"
        ? true
        : result.changed_synthesis_likely === "no"
          ? false
          : null,
    reviewerNote: result.reviewer_note,
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

function parseModelJsonText(text: string): IntakeSchemaResult {
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

  return JSON.parse(candidate) as IntakeSchemaResult;
}

async function classifyWithOpenAI(
  input: CreateContributionInput,
): Promise<ProviderContributionAiIntake> {
  const config = getOpenAIProviderConfig();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || !config.configured) {
    return { provider: "openai", state: "unavailable" };
  }
  const model = config.model;

  try {
    const buildFallbackRequest = () =>
      ({
        model,
        store: false,
        max_output_tokens: 450,
        instructions: `${getContributionIntakeInstructions(input)} Return only JSON that matches this schema: ${JSON.stringify(intakeSchema)}`,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: buildIntakePrompt(input),
              },
            ],
          },
        ],
      }) as const;

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
        max_output_tokens: 450,
        instructions: getContributionIntakeInstructions(input),
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: buildIntakePrompt(input),
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "civic_logos_contribution_intake",
            strict: true,
            schema: intakeSchema,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI contribution intake failed", errorText);
      const fallbackResponse = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(buildFallbackRequest()),
      });

      if (!fallbackResponse.ok) {
        const fallbackErrorText = await fallbackResponse.text();
        console.error("OpenAI contribution intake fallback failed", fallbackErrorText);
        return {
          provider: "openai",
          state: "error",
          model,
          errorMessage: "OpenAI intake request failed.",
        };
      }

      const fallbackPayload = (await fallbackResponse.json()) as OpenAIResponse;
      const fallbackOutputText = extractOpenAIText(fallbackPayload);

      if (!fallbackOutputText) {
        return {
          provider: "openai",
          state: "error",
          model,
          errorMessage: "OpenAI intake returned no structured output.",
        };
      }

      return {
        provider: "openai",
        state: "completed",
        model,
        ...parseIntakeResult(parseModelJsonText(fallbackOutputText)),
      };
    }

    const payload = (await response.json()) as OpenAIResponse;
    const outputText = extractOpenAIText(payload);

    if (!outputText) {
      return {
        provider: "openai",
        state: "error",
        model,
        errorMessage: "OpenAI intake returned no structured output.",
      };
    }

    return {
      provider: "openai",
      state: "completed",
      model,
      ...parseIntakeResult(parseModelJsonText(outputText)),
    };
  } catch (error) {
    console.error("OpenAI contribution intake error", error);
    return {
      provider: "openai",
      state: "error",
      model,
      errorMessage: "OpenAI intake could not classify this contribution.",
    };
  }
}

async function classifyWithAnthropic(
  input: CreateContributionInput,
): Promise<ProviderContributionAiIntake> {
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
        max_tokens: 450,
        system: `${getContributionIntakeInstructions(input)} Return only JSON that matches the requested schema.`,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: [
                  "Return only JSON with these keys:",
                  JSON.stringify(intakeSchema, null, 2),
                  "",
                  "Contribution payload:",
                  buildIntakePrompt(input),
                ].join("\n"),
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic contribution intake failed", errorText);
      return {
        provider: "anthropic",
        state: "error",
        model,
        errorMessage: "Claude intake request failed.",
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
        errorMessage: "Claude intake returned no structured output.",
      };
    }

    return {
      provider: "anthropic",
      state: "completed",
      model,
      ...parseIntakeResult(parseModelJsonText(outputText)),
    };
  } catch (error) {
    console.error("Anthropic contribution intake error", error);
    return {
      provider: "anthropic",
      state: "error",
      model,
      errorMessage: "Claude intake could not classify this contribution.",
    };
  }
}

export async function buildContributionAiIntake(
  input: CreateContributionInput,
): Promise<ContributionAiIntake> {
  const providers = await Promise.all([
    classifyWithOpenAI(input),
    classifyWithAnthropic(input),
  ]);
  const completedProviders = providers.filter((item) => item.state === "completed");
  const primaryProvider = completedProviders[0];

  if (!providers.length || providers.every((item) => item.state === "unavailable")) {
    return {
      state: "unavailable",
      providers,
    };
  }

  if (!completedProviders.length) {
    return {
      state: "error",
      providers,
    };
  }

  return {
    state: completedProviders.length === providers.length ? "completed" : "partial",
    summary: primaryProvider?.summary,
    suggestedAssignmentKind: primaryProvider?.suggestedAssignmentKind,
    suggestedAssignmentLabel: primaryProvider?.suggestedAssignmentLabel,
    laneFit: primaryProvider?.laneFit,
    changedSynthesisLikely: primaryProvider?.changedSynthesisLikely,
    reviewerNote: primaryProvider?.reviewerNote,
    providers,
  };
}
