import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import {
  getRoomTopicCard,
  issueRooms,
  type IssueRoomSlug,
} from "@/app/lib/civic-logos";
import { buildCandidateSuggestion } from "@/app/lib/candidate-ai";
import { getPromotableContributionLane } from "@/app/lib/candidate-types";
import { createCandidateRecord } from "@/app/lib/candidate-store";
import {
  askTopicCard,
  getTopicCardReaderContext,
  type TopicAiAnswer,
} from "@/app/lib/topic-ai";
import { buildTopicChatPromotionProposal } from "@/app/lib/topic-chat-promotion";
import {
  createTopicChatSessionId,
  getTopicChatSessionCookieName,
  isTopicChatSessionId,
} from "@/app/lib/topic-chat-session";
import { shouldUseSecureCookies } from "@/app/lib/cookie-security";
import {
  createTopicChatMessage,
  getTopicChatStoreMetadata,
  listTopicChatMessages,
} from "@/app/lib/topic-chat-store";
import type { TopicChatPromotion } from "@/app/lib/topic-chat-types";
import { enforceWriteRequestSafety } from "@/app/lib/request-security";
import { throttleRequest } from "@/app/lib/request-throttle";

export const runtime = "nodejs";

type TopicAiPayload = {
  roomSlug?: unknown;
  topicId?: unknown;
  question?: unknown;
  provider?: unknown;
};

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isRoomSlug(value: string): value is IssueRoomSlug {
  return value in issueRooms;
}

function isProvider(value: string): value is "openai" | "anthropic" | "all" {
  return value === "openai" || value === "anthropic" || value === "all";
}

function revalidateReviewerQueue() {
  revalidatePath("/review/contributions");
}

async function suggestAnswerCandidate(args: {
  roomSlug: IssueRoomSlug;
  topicId: string;
  question: string;
  answer: TopicAiAnswer;
  providerRequest: "openai" | "anthropic" | "all";
  context: string;
  sourceMessageId: string;
  promotionAlreadyUsed: boolean;
}) {
  const proposal = await buildTopicChatPromotionProposal({
    provider: args.answer.provider,
    question: args.question,
    answer: args.answer.response,
    context: args.context,
  });

  if (!proposal || proposal.decision === "none") {
    return {
      usedPromotionSlot: args.promotionAlreadyUsed,
      promotion: {
        state: "not-added",
        note:
          "This AI answer remained exploratory. Civic Logos did not create a public ledger record or a candidate suggestion from this turn.",
      } satisfies TopicChatPromotion,
    };
  }

  if (args.providerRequest === "all" && args.promotionAlreadyUsed) {
    return {
      usedPromotionSlot: true,
      promotion: {
        state: "not-added",
        note:
          "Parallel-AI mode kept this turn comparative after one internal candidate suggestion was already captured from the same message.",
      } satisfies TopicChatPromotion,
    };
  }

  const topicCard = getRoomTopicCard(args.roomSlug, args.topicId);

  if (!topicCard) {
    return {
      usedPromotionSlot: false,
      promotion: {
        state: "not-added",
        note: "The current topic card could not be loaded for internal candidate suggestion.",
      } satisfies TopicChatPromotion,
    };
  }

  const suggestion = await buildCandidateSuggestion({
    routing: {
      routeType: "existing-topic",
      roomId: args.roomSlug,
      topicId: args.topicId,
      topicTitle: topicCard.title,
      banner: `Attached to existing topic: ${args.roomSlug} / ${args.topicId}. Candidate only, pending human review, with no public ledger write.`,
      routingStatus: "routed",
      routedRoomId: args.roomSlug,
      routedTopicId: args.topicId,
      routeConfidence: "high",
      routeReason:
        "Attached to an existing topic-scoped AI session before human review.",
      matchedSignals: [`topic-scoped:${args.roomSlug}/${args.topicId}`],
      rejectedRoutes: [],
    },
    rawUserText: args.question,
  });
  const candidate = await createCandidateRecord({
    sourceMessageId: args.sourceMessageId,
    roomId: args.roomSlug,
    topicId: args.topicId,
    rawUserText: args.question,
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
    routingStatus: "routed",
    routedRoomId: args.roomSlug,
    routedTopicId: args.topicId,
    routeConfidence: "high",
    routeReason:
      "Candidate suggestion came from an existing topic-scoped AI session and remains pending human review.",
    matchedSignals: [`topic-scoped:${args.roomSlug}/${args.topicId}`],
    rejectedRoutes: [],
    aiAssisted: true,
    origin: "human_submitted_via_ai_intake",
  });
  revalidateReviewerQueue();

  return {
    usedPromotionSlot: true,
    promotion: {
      state: "candidate-suggested",
      note:
        suggestion.note.shortReply ||
        "This turn produced an internal candidate suggestion for human review. The public ledger did not change.",
      candidateId: candidate.id,
      candidateReviewStatus: candidate.reviewStatus,
      actualCardChange: false,
      publicSubmission: false,
      lane: getPromotableContributionLane(candidate.proposedLane),
      assignmentKind: candidate.proposedAttachmentTarget.kind,
      assignmentLabel: candidate.proposedAttachmentTarget.label,
      changedSynthesis: false,
    } satisfies TopicChatPromotion,
  };
}

