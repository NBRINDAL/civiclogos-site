import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import {
  answerReadOnlyAsk,
  askReadOnlyAnswerNote,
} from "@/app/lib/ask-reader";
import { getAskDeploymentState } from "@/app/lib/ask-deployment-state";
import type { AskMode } from "@/app/lib/ask-types";
import { getRoomTopicCard, type IssueRoomSlug } from "@/app/lib/civic-logos";
import { buildCandidateSuggestion } from "@/app/lib/candidate-ai";
import {
  createCandidateRecord,
  inspectCandidateStoreMetadata,
} from "@/app/lib/candidate-store";
import { shouldUseSecureCookies } from "@/app/lib/cookie-security";
import { getAskSessionCookieName, isAskSessionId, createAskSessionId } from "@/app/lib/ask-session";
import {
  createTopicChatMessage,
  inspectTopicChatStoreMetadata,
  listTopicChatMessages,
} from "@/app/lib/topic-chat-store";
import { askTopicCard, getTopicCardReaderContext } from "@/app/lib/topic-ai";
import { enforceWriteRequestSafety } from "@/app/lib/request-security";
import { throttleRequest } from "@/app/lib/request-throttle";
import { NextRequest, NextResponse } from "next/server";
import type { TopicChatPromotion } from "@/app/lib/topic-chat-types";

export const runtime = "nodejs";

const ASK_ROOM_SLUG: IssueRoomSlug = "healthcare";
const ASK_TOPIC_ID = "topic-001";

type AskPayload = {
  question?: unknown;
  provider?: unknown;
};

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isProvider(value: string): value is "openai" | "anthropic" | "all" {
  return value === "openai" || value === "anthropic" || value === "all";
}

