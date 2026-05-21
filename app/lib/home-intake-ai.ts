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

type RoutingSchemaResult = {
  route_kind: "existing-room" | "new-room-draft";
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
      enum: ["existing-room", "new-room-draft"],
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
      minItems: 2,
      maxItems: 4,
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
        "Prefer an existing room whenever the idea clearly belongs inside one of the current domains, even if it would become a new topic card inside that room. Only recommend a new-room-draft when the current room map is a genuinely poor fit.",
    },
    null,
    2,
  );
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

function isRoomSlug(value: string): value is IssueRoomSlug {
  return roomSlugOptions.includes(value as IssueRoomSlug);
}

function parseRoutingResult(
  result: RoutingSchemaResult,
): Omit<ProviderHomeIntakeRouting, "provider" | "state" | "model"> {
  const routeKind = result.route_kind;
  const roomSlug =
    routeKind === "existing-room" && isRoomSlug(result.room_slug)
      ? result.room_slug
      : undefined;
  const roomTitle = roomSlug ? issueRooms[roomSlug].title : "Provisional new room";
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
          "You are a routing reader for Civic Logos. Read a user's question or idea and decide whether it belongs in one of the current rooms or whether it needs a provisional new-room draft. You are not writing a manifesto. You are mapping the idea into the cleanest current public reasoning object.",
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

    return {
      provider: "openai",
      state: "completed",
      model,
      ...parseRoutingResult(JSON.parse(outputText) as RoutingSchemaResult),
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
          "You are a routing reader for Civic Logos. Read a user's question or idea and decide whether it belongs in one of the current rooms or whether it needs a provisional new-room draft. Return only JSON that matches the requested schema.",
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

    return {
      provider: "anthropic",
      state: "completed",
      model,
      ...parseRoutingResult(JSON.parse(outputText) as RoutingSchemaResult),
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
  const providers = await Promise.all([
    classifyWithOpenAI(prompt),
    classifyWithAnthropic(prompt),
  ]);
  const completedProviders = providers.filter((item) => item.state === "completed");
  const primaryProvider = completedProviders[0];

  if (!providers.length || providers.every((item) => item.state === "unavailable")) {
    return {
      state: "unavailable",
      providers,
    };
  }

  if (!completedProviders.length || !primaryProvider) {
    return {
      state: "error",
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
