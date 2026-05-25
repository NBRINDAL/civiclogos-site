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
import {
  createReviewChatMessage,
  getReviewChatStoreMetadata,
  listReviewChatMessages,
} from "@/app/lib/review-chat-store";
import type { ReviewChatMessage } from "@/app/lib/review-chat-types";
import { listReviewEvidenceRecords } from "@/app/lib/review-evidence-store";
import type { ReviewEvidenceRecord } from "@/app/lib/review-evidence-types";
import {
  isValidMaintainerSessionValue,
  maintainerSessionCookieName,
} from "@/app/lib/maintainer-auth";
import { enforceWriteRequestSafety } from "@/app/lib/request-security";
import { throttleRequest } from "@/app/lib/request-throttle";

export const runtime = "nodejs";

const reviewAnswerTokenBudget = 2800;

type ReviewAiPayload = {
  contributionId?: unknown;
  provider?: unknown;
  question?: unknown;
  mode?: unknown;
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
  source: "contributor" | "reviewer";
  label: string;
  note?: string;
  visibility?: string;
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

function toHistory(messages: ReviewChatMessage[]): ReviewHistoryMessage[] {
  return messages.slice(-16).map((item) => ({
    role: item.role,
    provider: item.provider,
    body: item.body.slice(0, 5000),
  }));
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
  evidenceFiles,
  reviewerEvidenceRecords,
}: {
  contribution: NonNullable<Awaited<ReturnType<typeof getContributionById>>>;
  topicThesis: string;
  readableEvidenceText?: {
    text: string;
    pageCount?: number;
    wordCount?: number;
    source: string;
  } | null;
  evidenceFiles: ReviewEvidenceFile[];
  reviewerEvidenceRecords: ReviewEvidenceRecord[];
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
        attachedEvidenceFilesForAi: evidenceFiles.map((file) => ({
          source: file.source,
          label: file.label,
          visibility: file.visibility ?? null,
          fileName: file.fileName,
          mimeType: file.mimeType,
          sizeBytes: file.sizeBytes,
        })),
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
      reviewerEvidenceDocket: reviewerEvidenceRecords.map((record) => ({
        id: record.id,
        label: record.label,
        reviewerLabel: record.reviewerLabel,
        visibility: record.visibility,
        note: record.note ?? null,
        createdAt: record.createdAt,
        document: {
          fileName: record.document.fileName,
          mimeType: record.document.mimeType,
          sizeBytes: record.document.sizeBytes,
          extraction: record.document.extraction,
        },
      })),
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
    source: "contributor",
    label: "Contributor-uploaded evidence",
    fileName: storedDocument.document.fileName,
    mimeType: storedDocument.document.mimeType,
    sizeBytes: storedDocument.document.sizeBytes,
    base64: Buffer.from(storedDocument.bytes).toString("base64"),
    fileUrl: new URL(storedDocument.document.downloadHref, origin).toString(),
  };
}

async function loadReviewerEvidenceFilesForAi(
  records: ReviewEvidenceRecord[],
  origin: string,
): Promise<ReviewEvidenceFile[]> {
  const files: ReviewEvidenceFile[] = [];
  let totalBytes = 0;

  for (const record of records) {
    if (record.document.mimeType !== "application/pdf") {
      continue;
    }

    if (record.document.sizeBytes > 10 * 1024 * 1024) {
      continue;
    }

    if (files.length >= 4 || totalBytes + record.document.sizeBytes > 24 * 1024 * 1024) {
      break;
    }

    const storedDocument = await getEvidenceDocument(record.document.id);

    if (!storedDocument) {
      continue;
    }

    totalBytes += storedDocument.document.sizeBytes;
    files.push({
      source: "reviewer",
      label: record.label,
      note: record.note,
      visibility: record.visibility,
      fileName: storedDocument.document.fileName,
      mimeType: storedDocument.document.mimeType,
      sizeBytes: storedDocument.document.sizeBytes,
      base64: Buffer.from(storedDocument.bytes).toString("base64"),
      fileUrl: new URL(storedDocument.document.downloadHref, origin).toString(),
    });
  }

  return files;
}

