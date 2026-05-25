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
  mode?: unknown;
  history?: unknown;
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

type ReviewEvidenceFile = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  base64: string;
  fileUrl?: string;
};

type ReviewHistoryMessage = {
  role: "user" | "assistant";
  provider?: "openai" | "anthropic";
  body: string;
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

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isProvider(value: string): value is "openai" | "anthropic" | "all" {
  return value === "openai" || value === "anthropic" || value === "all";
}

function isMode(value: string): value is "chat" | "synthesis" {
  return value === "chat" || value === "synthesis";
}

function normalizeHistory(value: unknown): ReviewHistoryMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .flatMap((item): ReviewHistoryMessage[] => {
      if (!item || typeof item !== "object") {
        return [];
      }

      const record = item as Record<string, unknown>;
      const role = record.role === "user" || record.role === "assistant" ? record.role : null;
      const body = asTrimmedString(record.body).slice(0, 5000);
      const provider =
        record.provider === "openai" || record.provider === "anthropic"
          ? record.provider
          : undefined;

      return role && body ? [{ role, provider, body }] : [];
    })
    .slice(-16);
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

function buildReviewContext({
  contribution,
  topicThesis,
  readableEvidenceText,
  evidenceFile,
}: {
  contribution: NonNullable<Awaited<ReturnType<typeof getContributionById>>>;
  topicThesis: string;
  readableEvidenceText?: {
    text: string;
    pageCount?: number;
    wordCount?: number;
    source: string;
  } | null;
  evidenceFile?: ReviewEvidenceFile | null;
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
        attachedEvidenceFileForAi: evidenceFile
          ? {
              fileName: evidenceFile.fileName,
              mimeType: evidenceFile.mimeType,
              sizeBytes: evidenceFile.sizeBytes,
            }
          : null,
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

async function loadEvidenceFileForAi(
  contribution: NonNullable<Awaited<ReturnType<typeof getContributionById>>>,
  origin: string,
): Promise<ReviewEvidenceFile | null> {
  const evidenceDocument = contribution.evidenceDocument;

  if (!evidenceDocument || evidenceDocument.mimeType !== "application/pdf") {
    return null;
  }

  const storedDocument = await getEvidenceDocument(evidenceDocument.id);

  if (!storedDocument || storedDocument.document.sizeBytes > 10 * 1024 * 1024) {
    return null;
  }

  return {
    fileName: storedDocument.document.fileName,
    mimeType: storedDocument.document.mimeType,
    sizeBytes: storedDocument.document.sizeBytes,
    base64: Buffer.from(storedDocument.bytes).toString("base64"),
    fileUrl: new URL(storedDocument.document.downloadHref, origin).toString(),
  };
}

function getReviewInstructions() {
  return [
    "You are a Civic Logos reviewer assistant.",
    "You do not decide truth, legitimacy, or the final review outcome.",
    "Help a human reviewer interrogate one contribution against the current topic card.",
    "Separate notation, definitions, assumptions, evidence, predictions, and synthesis pressure.",
    "If attachedEvidenceFileForAi is present, the uploaded evidence PDF is attached to this same model request as a file input.",
    "If readableEvidenceTextForAi is present in the context, treat it as the uploaded document text even if a stored extraction status is stale or says error.",
    "If an evidence PDF is attached, inspect it directly before saying the paper is unavailable.",
    "If no attached PDF and no readable document text are available, say that clearly and reason only from the visible contribution metadata.",
    "Do not recommend changing the visible synthesis unless you can name the exact claim that would change and what remains unresolved.",
    "Give concrete review guidance: likely attachment target, what to check next, and a cautious public note if useful.",
  ].join(" ");
}

function buildHistoryBlock(history: ReviewHistoryMessage[]) {
  if (!history.length) {
    return "No prior reviewer chat turns in this session.";
  }

  return history
    .map((item) => {
      const label =
        item.role === "user"
          ? "Reviewer"
          : item.provider === "openai"
            ? "GPT reviewer assistant"
            : item.provider === "anthropic"
              ? "Claude reviewer assistant"
              : "Reviewer assistant";

      return `${label}: ${item.body}`;
    })
    .join("\n\n");
}

function getReviewerQuestion(mode: "chat" | "synthesis", question: string) {
  if (mode === "chat") {
    return question;
  }

  return [
    "Synthesize the reviewer chat so far into draft human-review material.",
    "Do not change review state and do not decide truth.",
    "Return concise sections:",
    "- Recommended review status",
    "- Recommended attachment layer",
    "- Actual card change recommendation",
    "- Public record note draft",
    "- Decision reason draft",
    "- Reviewer note / unresolved checks",
    "- Whether any visible synthesis update is warranted now",
    "",
    question ? `Additional reviewer instruction: ${question}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildReviewerTextPrompt({
  context,
  question,
  history,
  mode,
}: {
  context: string;
  question: string;
  history: ReviewHistoryMessage[];
  mode: "chat" | "synthesis";
}) {
  return [
    mode === "synthesis"
      ? "Reviewer task: synthesize the discussion for human review."
      : "Reviewer question:",
    getReviewerQuestion(mode, question),
    "",
    "Prior reviewer conversation:",
    buildHistoryBlock(history),
    "",
    "Contribution review context:",
    context,
  ].join("\n");
}

function buildOpenAIReviewContent({
  context,
  question,
  evidenceFile,
  history,
  mode,
  fileMode = "url",
}: {
  context: string;
  question: string;
  evidenceFile?: ReviewEvidenceFile | null;
  history: ReviewHistoryMessage[];
  mode: "chat" | "synthesis";
  fileMode?: "url" | "base64" | "none";
}) {
  const content: Array<Record<string, string>> = [];

  if (evidenceFile && fileMode === "url" && evidenceFile.fileUrl) {
    content.push({
      type: "input_file",
      filename: evidenceFile.fileName,
      file_url: evidenceFile.fileUrl,
    });
  } else if (evidenceFile && fileMode === "base64") {
    content.push({
      type: "input_file",
      filename: evidenceFile.fileName,
      file_data: `data:${evidenceFile.mimeType};base64,${evidenceFile.base64}`,
    });
  }

  content.push({
    type: "input_text",
    text: buildReviewerTextPrompt({ context, question, history, mode }),
  });

  return content;
}

function buildAnthropicReviewContent({
  context,
  question,
  evidenceFile,
  history,
  mode,
}: {
  context: string;
  question: string;
  evidenceFile?: ReviewEvidenceFile | null;
  history: ReviewHistoryMessage[];
  mode: "chat" | "synthesis";
}) {
  const content: Array<Record<string, unknown>> = [];

  if (evidenceFile) {
    content.push({
      type: "document",
      source: {
        type: "base64",
        media_type: evidenceFile.mimeType,
        data: evidenceFile.base64,
      },
    });
  }

  content.push({
    type: "text",
    text: buildReviewerTextPrompt({ context, question, history, mode }),
  });

  return content;
}

async function askOpenAIReview({
  context,
  question,
  evidenceFile,
  history,
  mode,
}: {
  context: string;
  question: string;
  evidenceFile?: ReviewEvidenceFile | null;
  history: ReviewHistoryMessage[];
  mode: "chat" | "synthesis";
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
    const callOpenAI = (fileMode: "url" | "base64" | "none") =>
      fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          store: false,
          max_output_tokens: 1200,
          instructions: getReviewInstructions(),
          input: [
            {
              role: "user",
              content: buildOpenAIReviewContent({
                context,
                question,
                evidenceFile,
                history,
                mode,
                fileMode,
              }),
            },
          ],
        }),
      });
    const initialMode = evidenceFile?.fileUrl ? "url" : evidenceFile ? "base64" : "none";
    const response = await callOpenAI(initialMode);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI reviewer consult failed", errorText);
      const retryMode = initialMode === "url" && evidenceFile ? "base64" : "none";
      const retryResponse = await callOpenAI(retryMode);

      if (!retryResponse.ok) {
        console.error("OpenAI reviewer consult fallback failed", await retryResponse.text());

        return {
          provider: "openai",
          model,
          message: "OpenAI reviewer consult failed. Claude can still be used for PDF-aware review.",
        };
      }

      const retryPayload = (await retryResponse.json()) as OpenAIResponse;
      const retryText = extractOpenAIText(retryPayload);

      if (retryText) {
        return {
          provider: "openai",
          model,
          response: retryText,
          generatedAt: new Date().toISOString(),
        };
      }

      return {
        provider: "openai",
        model,
        message:
          "OpenAI reviewer consult returned no text after retry. Claude can still be used for PDF-aware review.",
      };
    }

    const payload = (await response.json()) as OpenAIResponse;
    const responseText = extractOpenAIText(payload);

    if (!responseText && evidenceFile && initialMode !== "base64") {
      const retryResponse = await callOpenAI("base64");

      if (retryResponse.ok) {
        const retryPayload = (await retryResponse.json()) as OpenAIResponse;
        const retryText = extractOpenAIText(retryPayload);

        if (retryText) {
          return {
            provider: "openai",
            model,
            response: retryText,
            generatedAt: new Date().toISOString(),
          };
        }
      } else {
        console.error(
          "OpenAI reviewer consult no-text fallback failed",
          await retryResponse.text(),
        );
      }
    }

    if (!responseText) {
      return {
        provider: "openai",
        model,
        message:
          "OpenAI reviewer consult returned no text. Claude can still be used for PDF-aware review.",
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
  evidenceFile,
  history,
  mode,
}: {
  context: string;
  question: string;
  evidenceFile?: ReviewEvidenceFile | null;
  history: ReviewHistoryMessage[];
  mode: "chat" | "synthesis";
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
        max_tokens: 1200,
        system: getReviewInstructions(),
        messages: [
          {
            role: "user",
            content: buildAnthropicReviewContent({
              context,
              question,
              evidenceFile,
              history,
              mode,
            }),
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
  const mode = asTrimmedString(payload.mode) || "chat";
  const history = normalizeHistory(payload.history);

  if (!contributionId) {
    return NextResponse.json({ error: "Pick a contribution to review." }, { status: 400 });
  }

  if (!isMode(mode)) {
    return NextResponse.json({ error: "Choose a valid reviewer mode." }, { status: 400 });
  }

  if (mode === "chat" && (!question || question.length < 8)) {
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
  const evidenceFile = await loadEvidenceFileForAi(
    contribution,
    request.nextUrl.origin,
  );

  const context = buildReviewContext({
    contribution,
    topicThesis: topic.thesis,
    readableEvidenceText,
    evidenceFile,
  });
  const providerCalls =
    provider === "openai"
      ? [askOpenAIReview({ context, question, evidenceFile, history, mode })]
      : provider === "anthropic"
        ? [askAnthropicReview({ context, question, evidenceFile, history, mode })]
        : [
            askOpenAIReview({ context, question, evidenceFile, history, mode }),
            askAnthropicReview({ context, question, evidenceFile, history, mode }),
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
