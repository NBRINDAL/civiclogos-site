import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import {
  getRoomHref,
  getRoomTopicCard,
  getRoomTopicHref,
  issueRooms,
  type IssueRoomSlug,
} from "@/app/lib/civic-logos";
import { createContribution, reviewContribution } from "@/app/lib/contribution-store";
import { sendContributionReviewedNotification, sendContributionSubmittedNotification } from "@/app/lib/maintainer-notifications";
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

function revalidateTopicSurfaces(roomSlug: IssueRoomSlug, topicId: string) {
  revalidatePath("/review/contributions");
  revalidatePath(getRoomHref(roomSlug));
  revalidatePath(getRoomTopicHref(roomSlug, topicId));
}

async function promoteAnswerToRecord(args: {
  roomSlug: IssueRoomSlug;
  topicId: string;
  topicTitle: string;
  question: string;
  answer: TopicAiAnswer;
  providerRequest: "openai" | "anthropic" | "all";
  context: string;
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
        note: "This AI answer remained exploratory and was not added to the public record.",
      } satisfies TopicChatPromotion,
    };
  }

  if (!proposal.title || !proposal.body) {
    return {
      usedPromotionSlot: args.promotionAlreadyUsed,
      promotion: {
        state: "not-added",
        note: "A possible record update was detected, but it was not specific enough to store cleanly.",
      } satisfies TopicChatPromotion,
    };
  }

  if (args.providerRequest === "all" && args.promotionAlreadyUsed) {
    return {
      usedPromotionSlot: true,
      promotion: {
        state: "not-added",
        note: "Parallel-AI mode kept this answer comparative after another useful update was already captured from the same turn.",
      } satisfies TopicChatPromotion,
    };
  }

  const contribution = await createContribution({
    roomSlug: args.roomSlug,
    topicId: args.topicId,
    topicTitle: args.topicTitle,
    lane: proposal.lane,
    title: proposal.title,
    body: proposal.body,
    author: {
      name:
        args.answer.provider === "openai"
          ? "GPT assisted topic chat"
          : "Claude assisted topic chat",
      expertise:
        "AI-assisted topic chat suggestion generated inside Civic Logos and routed through the topic record gate.",
    },
    draftSource: {
      provider: args.answer.provider,
      providerLabel:
        args.answer.provider === "openai" ? "GPT AI" : "Claude AI",
      model: args.answer.model,
      question: args.question,
      generatedAt: args.answer.generatedAt,
    },
  });

  if (proposal.decision === "obvious" && args.providerRequest !== "all") {
    const reviewedContribution = await reviewContribution(contribution.id, {
      status: proposal.changedSynthesis === false ? "accepted" : "incorporated",
      assignedToKind: proposal.assignmentKind,
      assignedToLabel: proposal.assignmentLabel,
      changedSynthesis: proposal.changedSynthesis ?? true,
      publicRecordNote:
        proposal.publicRecordNote ||
        "A narrow update from the live topic chat was system-recorded with AI-origin provenance under the current review policy.",
      decisionReason:
        proposal.publicRecordNote ||
        "System-recorded from live topic chat under the AI-origin capture policy; the record remains inspectable and challengeable.",
      reviewerNote:
        proposal.reviewerNote ||
        `System-recorded from ${args.answer.provider} topic chat because the proposed update was narrow enough for AI-origin record capture; future human review or public challenge can still revise it.`,
    });

    if (reviewedContribution) {
      void sendContributionReviewedNotification(reviewedContribution);
      revalidateTopicSurfaces(args.roomSlug, args.topicId);
    }

    return {
      usedPromotionSlot: true,
      promotion: {
        state: "auto-recorded",
        note:
          proposal.publicRecordNote ||
          "A narrow update from this topic chat was system-recorded with AI-origin provenance and remains open to review.",
        contributionId: contribution.id,
        contributionStatus: proposal.changedSynthesis === false ? "accepted" : "incorporated",
        lane: proposal.lane,
        assignmentKind: proposal.assignmentKind,
        assignmentLabel: proposal.assignmentLabel,
        changedSynthesis: proposal.changedSynthesis ?? true,
      } satisfies TopicChatPromotion,
    };
  }

  void sendContributionSubmittedNotification({
    ...contribution,
    author: {
      name:
        args.answer.provider === "openai"
          ? "GPT assisted topic chat"
          : "Claude assisted topic chat",
      email: undefined,
      expertise:
        "AI-assisted topic chat suggestion generated inside Civic Logos and routed to the maintainer queue.",
    },
  });
  revalidateTopicSurfaces(args.roomSlug, args.topicId);

  return {
    usedPromotionSlot: true,
    promotion: {
      state: "sent-to-review",
      note:
        args.providerRequest === "all"
          ? "Parallel-AI mode treated this as useful enough for the review queue, but not safe enough to auto-record."
          : proposal.reviewerNote ||
            "This AI answer was turned into a draft update and sent to the human review queue.",
      contributionId: contribution.id,
      contributionStatus: contribution.status,
      lane: proposal.lane,
      assignmentKind: proposal.assignmentKind,
      assignmentLabel: proposal.assignmentLabel,
      changedSynthesis: proposal.changedSynthesis ?? null,
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
  const sessionId = isTopicChatSessionId(existingSessionId)
    ? existingSessionId!
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
    const { promotion, usedPromotionSlot } = await promoteAnswerToRecord({
      roomSlug,
      topicId,
      topicTitle: topic.title,
      question,
      answer,
      providerRequest: provider,
      context: preparedContext.context,
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
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return response;
}