function getReviewInstructions() {
  return [
    "You are a Civic Logos reviewer assistant.",
    "You do not decide truth, legitimacy, or the final review outcome.",
    "Help a human reviewer interrogate one contribution against the current topic card.",
    "Separate notation, definitions, assumptions, evidence, predictions, and synthesis pressure.",
    "Attached evidence files can include contributor-submitted evidence and reviewer-supplied docket evidence. Keep those provenances separate.",
    "If attachedEvidenceFilesForAi is present, the evidence PDFs are attached to this same model request as file inputs.",
    "If readableEvidenceTextForAi is present in the context, treat it as the uploaded document text even if a stored extraction status is stale or says error.",
    "If evidence PDFs are attached, inspect them directly before saying a paper is unavailable.",
    "If no attached PDF and no readable document text are available, say that clearly and reason only from the visible contribution metadata.",
    "Do not recommend changing the visible synthesis unless you can name the exact claim that would change and what remains unresolved.",
    "Give complete answers. If the review is complex, prioritize the most important checks rather than ending mid-sentence.",
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
  evidenceFiles,
  history,
  mode,
  fileMode = "url",
}: {
  context: string;
  question: string;
  evidenceFiles: ReviewEvidenceFile[];
  history: ReviewHistoryMessage[];
  mode: "chat" | "synthesis";
  fileMode?: "url" | "base64" | "none";
}) {
  const content: Array<Record<string, string>> = [];

  if (fileMode === "url") {
    evidenceFiles
      .filter((file) => file.fileUrl)
      .forEach((file) => {
        content.push({
          type: "input_file",
          filename: `${file.source}-${file.fileName}`,
          file_url: file.fileUrl!,
        });
      });
  } else if (fileMode === "base64") {
    evidenceFiles.forEach((file) => {
      content.push({
        type: "input_file",
        filename: `${file.source}-${file.fileName}`,
        file_data: `data:${file.mimeType};base64,${file.base64}`,
      });
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
  evidenceFiles,
  history,
  mode,
}: {
  context: string;
  question: string;
  evidenceFiles: ReviewEvidenceFile[];
  history: ReviewHistoryMessage[];
  mode: "chat" | "synthesis";
}) {
  const content: Array<Record<string, unknown>> = [];

  evidenceFiles.forEach((file) => {
    content.push({
      type: "document",
      source: {
        type: "base64",
        media_type: file.mimeType,
        data: file.base64,
      },
      title: `${file.source}: ${file.label}`,
    });
  });

  content.push({
    type: "text",
    text: buildReviewerTextPrompt({ context, question, history, mode }),
  });

  return content;
}

async function askOpenAIReview({
  context,
  question,
  evidenceFiles,
  history,
  mode,
}: {
  context: string;
  question: string;
  evidenceFiles: ReviewEvidenceFile[];
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
          max_output_tokens: reviewAnswerTokenBudget,
          instructions: getReviewInstructions(),
          input: [
            {
              role: "user",
              content: buildOpenAIReviewContent({
                context,
                question,
                evidenceFiles,
                history,
                mode,
                fileMode,
              }),
            },
          ],
        }),
      });
    const initialMode =
      evidenceFiles.length && evidenceFiles.every((file) => file.fileUrl)
        ? "url"
        : evidenceFiles.length
          ? "base64"
          : "none";
    const response = await callOpenAI(initialMode);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI reviewer consult failed", errorText);
      const retryMode = initialMode === "url" && evidenceFiles.length ? "base64" : "none";
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

    if (!responseText && evidenceFiles.length && initialMode !== "base64") {
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
  evidenceFiles,
  history,
  mode,
}: {
  context: string;
  question: string;
  evidenceFiles: ReviewEvidenceFile[];
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
        max_tokens: reviewAnswerTokenBudget,
        system: getReviewInstructions(),
        messages: [
          {
            role: "user",
            content: buildAnthropicReviewContent({
              context,
              question,
              evidenceFiles,
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
  const unsafeRequest = enforceWriteRequestSafety(request, 16 * 1024);

  if (unsafeRequest) {
    return unsafeRequest;
  }

  if (
    !isValidMaintainerSessionValue(
      request.cookies.get(maintainerSessionCookieName)?.value,
    )
  ) {
    return NextResponse.json(
      { error: "Maintainer access is required for reviewer AI consults." },
      { status: 401 },
    );
  }

  const throttled = throttleRequest(request, {
    bucket: "reviewer-ai",
    limit: 60,
    windowMs: 60 * 60 * 1000,
  });

  if (throttled) {
    return throttled;
  }

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

  if (mode === "chat") {
    await createReviewChatMessage({
      contributionId,
      role: "user",
      body: question,
      createdAt: new Date().toISOString(),
      mode,
    });
  }

  const storedHistory = await listReviewChatMessages({
    contributionId,
    limit: 40,
  });
  const history = toHistory(storedHistory);

  contribution = await refreshReadableEvidenceIfNeeded(contribution);
  const reviewerEvidenceRecords = await listReviewEvidenceRecords({
    contributionId,
    limit: 20,
  });
  const readableEvidenceText = await loadReadableEvidenceTextForAi(contribution);
  const contributorEvidenceFile = await loadEvidenceFileForAi(
    contribution,
    request.nextUrl.origin,
  );
  const reviewerEvidenceFiles = await loadReviewerEvidenceFilesForAi(
    reviewerEvidenceRecords,
    request.nextUrl.origin,
  );
  const evidenceFiles = [
    ...(contributorEvidenceFile ? [contributorEvidenceFile] : []),
    ...reviewerEvidenceFiles,
  ];

  const context = buildReviewContext({
    contribution,
    topicThesis: topic.thesis,
    readableEvidenceText,
    evidenceFiles,
    reviewerEvidenceRecords,
  });
  const providerCalls =
    provider === "openai"
      ? [askOpenAIReview({ context, question, evidenceFiles, history, mode })]
      : provider === "anthropic"
        ? [askAnthropicReview({ context, question, evidenceFiles, history, mode })]
        : [
            askOpenAIReview({ context, question, evidenceFiles, history, mode }),
            askAnthropicReview({ context, question, evidenceFiles, history, mode }),
          ];
  const results = await Promise.all(providerCalls);
  const answers = results.filter(isAnswer);
  const issues = results.filter((result) => !isAnswer(result)) as ReviewAiIssue[];
  const savedAnswers = await Promise.all(
    answers.map((answer) =>
      createReviewChatMessage({
        contributionId,
        role: "assistant",
        provider: answer.provider,
        model: answer.model ?? "reviewer-ai",
        body: answer.response,
        createdAt: answer.generatedAt,
        mode,
      }),
    ),
  );
  const [messages, storeMetadata] = await Promise.all([
    listReviewChatMessages({
      contributionId,
      limit: 40,
    }),
    getReviewChatStoreMetadata(),
  ]);

  return NextResponse.json({
    state: answers.length
      ? issues.length
        ? "partial"
        : "completed"
      : "error",
    disclaimer:
      "Reviewer AI consult is advisory only. It does not publish a record, change review state, or move the visible synthesis.",
    answers: savedAnswers.map((message) => ({
      provider: message.provider ?? "openai",
      model: message.model ?? "reviewer-ai",
      response: message.body,
      generatedAt: message.createdAt,
    })),
    issues,
    messages,
    store: storeMetadata,
  });
}
