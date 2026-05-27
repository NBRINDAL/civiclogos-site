import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import {
  answerReadOnlyAsk,
  askReadOnlyAnswerNote,
  detectAskIntent,
} from "@/app/lib/ask-reader";
import { routeAskCandidate } from "@/app/lib/ask-routing";
import { getAskDeploymentState } from "@/app/lib/ask-deployment-state";
import type { AskMode } from "@/app/lib/ask-types";
import { getRoomTopicCard, type IssueRoomSlug } from "@/app/lib/civic-logos";
import { buildCandidateSuggestion } from "@/app/lib/candidate-ai";
import { getPromotableContributionLane } from "@/app/lib/candidate-types";
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

const READ_ONLY_ROOM_SLUG: IssueRoomSlug = "healthcare";
const READ_ONLY_TOPIC_ID = "topic-001";
const unsupportedReadOnlyReply =
  "Civic Logos found a likely topic, but read-only ledger summaries for that topic are not built yet.";

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

  const defaultReadOnlyTopic = getRoomTopicCard(READ_ONLY_ROOM_SLUG, READ_ONLY_TOPIC_ID);

  if (!defaultReadOnlyTopic) {
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
  const detectedIntent = detectAskIntent(question);
  const [chatStoreMetadata, candidateStoreMetadata, readOnlyRoute] =
    await Promise.all([
      inspectTopicChatStoreMetadata({
        avoidPrototypeInitialization: true,
      }),
      inspectCandidateStoreMetadata({
        avoidPrototypeInitialization: true,
      }),
      detectedIntent === "candidate_intake"
        ? Promise.resolve(null)
        : routeAskCandidate(question),
    ]);
  const askDeployment = getAskDeploymentState({
    candidateStore: candidateStoreMetadata,
    chatStore: chatStoreMetadata,
    host: requestHost,
    protocol: requestProtocol,
  });
  const readOnlyChatTarget =
    readOnlyRoute?.routeType === "existing-topic"
      ? {
          roomSlug: readOnlyRoute.roomId,
          topicId: readOnlyRoute.topicId,
          topicTitle: readOnlyRoute.topicTitle,
        }
      : {
          roomSlug: READ_ONLY_ROOM_SLUG,
          topicId: READ_ONLY_TOPIC_ID,
          topicTitle: defaultReadOnlyTopic.title,
        };
  const readOnlyAnswer =
    detectedIntent === "candidate_intake"
      ? null
      : readOnlyRoute?.routeType === "existing-topic" &&
          (readOnlyRoute.roomId !== READ_ONLY_ROOM_SLUG ||
            readOnlyRoute.topicId !== READ_ONLY_TOPIC_ID)
        ? {
            intent: detectedIntent,
            answer: unsupportedReadOnlyReply,
            note: askReadOnlyAnswerNote,
            recordsUsed: [
              {
                kind: "TopicCard" as const,
                label: `${readOnlyRoute.roomId} / ${readOnlyRoute.topicId} - ${readOnlyRoute.topicTitle}`,
              },
            ],
          }
        : await answerReadOnlyAsk({
            roomSlug: READ_ONLY_ROOM_SLUG,
            topicId: READ_ONLY_TOPIC_ID,
            question,
          });
  const readOnlyTopic = readOnlyRoute?.routeType === "existing-topic"
    ? {
        roomId: readOnlyRoute.roomId,
        topicId: readOnlyRoute.topicId,
        topicTitle: readOnlyRoute.topicTitle,
        banner:
          readOnlyRoute.roomId === READ_ONLY_ROOM_SLUG &&
          readOnlyRoute.topicId === READ_ONLY_TOPIC_ID
            ? "This answer is read-only. It was generated from the public healthcare / topic-001 ledger, and no candidate was created."
            : "This answer is read-only. Civic Logos found a likely existing topic, but deterministic ledger summaries for that topic are not built yet, and no candidate was created.",
      }
    : {
        roomId: READ_ONLY_ROOM_SLUG,
        topicId: READ_ONLY_TOPIC_ID,
        topicTitle: defaultReadOnlyTopic.title,
        banner:
          "This answer is read-only. It was generated from the public healthcare / topic-001 ledger, and no candidate was created.",
      };

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
      roomSlug: readOnlyChatTarget.roomSlug,
      topicId: readOnlyChatTarget.topicId,
      topicTitle: readOnlyChatTarget.topicTitle,
      role: "user" as const,
      body: question,
      createdAt: new Date().toISOString(),
      promptCategory: "topic-chat" as const,
    };
    const assistantMessageInput = {
      sessionId,
      runId,
      roomSlug: readOnlyChatTarget.roomSlug,
      topicId: readOnlyChatTarget.topicId,
      topicTitle: readOnlyChatTarget.topicTitle,
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
            roomSlug: readOnlyChatTarget.roomSlug,
            topicId: readOnlyChatTarget.topicId,
            limit: 24,
          });
        })();

    const response = NextResponse.json({
      mode,
      intent: readOnlyAnswer.intent,
      reply: readOnlyAnswer.answer,
      topic: readOnlyTopic,
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

  const candidateRoute = await routeAskCandidate(question);
  const previousMessages = await listTopicChatMessages({
    sessionId,
    roomSlug: candidateRoute.roomId,
    topicId: candidateRoute.topicId,
    limit: 18,
  });

  const userMessage = await createTopicChatMessage({
    sessionId,
    runId,
    roomSlug: candidateRoute.roomId,
    topicId: candidateRoute.topicId,
    topicTitle: candidateRoute.topicTitle,
    role: "user",
    body: question,
    createdAt: new Date().toISOString(),
    promptCategory: "topic-chat",
  });

  const [readerResult, suggestion] = await Promise.all([
    candidateRoute.routeType === "existing-topic"
      ? (async () => {
          const preparedContext = await getTopicCardReaderContext(
            candidateRoute.roomId,
            candidateRoute.topicId,
          );

          if (!preparedContext) {
            throw new Error("The routed intake topic is unavailable.");
          }

          return askTopicCard({
            roomSlug: candidateRoute.roomId,
            topicId: candidateRoute.topicId,
            question,
            provider,
            history: [...previousMessages, userMessage],
            preparedContext,
          });
        })()
      : Promise.resolve(null),
    buildCandidateSuggestion({
      routing: candidateRoute,
      rawUserText: question,
    }),
  ]);
  const mode: AskMode = "candidate";

  const candidate = await createCandidateRecord({
    sourceMessageId: userMessage.id,
    roomId: candidateRoute.roomId,
    topicId: candidateRoute.topicId,
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
    reviewStatus:
      candidateRoute.routeType === "unrouted"
        ? "needs_routing"
        : "pending_human_review",
    routingStatus: candidateRoute.routingStatus,
    routedRoomId: candidateRoute.routedRoomId,
    routedTopicId: candidateRoute.routedTopicId,
    routeConfidence: candidateRoute.routeConfidence,
    routeReason: candidateRoute.routeReason,
    matchedSignals: candidateRoute.matchedSignals,
    rejectedRoutes: candidateRoute.rejectedRoutes,
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
    lane: getPromotableContributionLane(candidate.proposedLane),
    assignmentKind: candidate.proposedAttachmentTarget.kind,
    assignmentLabel: candidate.proposedAttachmentTarget.label,
    changedSynthesis: false,
  };

  await createTopicChatMessage({
    sessionId,
    runId,
    roomSlug: candidateRoute.roomId,
    topicId: candidateRoute.topicId,
    topicTitle: candidateRoute.topicTitle,
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
      roomSlug: candidateRoute.roomId,
      topicId: candidateRoute.topicId,
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
      roomId: candidateRoute.roomId,
      topicId: candidateRoute.topicId,
      topicTitle: candidateRoute.topicTitle,
      banner: candidateRoute.banner,
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
