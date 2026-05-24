import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  getRoomHref,
  getRoomTopicCard,
  getRoomTopicHref,
} from "@/app/lib/civic-logos";
import {
  getContributionById,
  updateContributionEvidenceDocument,
} from "@/app/lib/contribution-store";
import {
  getEvidenceDocument,
  refreshEvidenceDocumentExtraction,
} from "@/app/lib/evidence-document-store";
import { extractEvidenceText } from "@/app/lib/evidence-extraction";
import {
  getAnthropicProviderConfig,
  getOpenAIProviderConfig,
} from "@/app/lib/ai-provider-config";
import { getContributionOrigin } from "@/app/lib/contribution-origin";

export const runtime = "nodejs";

type ReviewAiPayload = {
  contributionId?: unknown;
  provider?: unknown;
  question?: unknown;
};

type ReviewAiAnswer = {
  provider: "openai" | "anthropic";
  model: string;
  response: string;
  generatedAt: string;
};

type ReviewAiIssue = {
  provider: "openai" | "anthropic";
  model?: string;
  message: string;
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

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isProvider(value: string): value is "openai" | "anthropic" | "all" {
  return value === "openai" || value === "anthropic" || value === "all";
}

function extractOpenAIText(response: OpenAIResponse) {
  return (
    response.output
      ?.flatMap((item) =>
        item.type === "message"
          ? item.content?.flatMap((content) =>
              content.type === "output_text" && content.text ? [content.text] : [],
            ) ?? []
          : [],
      )
      .join("")
      .trim() ?? ""
  );
}

function buildReviewContext({
  contribution,
  topicThesis,
  readableEvidenceText,
}: {
  contribution: NonNullable<Awaited<ReturnType<typeof getContributionById>>>;
  topicThesis: string;
  readableEvidenceText?: {
    text: string;
    pageCount?: number;
    wordCount?: number;
    source: string;
  } | null;
}) {
  return JSON.stringify(
    {
      topic: {
        roomSlug: contribution.roomSlug,
        topicId: contribution.topicId,
        title: contribution.topicTitle,
        currentSynthesis: topicThesis,
      },
      contribution: {
        id: contribution.id,
        title: contribution.title,
        body: contribution.body,
        lane: contribution.lane,
        status: contribution.status,
        origin: getContributionOrigin(contribution),
        evidenceSource: contribution.evidenceSource ?? null,
        accessibleEvidenceExcerpt: contribution.evidenceExcerpt ?? null,
        readableEvidenceTextForAi: readableEvidenceText ?? null,
        evidenceDocument: contribution.evidenceDocument
          ? {
              fileName: contribution.evidenceDocument.fileName,
              mimeType: contribution.evidenceDocument.mimeType,
              sizeBytes: contribution.evidenceDocument.sizeBytes,
              extraction: contribution.evidenceDocument.extraction,
            }
          : null,
        aiIntake: contribution.aiIntake ?? null,
        existingHumanReview: contribution.review ?? null,
      },
    },
    null,
    2,
  );
}

async function refreshReadableEvidenceIfNeeded(
  contribution: NonNullable<Awaited<ReturnType<typeof getContributionById>>>,
) {
  const evidenceDocument = contribution.evidenceDocument;

  if (!evidenceDocument || evidenceDocument.extraction.status === "completed") {
    return contribution;
  }

  const refreshedDocument = await refreshEvidenceDocumentExtraction(evidenceDocument.id);

  if (!refreshedDocument) {
    return contribution;
  }

  const updatedContribution = await updateContributionEvidenceDocument(
    contribution.id,
    refreshedDocument,
  );

  revalidatePath("/review/contributions");
  revalidatePath(getRoomHref(contribution.roomSlug));
  revalidatePath(getRoomTopicHref(contribution.roomSlug, contribution.topicId));

  return updatedContribution ?? { ...contribution, evidenceDocument: refreshedDocument };
}

async function loadReadableEvidenceTextForAi(
  contribution: NonNullable<Awaited<ReturnType<typeof getContributionById>>>,
) {
  if (contribution.evidenceExcerpt) {
    return {
      text: contribution.evidenceExcerpt,
      wordCount: contribution.evidenceExcerpt.split(/\s+/).filter(Boolean).length,
      source: "maintainer-provided accessible evidence excerpt",
    };
  }

  const evidenceDocument = contribution.evidenceDocument;

  if (!evidenceDocument) {
    return null;
  }

  const storedDocument = await getEvidenceDocument(evidenceDocument.id);

  if (!storedDocument) {
    return null;
  }

  try {
    const extracted = await extractEvidenceText(
      storedDocument.document.fileName,
      storedDocument.document.mimeType,
      storedDocument.bytes,
    );

    return extracted
      ? {
          ...extracted,
          source: "on-demand hosted evidence extraction",
        }
      : null;
  } catch (error) {
    console.error("Reviewer AI could not load evidence text on demand", error);
    return null;
  }
}

function getReviewInstructions() {
  return [
    "You are a Civic Logos reviewer assistant.",
    "You do not decide truth, legitimacy, or the final review outcome.",
    "Help a human reviewer interrogate one contribution against the current topic card.",
    "Separate notation, definitions, assumptions, evidence, predictions, and synthesis pressure.",
    "If readableEvidenceTextForAi is present in the context, treat it as the uploaded document text even if a stored extraction status is stale or says error.",
    "If no readable document text is available, say that clearly and reason only from the visible contribution metadata.",
    "Do not recommend changing the visible synthesis unless you can name the exact claim that would change and what remains unresolved.",
    "Give concrete review guidance: likely attachment target, what to check next, and a cautious public note if useful.",
  ].join(" ");
}

async function askOpenAIReview({
  context,
  question,
}: {
  context: string;
  question: string;
}): Promise<ReviewAiAnswer | ReviewAiIssue> {
  const config = getOpenAIProviderConfig();
  const apiKey = process.env.OPENAI_API_KEY;
  const model = config.model;

  if (!apiKey || !config.configured) {
    return {
      provider: "openai",
      model,
      message: "OpenAI is not configured on this deployment.",
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
        model,
        store: false,
        max_output_tokens: 850,
        instructions: getReviewInstructions(),
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: [
                  "Reviewer question:",
                  question,
                  "",
                  "Contribution review context:",
                  context,
                ].join("\n"),
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("OpenAI reviewer consult failed", await response.text());
      return {
        provider: "openai",
        model,
        message: "OpenAI reviewer consult failed.",
      };
    }

    const payload = (await response.json()) as OpenAIResponse;
    const responseText = extractOpenAIText(payload);

    if (!responseText) {
      return {
        provider: "openai",
        model,
        message: "OpenAI reviewer consult returned no text.",
      };
    }

    return {
      provider: "openai",
      model,
      response: responseText,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("OpenAI reviewer consult error", error);
    return {
      provider: "openai",
      model,
      message: "OpenAI reviewer consult could not run.",
    };
  }
}

async function askAnthropicReview({
  context,
  question,
}: {
  context: string;
  question: string;
}): Promise<ReviewAiAnswer | ReviewAiIssue> {
  const config = getAnthropicProviderConfig();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = config.model;

  if (!apiKey || !config.configured) {
    return {
      provider: "anthropic",
      model,
      message: "Claude is not configured on this deployment.",
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
        model,
        max_tokens: 850,
        system: getReviewInstructions(),
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: [
                  "Reviewer question:",
                  question,
                  "",
                  "Contribution review context:",
                  context,
                ].join("\n"),
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("Claude reviewer consult failed", await response.text());
      return {
        provider: "anthropic",
        model,
        message: "Claude reviewer consult failed.",
      };
    }

    const payload = (await response.json()) as AnthropicResponse;
    const responseText =
      payload.content
        ?.flatMap((item) => (item.type === "text" && item.text ? [item.text] : []))
        .join("")
        .trim() ?? "";

    if (!responseText) {
      return {
        provider: "anthropic",
        model,
        message: "Claude reviewer consult returned no text.",
      };
    }

    return {
      provider: "anthropic",
      model,
      response: responseText,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Claude reviewer consult error", error);
    return {
      provider: "anthropic",
      model,
      message: "Claude reviewer consult could not run.",
    };
  }
}

function isAnswer(result: ReviewAiAnswer | ReviewAiIssue): result is ReviewAiAnswer {
  return "response" in result;
}

export async function POST(request: NextRequest) {
  let payload: ReviewAiPayload;

  try {
    payload = (await request.json()) as ReviewAiPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const contributionId = asTrimmedString(payload.contributionId);
  const provider = asTrimmedString(payload.provider) || "all";
  const question = asTrimmedString(payload.question);

  if (!contributionId) {
    return NextResponse.json({ error: "Pick a contribution to review." }, { status: 400 });
  }

  if (!question || question.length < 8) {
    return NextResponse.json(
      { error: "Ask a fuller reviewer question." },
      { status: 400 },
    );
  }

  if (question.length > 2200) {
    return NextResponse.json(
      { error: "Keep reviewer questions under 2,200 characters for this pass." },
      { status: 400 },
    );
  }

  if (!isProvider(provider)) {
    return NextResponse.json({ error: "Choose a valid AI reader." }, { status: 400 });
  }

  let contribution = await getContributionById(contributionId);

  if (!contribution) {
    return NextResponse.json({ error: "Contribution not found." }, { status: 404 });
  }

  const topic = getRoomTopicCard(contribution.roomSlug, contribution.topicId);

  if (!topic) {
    return NextResponse.json({ error: "Topic card not found." }, { status: 404 });
  }

  contribution = await refreshReadableEvidenceIfNeeded(contribution);
  const readableEvidenceText = await loadReadableEvidenceTextForAi(contribution);

  const context = buildReviewContext({
    contribution,
    topicThesis: topic.thesis,
    readableEvidenceText,
  });
  const providerCalls =
    provider === "openai"
      ? [askOpenAIReview({ context, question })]
      : provider === "anthropic"
        ? [askAnthropicReview({ context, question })]
        : [
            askOpenAIReview({ context, question }),
            askAnthropicReview({ context, question }),
          ];
  const results = await Promise.all(providerCalls);
  const answers = results.filter(isAnswer);
  const issues = results.filter((result) => !isAnswer(result)) as ReviewAiIssue[];

  return NextResponse.json({
    state: answers.length
      ? issues.length
        ? "partial"
        : "completed"
      : "error",
    disclaimer:
      "Reviewer AI consult is advisory only. It does not publish a record, change review state, or move the visible synthesis.",
    answers,
    issues,
  });
}