export async function POST(request: NextRequest) {
  const unsafeRequest = enforceWriteRequestSafety(request, 16 * 1024);

  if (unsafeRequest) {
    return unsafeRequest;
  }

  const throttled = throttleRequest(request, {
    bucket: "topic-ai",
    limit: 24,
    windowMs: 60 * 60 * 1000,
  });

  if (throttled) {
    return throttled;
  }

  let payload: TopicAiPayload;

  try {
    payload = (await request.json()) as TopicAiPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const roomSlug = asTrimmedString(payload.roomSlug);
  const topicId = asTrimmedString(payload.topicId);
  const question = asTrimmedString(payload.question);
  const provider = asTrimmedString(payload.provider) || "all";

  if (!roomSlug || !isRoomSlug(roomSlug)) {
    return NextResponse.json({ error: "Pick a valid room." }, { status: 400 });
  }

  if (!topicId) {
    return NextResponse.json({ error: "Pick a valid topic card." }, { status: 400 });
  }

  if (!question || question.length < 8) {
    return NextResponse.json(
      { error: "Ask a fuller question so the topic AIs have something real to respond to." },
      { status: 400 },
    );
  }

  if (question.length > 2500) {
    return NextResponse.json(
      { error: "Keep the question under 2,500 characters for this first AI pass." },
      { status: 400 },
    );
  }

  if (!isProvider(provider)) {
    return NextResponse.json({ error: "Choose a valid provider." }, { status: 400 });
  }

  const topic = getRoomTopicCard(roomSlug, topicId);

  if (!topic) {
    return NextResponse.json({ error: "Unknown topic card." }, { status: 404 });
  }

  const preparedContext = await getTopicCardReaderContext(roomSlug, topicId);

  if (!preparedContext) {
    return NextResponse.json({ error: "Unknown topic card." }, { status: 404 });
  }

  const existingSessionId = request.cookies.get(getTopicChatSessionCookieName())?.value;
  const sessionId = existingSessionId && isTopicChatSessionId(existingSessionId)
    ? existingSessionId
    : createTopicChatSessionId();
  const runId = randomUUID();

  const previousMessages = await listTopicChatMessages({
    sessionId,
    roomSlug,
    topicId,
    limit: 18,
  });

  const userMessage = await createTopicChatMessage({
    sessionId,
    runId,
    roomSlug,
    topicId,
    topicTitle: topic.title,
    role: "user",
    body: question,
    createdAt: new Date().toISOString(),
    promptCategory: "topic-chat",
  });

  const historyForAnswer = [...previousMessages, userMessage];
  const result = await askTopicCard({
    roomSlug,
    topicId,
    question,
    provider,
    history: historyForAnswer,
    preparedContext,
  });

  if (!result) {
    return NextResponse.json({ error: "Unknown topic card." }, { status: 404 });
  }

  let promotionAlreadyUsed = false;
  const promotedAnswers: TopicAiAnswer[] = [];

  for (const answer of result.answers) {
    const { promotion, usedPromotionSlot } = await suggestAnswerCandidate({
      roomSlug,
      topicId,
      question,
      answer,
      providerRequest: provider,
      context: preparedContext.context,
      sourceMessageId: userMessage.id,
      promotionAlreadyUsed,
    });

    promotionAlreadyUsed = usedPromotionSlot;
    const answerWithPromotion: TopicAiAnswer = {
      ...answer,
      promotion,
    };
    promotedAnswers.push(answerWithPromotion);

    await createTopicChatMessage({
      sessionId,
      runId,
      roomSlug,
      topicId,
      topicTitle: topic.title,
      role: "assistant",
      provider: answer.provider,
      model: answer.model,
      body: answer.response,
      createdAt: answer.generatedAt,
      promptCategory: "topic-chat",
      promotion,
    });
  }

  const [messages, storeMetadata] = await Promise.all([
    listTopicChatMessages({
      sessionId,
      roomSlug,
      topicId,
      limit: 24,
    }),
    getTopicChatStoreMetadata(),
  ]);

  const response = NextResponse.json({
    ...result,
    answers: promotedAnswers,
    messages,
    store: storeMetadata,
  });

  if (!existingSessionId) {
    response.cookies.set({
      name: getTopicChatSessionCookieName(),
      value: sessionId,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: shouldUseSecureCookies({
        protocol: request.nextUrl.protocol,
        host: request.nextUrl.host,
      }),
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return response;
}