export async function POST(request: NextRequest) {
  const unsafeRequest = enforceWriteRequestSafety(request, 16 * 1024);

  if (unsafeRequest) {
    return unsafeRequest;
  }

  const throttled = throttleRequest(request, {
    bucket: "ask-ai",
    limit: 24,
    windowMs: 60 * 60 * 1000,
  });

  if (throttled) {
    return throttled;
  }

  let payload: AskPayload;

  try {
    payload = (await request.json()) as AskPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const question = asTrimmedString(payload.question);
  const provider = asTrimmedString(payload.provider) || "openai";

  if (!question || question.length < 8) {
    return NextResponse.json(
      {
        error:
          "Write a fuller message so Civic Logos can answer from the ledger or structure a real candidate.",
      },
      { status: 400 },
    );
  }

  if (question.length > 2500) {
    return NextResponse.json(
      {
        error:
          "Keep the message under 2,500 characters so Civic Logos can answer or structure it cleanly.",
      },
      { status: 400 },
    );
  }

  if (!isProvider(provider)) {
    return NextResponse.json({ error: "Choose a valid provider." }, { status: 400 });
  }

  const topic = getRoomTopicCard(ASK_ROOM_SLUG, ASK_TOPIC_ID);

  if (!topic) {
    return NextResponse.json({ error: "The live healthcare intake topic is unavailable." }, { status: 404 });
  }

  const existingSessionId = request.cookies.get(getAskSessionCookieName())?.value;
  const sessionId = existingSessionId && isAskSessionId(existingSessionId)
    ? existingSessionId
    : createAskSessionId();
  const runId = randomUUID();
  const requestHost =
    request.headers.get("x-forwarded-host") ?? request.nextUrl.host;
  const requestProtocol =
    request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol;
  const [chatStoreMetadata, candidateStoreMetadata, readOnlyAnswer] =
    await Promise.all([
    inspectTopicChatStoreMetadata({
      avoidPrototypeInitialization: true,
    }),
    inspectCandidateStoreMetadata({
      avoidPrototypeInitialization: true,
    }),
    answerReadOnlyAsk({
      roomSlug: ASK_ROOM_SLUG,
      topicId: ASK_TOPIC_ID,
      question,
    }),
    ]);
  const askDeployment = getAskDeploymentState({
    candidateStore: candidateStoreMetadata,
    chatStore: chatStoreMetadata,
    host: requestHost,
    protocol: requestProtocol,
  });

  if (readOnlyAnswer) {
    const mode: AskMode = "read-only";
    const assistantPromotion: TopicChatPromotion = {
      state: "read-only-answer",
      note: askReadOnlyAnswerNote,
      actualCardChange: false,
      publicSubmission: false,
      changedSynthesis: false,
      readOnlyIntent: readOnlyAnswer.intent,
      recordsUsed: readOnlyAnswer.recordsUsed,
    };
    const userMessageInput = {
      sessionId,
      runId,
      roomSlug: ASK_ROOM_SLUG,
      topicId: ASK_TOPIC_ID,
      topicTitle: topic.title,
      role: "user" as const,
      body: question,
      createdAt: new Date().toISOString(),
      promptCategory: "topic-chat" as const,
    };
    const assistantMessageInput = {
      sessionId,
      runId,
      roomSlug: ASK_ROOM_SLUG,
      topicId: ASK_TOPIC_ID,
      topicTitle: topic.title,
      role: "assistant" as const,
      body: readOnlyAnswer.answer,
      createdAt: new Date().toISOString(),
      promptCategory: "topic-chat" as const,
      promotion: assistantPromotion,
    };

    const messages = askDeployment.prototypeReadOnlyMode
      ? [
          {
            ...userMessageInput,
            id: randomUUID(),
          },
          {
            ...assistantMessageInput,
            id: randomUUID(),
          },
        ]
      : await (async () => {
          await createTopicChatMessage(userMessageInput);
          await createTopicChatMessage(assistantMessageInput);

          return listTopicChatMessages({
            sessionId,
            roomSlug: ASK_ROOM_SLUG,
            topicId: ASK_TOPIC_ID,
            limit: 24,
          });
        })();

    const response = NextResponse.json({
      mode,
      intent: readOnlyAnswer.intent,
      reply: readOnlyAnswer.answer,
      topic: {
        roomId: ASK_ROOM_SLUG,
        topicId: ASK_TOPIC_ID,
        topicTitle: topic.title,
        banner:
          "Current topic: healthcare / topic-001. This intake is hard-gated to the live healthcare card for the first Civic Logos V2 demo.",
      },
      candidate: null,
      readOnly: {
        intent: readOnlyAnswer.intent,
        note: readOnlyAnswer.note,
        recordsUsed: readOnlyAnswer.recordsUsed,
      },
      messages,
      store: {
        chat: chatStoreMetadata,
        candidate: candidateStoreMetadata,
      },
      safeguards: {
        publicLedgerWrite: false,
        publicContributionCountChange: false,
        revisionEventCreated: false,
        synthesisChanged: false,
      },
      issues: [],
    });

    if (!existingSessionId && !askDeployment.prototypeReadOnlyMode) {
      response.cookies.set({
        name: getAskSessionCookieName(),
        value: sessionId,
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: shouldUseSecureCookies({
          protocol: requestProtocol,
          host: requestHost,
        }),
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return response;
  }

  if (!askDeployment.candidateIntakeEnabled) {
    return NextResponse.json(
      {
        error:
          askDeployment.notice ??
          "Prototype read-only mode: durable storage is not configured. Candidate submission is disabled until persistent storage is active.",
      },
      { status: 503 },
    );
  }

  const previousMessages = await listTopicChatMessages({
    sessionId,
    roomSlug: ASK_ROOM_SLUG,
    topicId: ASK_TOPIC_ID,
    limit: 18,
  });

  const userMessage = await createTopicChatMessage({
    sessionId,
    runId,
    roomSlug: ASK_ROOM_SLUG,
    topicId: ASK_TOPIC_ID,
    topicTitle: topic.title,
    role: "user",
    body: question,
    createdAt: new Date().toISOString(),
    promptCategory: "topic-chat",
  });

  const preparedContext = await getTopicCardReaderContext(ASK_ROOM_SLUG, ASK_TOPIC_ID);

  if (!preparedContext) {
    return NextResponse.json({ error: "The live healthcare intake topic is unavailable." }, { status: 404 });
  }

  const [readerResult, suggestion] = await Promise.all([
    askTopicCard({
      roomSlug: ASK_ROOM_SLUG,
      topicId: ASK_TOPIC_ID,
      question,
      provider,
      history: [...previousMessages, userMessage],
      preparedContext,
    }),
    buildCandidateSuggestion({
      roomSlug: ASK_ROOM_SLUG,
      topicId: ASK_TOPIC_ID,
      rawUserText: question,
    }),
  ]);
  const mode: AskMode = "candidate";

  const candidate = await createCandidateRecord({
    sourceMessageId: userMessage.id,
    roomId: ASK_ROOM_SLUG,
    topicId: ASK_TOPIC_ID,
    rawUserText: question,
    normalizedTitle: suggestion.draft.normalized_title,
    normalizedBody: suggestion.draft.normalized_body,
    proposedLane: suggestion.draft.proposed_lane,
    proposedAttachmentTarget: {
      kind: suggestion.draft.proposed_attachment_target_kind,
      label: suggestion.draft.proposed_attachment_target_label,
    },
    scaleMap: suggestion.draft.scale_map,
    evidenceStatus: suggestion.draft.evidence_status,
    evidenceAnchor: suggestion.draft.evidence_anchor,
    evidentialDistance: suggestion.draft.evidential_distance,
    impactField: suggestion.draft.impact_field,
    internalAiNotes: [suggestion.note],
    aiAssisted: true,
    origin: "human_submitted_via_ai_intake",
  });
  revalidatePath("/review/contributions");

  const firstAnswer = readerResult?.answers[0];
  const aiReply =
    suggestion.note.shortReply ||
    firstAnswer?.response ||
    "Civic Logos structured an internal candidate for human review. The public ledger did not change.";
  const promotion: TopicChatPromotion = {
    state: "candidate-suggested",
    note: aiReply,
    candidateId: candidate.id,
    candidateReviewStatus: candidate.reviewStatus,
    actualCardChange: false,
    publicSubmission: false,
    lane: candidate.proposedLane,
    assignmentKind: candidate.proposedAttachmentTarget.kind,
    assignmentLabel: candidate.proposedAttachmentTarget.label,
    changedSynthesis: false,
  };

  await createTopicChatMessage({
    sessionId,
    runId,
    roomSlug: ASK_ROOM_SLUG,
    topicId: ASK_TOPIC_ID,
    topicTitle: topic.title,
    role: "assistant",
    provider: firstAnswer?.provider,
    model: firstAnswer?.model,
    body: aiReply,
    createdAt: firstAnswer?.generatedAt ?? new Date().toISOString(),
    promptCategory: "topic-chat",
    promotion,
  });

  const [messages, chatStore, candidateStore] = await Promise.all([
    listTopicChatMessages({
      sessionId,
      roomSlug: ASK_ROOM_SLUG,
      topicId: ASK_TOPIC_ID,
      limit: 24,
    }),
    inspectTopicChatStoreMetadata(),
    inspectCandidateStoreMetadata(),
  ]);

  const response = NextResponse.json({
    mode,
    intent: "candidate_intake",
    reply: aiReply,
    topic: {
      roomId: ASK_ROOM_SLUG,
      topicId: ASK_TOPIC_ID,
      topicTitle: topic.title,
      banner:
        "Current topic: healthcare / topic-001. This intake is hard-gated to the live healthcare card for the first Civic Logos V2 demo.",
    },
    candidate: {
      ...candidate,
      actualCardChange: false,
      publicSubmission: false,
    },
    readOnly: null,
    messages,
    store: {
      chat: chatStore,
      candidate: candidateStore,
    },
    safeguards: {
      publicLedgerWrite: false,
      publicContributionCountChange: false,
      revisionEventCreated: false,
      synthesisChanged: false,
    },
    issues: readerResult?.issues ?? [],
  });

  if (!existingSessionId) {
    response.cookies.set({
      name: getAskSessionCookieName(),
      value: sessionId,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: shouldUseSecureCookies({
        protocol: requestProtocol,
        host: requestHost,
      }),
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return response;
}
