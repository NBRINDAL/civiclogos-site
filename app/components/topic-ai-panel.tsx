"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { IssueRoomSlug } from "../lib/civic-logos";
import {
  isActualCardChange,
  isFinalReviewStatus,
} from "../lib/contribution-impact";
import type { PublicContribution } from "../lib/contribution-types";
import {
  getContributionOrigin,
  getContributionOriginLabel,
  type ContributionOrigin,
} from "../lib/contribution-origin";
import {
  getDebateLaneLabel,
  normalizeReviewTargetKind,
  type DebateLane,
} from "../lib/reasoning-types";
import { topicAiDraftEventName, type TopicAiDraftDetail } from "../lib/topic-ai-draft";
import type {
  TopicChatMessage,
  TopicChatPromotion,
  TopicChatPromotionState,
  TopicChatStoreMetadata,
} from "../lib/topic-chat-types";
import styles from "./topic-ai-panel.module.css";

type TopicAiPanelProps = {
  initialMessages: TopicChatMessage[];
  initialStoreMode: TopicChatStoreMetadata["mode"];
  initialStoreNote: string;
  roomSlug: IssueRoomSlug;
  scorePressureContexts?: Record<
    string,
    {
      latestVisibleContribution: PublicContribution | null;
      latestVisibleSliceLabel: null | string;
      latestUnresolvedContribution: PublicContribution | null;
      latestUnresolvedSliceLabel: null | string;
    }
  >;
  scoreReferences?: Record<
    string,
    Array<{ scoreLabel: string; scoreSliceLabel: string }>
  >;
  intakeContext?: TopicAiIntakeContext | null;
  topicId: string;
  topicTitle: string;
};

type TopicAiAnswer = {
  provider: "openai" | "anthropic";
  model: string;
  generatedAt: string;
  promptCategory: "topic-chat";
  response: string;
};

type TopicAiIssue = {
  provider: "openai" | "anthropic";
  model?: string;
  message: string;
};

type TopicAiResponse = {
  state: "completed" | "partial" | "error" | "unavailable";
  disclaimer: string;
  answers: TopicAiAnswer[];
  issues: TopicAiIssue[];
  messages: TopicChatMessage[];
  store: TopicChatStoreMetadata;
  error?: string;
};

type ProviderRequest = "openai" | "anthropic" | "all";

type TranscriptItem = {
  message: TopicChatMessage;
  sourceQuestion?: string;
};

type TopicAiIntakeContext = {
  intakeId: string;
  routeKind: "existing-room" | "room-topic-draft" | "new-room-draft";
  artifactTitle: string;
  promptCount: number;
  heldQuestionCount: number;
  pressureNoticeHref: string;
  exactArtifactHref: string;
  intakeArtifactHref: string;
  routingHref: string;
  promptHistoryHref?: string | null;
  heldQuestions: Array<{ question: string; provenanceLabel: string }>;
  latestPrompt?: {
    label: string;
    prompt: string;
    date?: string;
  } | null;
};

type PromotionAttachmentFilter =
  | "claim"
  | "objection"
  | "evidence"
  | "assumption"
  | "open-question"
  | "none-yet";

type ContributionStatusFilter =
  | "pending"
  | "needs-review"
  | "accepted"
  | "incorporated"
  | "rejected";

type ContributionFilter =
  | "needs-review"
  | "changed-card"
  | "ai-assisted"
  | "document-backed";

const quickChallengePrompts = [
  "Which assumption is carrying the most hidden risk in this card right now?",
  "Steelman the strongest objection to this card from the current public record.",
  "What evidence gap most weakens the current read on this topic?",
  "How could the economic-delta case fail in implementation even if the mechanism sounds plausible?",
  "What change would most materially improve this card without pretending the room is settled?",
] as const;

const draftLaneOptions: Array<{
  lane: DebateLane;
  label: string;
}> = [
  { lane: "objection", label: "Draft contribution: objection" },
  { lane: "evidence", label: "Draft contribution: evidence" },
  { lane: "nuance", label: "Draft contribution: nuance" },
];

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getProviderLabel(provider: TopicAiAnswer["provider"] | TopicAiIssue["provider"]) {
  return provider === "openai" ? "GPT AI" : "Claude AI";
}

function getIntakeContextPrimaryActionLabel(
  routeKind: TopicAiIntakeContext["routeKind"],
) {
  switch (routeKind) {
    case "room-topic-draft":
      return "Open exact draft topic";
    case "new-room-draft":
      return "Open exact room candidate";
    case "existing-room":
    default:
      return "Return to room intake context";
  }
}

function getPromotionLabel(state: TopicChatPromotionState) {
  if (state === "auto-recorded") {
    return "System-recorded";
  }

  if (state === "sent-to-review") {
    return "Sent to review";
  }

  return "Exploratory only";
}

function getPromotionAttachmentLabel(promotion: TopicChatPromotion) {
  const normalizedKind = promotion.assignmentKind
    ? normalizeReviewTargetKind(promotion.assignmentKind)
    : null;

  if (!normalizedKind || normalizedKind === "unclear") {
    return promotion.assignmentLabel ?? "None yet";
  }

  const kindLabel = normalizedKind === "claim"
    ? "synthesis"
    : normalizedKind.replaceAll("-", " ");

  if (!promotion.assignmentLabel) {
    return kindLabel;
  }

  return `${kindLabel} - ${promotion.assignmentLabel}`;
}

function getPromotionAttachmentFilter(
  promotion: TopicChatPromotion,
): PromotionAttachmentFilter {
  const normalizedKind = promotion.assignmentKind
    ? normalizeReviewTargetKind(promotion.assignmentKind)
    : null;

  if (!normalizedKind || normalizedKind === "unclear") {
    return "none-yet";
  }

  return normalizedKind;
}

function getPromotionAttachmentFilterLabel(filter: PromotionAttachmentFilter) {
  switch (filter) {
    case "claim":
      return "Synthesis";
    case "objection":
      return "Objection";
    case "evidence":
      return "Evidence";
    case "assumption":
      return "Assumption";
    case "open-question":
      return "Open question";
    case "none-yet":
    default:
      return "None yet";
  }
}

function getContributionStatusLabel(filter: ContributionStatusFilter) {
  switch (filter) {
    case "needs-review":
      return "Needs review";
    case "pending":
      return "Pending";
    case "accepted":
      return "Accepted";
    case "incorporated":
      return "Incorporated";
    case "rejected":
      return "Rejected";
    default:
      return filter;
  }
}

function getContributionOriginContextLabel(origin: string) {
  if (
    origin === "human-submitted" ||
    origin === "founder-submitted" ||
    origin === "ai-origin" ||
    origin === "seed-example"
  ) {
    return getContributionOriginLabel(origin as ContributionOrigin);
  }

  return origin;
}

function getVisibleAttachmentFilter(
  contribution: PublicContribution,
): PromotionAttachmentFilter {
  const kind =
    contribution.review?.assignedToKind ?? contribution.aiIntake?.suggestedAssignmentKind;
  const normalizedKind = kind ? normalizeReviewTargetKind(kind) : null;

  if (!normalizedKind || normalizedKind === "unclear") {
    return "none-yet";
  }

  return normalizedKind;
}

function getContributionStatusFilter(
  status: PublicContribution["status"],
): ContributionStatusFilter {
  return status === "needs review" ? "needs-review" : status;
}

function getContributionRecordView(
  contribution: PublicContribution,
): ContributionFilter | undefined {
  if (contribution.draftSource) {
    return "ai-assisted";
  }

  if (isActualCardChange(contribution)) {
    return "changed-card";
  }

  if (contribution.evidenceDocument) {
    return "document-backed";
  }

  if (contribution.status === "pending" || contribution.status === "needs review") {
    return "needs-review";
  }

  return undefined;
}

function getAttachmentCounts(messages: TopicChatMessage[]) {
  return (
    ["claim", "objection", "evidence", "assumption", "open-question", "none-yet"] as const
  )
    .map((attachment) => ({
      attachment,
      label: getPromotionAttachmentFilterLabel(attachment),
      count: messages.filter(
        (message) =>
          message.promotion &&
          getPromotionAttachmentFilter(message.promotion) === attachment,
      ).length,
    }))
    .filter((item) => item.count > 0);
}

function getPromotionContributionStatusFilter(
  status?: TopicChatPromotion["contributionStatus"],
): ContributionStatusFilter | undefined {
  if (!status) {
    return undefined;
  }

  return status === "needs review" ? "needs-review" : status;
}

function getContributionRecordHref(
  promotion: TopicChatPromotion,
  intakeId?: string,
) {
  if (!promotion.contributionId) {
    return "#contribution-record";
  }

  const searchParams = new URLSearchParams();

  if (
    promotion.contributionStatus === "pending" ||
    promotion.contributionStatus === "needs review" ||
    promotion.state === "sent-to-review"
  ) {
    searchParams.set("recordView", "needs-review");
  } else if (
    promotion.state === "auto-recorded" &&
    promotion.changedSynthesis === true &&
    promotion.contributionStatus &&
    isFinalReviewStatus(promotion.contributionStatus)
  ) {
    searchParams.set("recordView", "changed-card");
  } else {
    searchParams.set("recordView", "ai-assisted");
  }

  searchParams.set("origin", "ai-origin");

  const contributionStatusFilter = getPromotionContributionStatusFilter(
    promotion.contributionStatus,
  );

  if (contributionStatusFilter) {
    searchParams.set("reviewStatus", contributionStatusFilter);
  }

  searchParams.set("attachment", getPromotionAttachmentFilter(promotion));

  if (intakeId) {
    searchParams.set("intake", intakeId);
  }

  return `?${searchParams.toString()}#contribution-${promotion.contributionId}`;
}

function getReviewQueueHref(
  roomSlug: IssueRoomSlug,
  topicId: string,
  contributionStatus?: TopicChatPromotion["contributionStatus"],
) {
  const searchParams = new URLSearchParams({
    roomSlug,
    topicId,
  });

  if (contributionStatus === "pending" || contributionStatus === "needs review") {
    searchParams.set("status", contributionStatus);
  }

  return `/review/contributions?${searchParams.toString()}`;
}

function getRecordViewHref(
  filter: "needs-review" | "ai-assisted",
  attachment?: PromotionAttachmentFilter,
  reviewStatus?: ContributionStatusFilter,
  intakeId?: string,
) {
  const searchParams = new URLSearchParams({
    recordView: filter,
    origin: "ai-origin",
  });

  if (attachment) {
    searchParams.set("attachment", attachment);
  }

  if (reviewStatus) {
    searchParams.set("reviewStatus", reviewStatus);
  }

  if (intakeId) {
    searchParams.set("intake", intakeId);
  }

  return `?${searchParams.toString()}#contribution-record`;
}

function getSourceContributionRecordHref(searchParams: {
  get(name: string): null | string;
}) {
  const contributionId = searchParams.get("sourceContribution")?.trim();

  if (!contributionId) {
    return null;
  }

  const nextSearchParams = new URLSearchParams();
  const sourceRecordView = searchParams.get("sourceRecordView")?.trim();
  const sourceReviewStatus = searchParams.get("sourceReviewStatus")?.trim();
  const sourceAttachment = searchParams.get("sourceAttachment")?.trim();
  const sourceOrigin = searchParams.get("sourceOrigin")?.trim();
  const sourceLane = searchParams.get("sourceLane")?.trim();
  const sourceSummary = searchParams.get("sourceSummary")?.trim();
  const sourceScoreLabel = searchParams.get("sourceScoreLabel")?.trim();
  const sourceScoreSlice = searchParams.get("sourceScoreSlice")?.trim();
  const intakeId = searchParams.get("intake")?.trim();

  if (sourceRecordView) {
    nextSearchParams.set("recordView", sourceRecordView);
  }

  if (sourceReviewStatus) {
    nextSearchParams.set("reviewStatus", sourceReviewStatus);
  }

  if (sourceAttachment) {
    nextSearchParams.set("attachment", sourceAttachment);
  }

  if (sourceOrigin) {
    nextSearchParams.set("origin", sourceOrigin);
  }

  if (sourceLane) {
    nextSearchParams.set("lane", sourceLane);
  }

  if (sourceSummary) {
    nextSearchParams.set("sourceSummary", sourceSummary);
  }

  if (sourceScoreLabel) {
    nextSearchParams.set("scoreLabel", sourceScoreLabel);
  }

  if (sourceScoreSlice) {
    nextSearchParams.set("scoreSlice", sourceScoreSlice);
  }

  if (intakeId) {
    nextSearchParams.set("intake", intakeId);
  }

  return `?${nextSearchParams.toString()}#contribution-${contributionId}`;
}

function getScoreAnchorId(label: string) {
  return `score-${label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}

function getSourceScoreHref(searchParams: {
  get(name: string): null | string;
}) {
  const sourceScoreLabel = searchParams.get("sourceScoreLabel")?.trim();

  if (!sourceScoreLabel) {
    return null;
  }

  const nextSearchParams = new URLSearchParams();
  const sourceScoreSlice = searchParams.get("sourceScoreSlice")?.trim();
  const intakeId = searchParams.get("intake")?.trim();

  nextSearchParams.set("scoreLabel", sourceScoreLabel);

  if (sourceScoreSlice) {
    nextSearchParams.set("scoreSlice", sourceScoreSlice);
  }

  if (intakeId) {
    nextSearchParams.set("intake", intakeId);
  }

  return `?${nextSearchParams.toString()}#${getScoreAnchorId(sourceScoreLabel)}`;
}

function getScoreItemHref(
  scoreLabel: string,
  scoreSliceLabel?: string,
  intakeId?: string,
) {
  const nextSearchParams = new URLSearchParams();
  nextSearchParams.set("scoreLabel", scoreLabel);

  if (scoreSliceLabel) {
    nextSearchParams.set("scoreSlice", scoreSliceLabel);
  }

  if (intakeId) {
    nextSearchParams.set("intake", intakeId);
  }

  return `?${nextSearchParams.toString()}#${getScoreAnchorId(scoreLabel)}`;
}

function getExactContributionRecordHref(
  contribution: PublicContribution,
  sourceScoreLabel?: string,
  sourceScoreSliceLabel?: string,
  sourceIntakeId?: string,
) {
  const nextSearchParams = new URLSearchParams();
  const recordView = getContributionRecordView(contribution);
  const reviewStatus = getContributionStatusFilter(contribution.status);
  const attachment = getVisibleAttachmentFilter(contribution);
  const origin = getContributionOrigin(contribution);

  if (recordView) {
    nextSearchParams.set("recordView", recordView);
  }

  nextSearchParams.set("reviewStatus", reviewStatus);
  nextSearchParams.set("attachment", attachment);
  nextSearchParams.set("origin", origin);
  nextSearchParams.set("lane", contribution.lane);

  if (sourceScoreLabel) {
    nextSearchParams.set("scoreLabel", sourceScoreLabel);
  }

  if (sourceScoreSliceLabel) {
    nextSearchParams.set("scoreSlice", sourceScoreSliceLabel);
  }

  if (sourceIntakeId) {
    nextSearchParams.set("intake", sourceIntakeId);
  }

  return `?${nextSearchParams.toString()}#contribution-${contribution.id}`;
}

function buildTranscript(messages: TopicChatMessage[]): TranscriptItem[] {
  let lastUserQuestion = "";

  return messages.map((message) => {
    if (message.role === "user") {
      lastUserQuestion = message.body;
      return { message };
    }

    return {
      message,
      sourceQuestion: lastUserQuestion || undefined,
    };
  });
}

function getSessionImpact(messages: TopicChatMessage[]) {
  const promotedMessages = messages.filter(
    (message) => message.role === "assistant" && message.promotion,
  );
  const autoRecordedMessages = promotedMessages.filter(
    (message) => message.promotion?.state === "auto-recorded",
  );
  const sentToReviewMessages = promotedMessages.filter(
    (message) => message.promotion?.state === "sent-to-review",
  );

  return {
    promotedMessages,
    autoRecordedCount: autoRecordedMessages.length,
    sentToReviewCount: sentToReviewMessages.length,
    exploratoryCount: promotedMessages.filter(
      (message) => message.promotion?.state === "not-added",
    ).length,
    autoRecordedAttachmentCounts: getAttachmentCounts(autoRecordedMessages),
    sentToReviewAttachmentCounts: getAttachmentCounts(sentToReviewMessages),
  };
}

export default function TopicAiPanel({
  initialMessages,
  initialStoreMode,
  initialStoreNote,
  roomSlug,
  scorePressureContexts = {},
  scoreReferences = {},
  intakeContext = null,
  topicId,
  topicTitle,
}: TopicAiPanelProps) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<TopicChatMessage[]>(initialMessages);
  const [issues, setIssues] = useState<TopicAiIssue[]>([]);
  const [disclaimer, setDisclaimer] = useState(
    "These AIs stay visible as separate AIs. The room only changes when Civic Logos system-records an AI-origin update with provenance or sends a proposal to human review.",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<ProviderRequest | null>(null);
  const [storeMode, setStoreMode] = useState<TopicChatStoreMetadata["mode"]>(
    initialStoreMode,
  );
  const [storeNote, setStoreNote] = useState(initialStoreNote);
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const activeIntakeId = searchParams.get("intake")?.trim() ?? intakeContext?.intakeId ?? "";
  const transcript = useMemo(() => buildTranscript(messages), [messages]);
  const sessionImpact = useMemo(() => getSessionImpact(messages), [messages]);
  const highlightedMessageId = searchParams.get("chatMessage")?.trim() ?? "";
  const sourceContributionHref = useMemo(
    () => getSourceContributionRecordHref(searchParams),
    [searchParams],
  );
  const sourceScoreHref = useMemo(() => getSourceScoreHref(searchParams), [searchParams]);
  const sourceContributionId = searchParams.get("sourceContribution")?.trim() ?? "";
  const sourceContributionTitle = searchParams.get("sourceContributionTitle")?.trim() ?? "";
  const sourceAttachmentSummary =
    searchParams.get("sourceAttachmentSummary")?.trim() ?? "";
  const sourceScoreLabel = searchParams.get("sourceScoreLabel")?.trim() ?? "";
  const sourceScoreSliceLabel = searchParams.get("sourceScoreSlice")?.trim() ?? "";
  const sourceScorePressureContext = useMemo(
    () => (sourceScoreLabel ? scorePressureContexts[sourceScoreLabel] ?? null : null),
    [scorePressureContexts, sourceScoreLabel],
  );
  const sourceContributionScoreReferences = useMemo(
    () => (sourceContributionId ? scoreReferences[sourceContributionId] ?? [] : []),
    [scoreReferences, sourceContributionId],
  );
  const sourceContributionContext = useMemo(() => {
    const sourceReviewStatus = searchParams.get("sourceReviewStatus")?.trim();
    const sourceAttachment = searchParams.get("sourceAttachment")?.trim();
    const sourceOrigin = searchParams.get("sourceOrigin")?.trim();
    const sourceLane = searchParams.get("sourceLane")?.trim();

    return {
      reviewStatus: sourceReviewStatus
        ? getContributionStatusLabel(sourceReviewStatus as ContributionStatusFilter)
        : null,
      attachment: sourceAttachment
        ? getPromotionAttachmentFilterLabel(sourceAttachment as PromotionAttachmentFilter)
        : null,
      origin: sourceOrigin ? getContributionOriginContextLabel(sourceOrigin) : null,
      lane: sourceLane ? getDebateLaneLabel(sourceLane as DebateLane) : null,
    };
  }, [searchParams]);
  const sourceSummaryLabel = searchParams.get("sourceSummary")?.trim() ?? "";
  const sourceScoreUnresolvedMatchesSourceContribution = Boolean(
    sourceScorePressureContext?.latestUnresolvedContribution &&
      sourceContributionId &&
      sourceScorePressureContext.latestUnresolvedContribution.id === sourceContributionId,
  );
  const sourceScoreUnresolvedMatchesLatestVisible = Boolean(
    sourceScorePressureContext?.latestUnresolvedContribution &&
      sourceScorePressureContext?.latestVisibleContribution &&
      sourceScorePressureContext.latestUnresolvedContribution.id ===
        sourceScorePressureContext.latestVisibleContribution.id,
  );
  const hasHighlightedMessageRequest = highlightedMessageId.length > 0;
  const highlightedTranscriptItem = useMemo(
    () =>
      highlightedMessageId
        ? transcript.find((item) => item.message.id === highlightedMessageId) ?? null
        : null,
    [highlightedMessageId, transcript],
  );

  useEffect(() => {
    if (!hasHighlightedMessageRequest) {
      return;
    }

    const targetId = highlightedTranscriptItem
      ? `topic-chat-message-${highlightedTranscriptItem.message.id}`
      : "topic-ai-transcript";
    let firstFrame = 0;
    let secondFrame = 0;

    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView({
          block: "start",
          behavior: "smooth",
        });
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [hasHighlightedMessageRequest, highlightedTranscriptItem]);

  function submitQuestion(provider: ProviderRequest, nextQuestion?: string) {
    const prompt = nextQuestion ?? question;
    const trimmedQuestion = prompt.trim();

    if (trimmedQuestion.length < 8) {
      setErrorMessage(
        "Ask a fuller question so the topic AIs have something real to respond to.",
      );
      return;
    }

    setErrorMessage(null);
    setActiveProvider(provider);
    setQuestion(trimmedQuestion);

    startTransition(async () => {
      try {
        const response = await fetch("/api/ai/topic", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roomSlug,
            topicId,
            provider,
            question: trimmedQuestion,
          }),
        });

        const payload = (await response.json()) as TopicAiResponse & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(
            payload.error ??
              "The AIs could not answer from this topic card right now.",
          );
        }

        setMessages(payload.messages);
        setIssues(payload.issues);
        setDisclaimer(payload.disclaimer);
        setStoreMode(payload.store.mode);
        setStoreNote(payload.store.note);
        setQuestion("");
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "The AIs could not answer from this topic card right now.",
        );
      }
    });
  }

  function runQuickChallenge(prompt: string) {
    submitQuestion("all", prompt);
  }

  function sendToContributionDraft(
    message: TopicChatMessage,
    sourceQuestion: string | undefined,
    suggestedLane?: DebateLane,
  ) {
    if (message.role !== "assistant" || !message.provider || !message.model || !sourceQuestion) {
      return;
    }

    const detail: TopicAiDraftDetail = {
      roomSlug,
      topicId,
      messageId: message.id,
      provider: message.provider,
      providerLabel: getProviderLabel(message.provider),
      model: message.model,
      generatedAt: message.createdAt,
      question: sourceQuestion,
      response: message.body,
      suggestedLane,
    };

    window.dispatchEvent(
      new CustomEvent<TopicAiDraftDetail>(topicAiDraftEventName, {
        detail,
      }),
    );
  }

  return (
    <section className={styles.panel} id="topic-ai-transcript">
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Chat this topic</span>
          <h2>Use the live AIs to explore the card, then let Civic Logos decide whether the result stays exploratory, goes to review, or updates the record.</h2>
        </div>
        <p className={styles.metaNote}>
          Ask about the thesis, assumptions, objection, evidence, transition cost,
          or economic-delta read. The models are AIs attached to{" "}
          <strong>{topicTitle}</strong>, not the authority that changes the public record.
        </p>
      </div>

      <div className={styles.storeMeta}>
        <span className={styles.storeBadge}>{storeMode} transcript</span>
        <p>{storeNote}</p>
      </div>

      {intakeContext ? (
        <div className={styles.sourceTurnNotice}>
          <div>
            <span className={styles.sessionImpactLabel}>Held intake pressure</span>
            <p>
              This AI transcript is still being read under pressure from{" "}
              <strong>{intakeContext.artifactTitle}</strong>, which is currently
              holding {intakeContext.promptCount} prompt
              {intakeContext.promptCount === 1 ? "" : "s"} and{" "}
              {intakeContext.heldQuestionCount} question
              {intakeContext.heldQuestionCount === 1 ? "" : "s"} in the intake layer.
            </p>
          </div>
          {intakeContext.heldQuestions.length ? (
            <div className={styles.sourceTurnActions}>
              <span className={styles.sessionImpactLabel}>Questions held here</span>
              <div className={styles.issueList}>
                {intakeContext.heldQuestions.map((question) => (
                  <p className={styles.issueItem} key={question.question}>
                    <strong>{question.question}</strong>
                    <br />
                    {question.provenanceLabel}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
          {intakeContext.latestPrompt ? (
            <div className={styles.sourceTurnActions}>
              <span className={styles.sessionImpactLabel}>
                {intakeContext.latestPrompt.label}
              </span>
              <p className={styles.sourceRecordTitle}>
                {intakeContext.latestPrompt.date ? (
                  <>
                    <strong>{intakeContext.latestPrompt.date}</strong>
                    {" · "}
                  </>
                ) : null}
                {intakeContext.latestPrompt.prompt}
              </p>
            </div>
          ) : null}
          <div className={styles.sourceTurnActions}>
            <span className={styles.sessionImpactLabel}>Return paths</span>
            <div className={styles.sessionTargetMap}>
              <a className={styles.sessionTargetLink} href={intakeContext.pressureNoticeHref}>
                Return to intake pressure notice
              </a>
              <a className={styles.sessionTargetLink} href={intakeContext.exactArtifactHref}>
                {getIntakeContextPrimaryActionLabel(intakeContext.routeKind)}
              </a>
              <a className={styles.sessionTargetLink} href={intakeContext.intakeArtifactHref}>
                Return to intake artifact
              </a>
              <a className={styles.sessionTargetLink} href={intakeContext.routingHref}>
                Open routing AIs
              </a>
              {intakeContext.promptHistoryHref ? (
                <a className={styles.sessionTargetLink} href={intakeContext.promptHistoryHref}>
                  Open prompt history
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className={styles.transcriptBlock}>
        <div className={styles.transcriptHeader}>
          <div>
            <span className={styles.quickPromptLabel}>Scoped topic transcript</span>
            <p className={styles.disclaimer}>{disclaimer}</p>
          </div>
        </div>

        {highlightedTranscriptItem ? (
          <div className={styles.sourceTurnNotice}>
            <div>
              <span className={styles.sessionImpactLabel}>Source turn focus</span>
              <p>
                Showing the exact{" "}
                <strong>
                  {highlightedTranscriptItem.message.role === "assistant"
                    ? getProviderLabel(highlightedTranscriptItem.message.provider ?? "openai")
                    : "visitor"}
                </strong>{" "}
                turn linked from the public record, captured on{" "}
                {formatTimestamp(highlightedTranscriptItem.message.createdAt)}.
              </p>
            </div>
            {highlightedTranscriptItem.sourceQuestion ? (
              <p className={styles.sourceTurnMeta}>
                Originating question: {highlightedTranscriptItem.sourceQuestion}
              </p>
            ) : null}
            {sourceContributionHref ? (
              <div className={styles.sourceTurnActions}>
                <span className={styles.sessionImpactLabel}>Public record origin</span>
                {sourceContributionTitle ? (
                  <p className={styles.sourceRecordTitle}>
                    Exact public record entry:{" "}
                    <strong>{sourceContributionTitle}</strong>
                  </p>
                ) : null}
                {sourceAttachmentSummary ? (
                  <p className={styles.sourceRecordTitle}>
                    Exact public record target:{" "}
                    <strong>{sourceAttachmentSummary}</strong>
                  </p>
                ) : null}
                <div className={styles.sourceContextMap}>
                  {sourceSummaryLabel ? (
                    <span className={styles.sourceContextChip}>
                      Summary: {sourceSummaryLabel}
                    </span>
                  ) : null}
                  {sourceScoreLabel ? (
                    <span className={styles.sourceContextChip}>
                      Score: {sourceScoreLabel}
                    </span>
                  ) : null}
                  {sourceScoreSliceLabel ? (
                    <span className={styles.sourceContextChip}>
                      Score slice: {sourceScoreSliceLabel}
                    </span>
                  ) : null}
                  {sourceContributionContext.lane ? (
                    <span className={styles.sourceContextChip}>
                      Lane: {sourceContributionContext.lane}
                    </span>
                  ) : null}
                  {sourceContributionContext.reviewStatus ? (
                    <span className={styles.sourceContextChip}>
                      Status: {sourceContributionContext.reviewStatus}
                    </span>
                  ) : null}
                  {sourceContributionContext.origin ? (
                    <span className={styles.sourceContextChip}>
                      Origin: {sourceContributionContext.origin}
                    </span>
                  ) : null}
                  {sourceContributionContext.attachment && !sourceAttachmentSummary ? (
                    <span className={styles.sourceContextChip}>
                      Target: {sourceContributionContext.attachment}
                    </span>
                  ) : null}
                </div>
                <div className={styles.sessionTargetMap}>
                  <a className={styles.sessionTargetLink} href={sourceContributionHref}>
                    {sourceSummaryLabel
                      ? `Return to exact record from ${sourceSummaryLabel}`
                      : "Return to exact public record entry"}
                  </a>
                  {sourceScoreHref && sourceScoreLabel ? (
                    <a className={styles.sessionTargetLink} href={sourceScoreHref}>
                      Return to {sourceScoreLabel}
                    </a>
                  ) : null}
                </div>
                {sourceScoreLabel ? (
                  <div className={styles.sourceTurnActions}>
                    <span className={styles.sessionImpactLabel}>
                      Open review pressure on this score
                    </span>
                    {sourceScorePressureContext?.latestUnresolvedContribution ? (
                      sourceScoreUnresolvedMatchesSourceContribution ? (
                        <p className={styles.sourceRecordTitle}>
                          This exact public record is still unresolved and could
                          still move <strong>{sourceScoreLabel}</strong> after human
                          review.
                        </p>
                      ) : sourceScoreUnresolvedMatchesLatestVisible ? (
                        <p className={styles.sourceRecordTitle}>
                          The freshest visible record on{" "}
                          <strong>{sourceScoreLabel}</strong> is still unresolved
                          and could still move the score after human review.
                        </p>
                      ) : (
                        <p className={styles.sourceRecordTitle}>
                          The newest unresolved public pressure that could still
                          move <strong>{sourceScoreLabel}</strong> is{" "}
                          <a
                            className={styles.sessionTargetLink}
                            href={getExactContributionRecordHref(
                              sourceScorePressureContext.latestUnresolvedContribution,
                              sourceScoreLabel,
                              (
                                sourceScorePressureContext.latestUnresolvedSliceLabel ??
                                sourceScoreSliceLabel
                              ) || undefined,
                              activeIntakeId || undefined,
                            )}
                          >
                            {sourceScorePressureContext.latestUnresolvedContribution.title}
                          </a>
                          {" "}through{" "}
                          <strong>
                            {sourceScorePressureContext.latestUnresolvedSliceLabel ??
                              "linked public record"}
                          </strong>
                          .
                        </p>
                      )
                    ) : (
                      <p className={styles.sourceRecordTitle}>
                        No unresolved public pressure is currently linked to{" "}
                        <strong>{sourceScoreLabel}</strong>.
                      </p>
                    )}
                  </div>
                ) : null}
                {sourceContributionScoreReferences.length ? (
                  <div className={styles.sourceTurnActions}>
                    <span className={styles.sessionImpactLabel}>
                      {sourceScoreLabel
                        ? "Scorecard use of this record"
                        : "Scorecard items using this record"}
                    </span>
                    <div className={styles.sessionTargetMap}>
                      {sourceContributionScoreReferences.map((reference) => (
                        <a
                          className={styles.sessionTargetLink}
                          href={getScoreItemHref(
                            reference.scoreLabel,
                            reference.scoreSliceLabel,
                            activeIntakeId || undefined,
                          )}
                          key={`source-score-${reference.scoreLabel}-${reference.scoreSliceLabel}`}
                        >
                          {reference.scoreLabel} · {reference.scoreSliceLabel}
                          {sourceScoreLabel === reference.scoreLabel &&
                          sourceScoreSliceLabel === reference.scoreSliceLabel
                            ? " · current"
                            : ""}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : hasHighlightedMessageRequest ? (
          <div className={`${styles.sourceTurnNotice} ${styles.sourceTurnMissing}`}>
            <div>
              <span className={styles.sessionImpactLabel}>Source turn unavailable</span>
              <p>
                This public-record entry points back to an AI-origin turn, but the
                exact stored GPT/Claude transcript entry is not available in this
                topic transcript right now. Civic Logos still preserves the AI
                provenance attached to the record entry itself.
              </p>
            </div>
            {sourceContributionHref ? (
              <div className={styles.sourceTurnActions}>
                <span className={styles.sessionImpactLabel}>Public record origin</span>
                {sourceContributionTitle ? (
                  <p className={styles.sourceRecordTitle}>
                    Exact public record entry:{" "}
                    <strong>{sourceContributionTitle}</strong>
                  </p>
                ) : null}
                {sourceAttachmentSummary ? (
                  <p className={styles.sourceRecordTitle}>
                    Exact public record target:{" "}
                    <strong>{sourceAttachmentSummary}</strong>
                  </p>
                ) : null}
                <div className={styles.sourceContextMap}>
                  {sourceSummaryLabel ? (
                    <span className={styles.sourceContextChip}>
                      Summary: {sourceSummaryLabel}
                    </span>
                  ) : null}
                  {sourceScoreLabel ? (
                    <span className={styles.sourceContextChip}>
                      Score: {sourceScoreLabel}
                    </span>
                  ) : null}
                  {sourceScoreSliceLabel ? (
                    <span className={styles.sourceContextChip}>
                      Score slice: {sourceScoreSliceLabel}
                    </span>
                  ) : null}
                  {sourceContributionContext.lane ? (
                    <span className={styles.sourceContextChip}>
                      Lane: {sourceContributionContext.lane}
                    </span>
                  ) : null}
                  {sourceContributionContext.reviewStatus ? (
                    <span className={styles.sourceContextChip}>
                      Status: {sourceContributionContext.reviewStatus}
                    </span>
                  ) : null}
                  {sourceContributionContext.origin ? (
                    <span className={styles.sourceContextChip}>
                      Origin: {sourceContributionContext.origin}
                    </span>
                  ) : null}
                  {sourceContributionContext.attachment && !sourceAttachmentSummary ? (
                    <span className={styles.sourceContextChip}>
                      Target: {sourceContributionContext.attachment}
                    </span>
                  ) : null}
                </div>
                <div className={styles.sessionTargetMap}>
                  <a className={styles.sessionTargetLink} href={sourceContributionHref}>
                    {sourceSummaryLabel
                      ? `Return to exact record from ${sourceSummaryLabel}`
                      : "Return to exact public record entry"}
                  </a>
                  {sourceScoreHref && sourceScoreLabel ? (
                    <a className={styles.sessionTargetLink} href={sourceScoreHref}>
                      Return to {sourceScoreLabel}
                    </a>
                  ) : null}
                </div>
                {sourceScoreLabel ? (
                  <div className={styles.sourceTurnActions}>
                    <span className={styles.sessionImpactLabel}>
                      Open review pressure on this score
                    </span>
                    {sourceScorePressureContext?.latestUnresolvedContribution ? (
                      sourceScoreUnresolvedMatchesSourceContribution ? (
                        <p className={styles.sourceRecordTitle}>
                          This exact public record is still unresolved and could
                          still move <strong>{sourceScoreLabel}</strong> after human
                          review.
                        </p>
                      ) : sourceScoreUnresolvedMatchesLatestVisible ? (
                        <p className={styles.sourceRecordTitle}>
                          The freshest visible record on{" "}
                          <strong>{sourceScoreLabel}</strong> is still unresolved
                          and could still move the score after human review.
                        </p>
                      ) : (
                        <p className={styles.sourceRecordTitle}>
                          The newest unresolved public pressure that could still
                          move <strong>{sourceScoreLabel}</strong> is{" "}
                          <a
                            className={styles.sessionTargetLink}
                            href={getExactContributionRecordHref(
                              sourceScorePressureContext.latestUnresolvedContribution,
                              sourceScoreLabel,
                              (
                                sourceScorePressureContext.latestUnresolvedSliceLabel ??
                                sourceScoreSliceLabel
                              ) || undefined,
                              activeIntakeId || undefined,
                            )}
                          >
                            {sourceScorePressureContext.latestUnresolvedContribution.title}
                          </a>
                          {" "}through{" "}
                          <strong>
                            {sourceScorePressureContext.latestUnresolvedSliceLabel ??
                              "linked public record"}
                          </strong>
                          .
                        </p>
                      )
                    ) : (
                      <p className={styles.sourceRecordTitle}>
                        No unresolved public pressure is currently linked to{" "}
                        <strong>{sourceScoreLabel}</strong>.
                      </p>
                    )}
                  </div>
                ) : null}
                {sourceContributionScoreReferences.length ? (
                  <div className={styles.sourceTurnActions}>
                    <span className={styles.sessionImpactLabel}>
                      {sourceScoreLabel
                        ? "Scorecard use of this record"
                        : "Scorecard items using this record"}
                    </span>
                    <div className={styles.sessionTargetMap}>
                      {sourceContributionScoreReferences.map((reference) => (
                        <a
                          className={styles.sessionTargetLink}
                          href={getScoreItemHref(
                            reference.scoreLabel,
                            reference.scoreSliceLabel,
                            activeIntakeId || undefined,
                          )}
                          key={`missing-source-score-${reference.scoreLabel}-${reference.scoreSliceLabel}`}
                        >
                          {reference.scoreLabel} · {reference.scoreSliceLabel}
                          {sourceScoreLabel === reference.scoreLabel &&
                          sourceScoreSliceLabel === reference.scoreSliceLabel
                            ? " · current"
                            : ""}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className={styles.sessionImpactGrid}>
          <article className={styles.sessionImpactCard}>
            <span className={styles.sessionImpactLabel}>System-recorded</span>
            <strong>{sessionImpact.autoRecordedCount}</strong>
            <p>
              Narrow AI-origin suggestions recorded with provenance under the
              current review policy. They remain inspectable and challengeable;
              AI is not the final judge.
            </p>
            {sessionImpact.autoRecordedCount ? (
              <>
                <a
                  className={styles.promotionLink}
                  href={getRecordViewHref("ai-assisted", undefined, undefined, activeIntakeId || undefined)}
                >
                  Open AI-assisted ledger
                </a>
                {sessionImpact.autoRecordedAttachmentCounts.length ? (
                  <div className={styles.sessionTargetMap}>
                    {sessionImpact.autoRecordedAttachmentCounts.map((item) => (
                      <a
                        className={styles.sessionTargetLink}
                        href={getRecordViewHref(
                          "ai-assisted",
                          item.attachment,
                          undefined,
                          activeIntakeId || undefined,
                        )}
                        key={`auto-recorded-target-${item.attachment}`}
                      >
                        {item.label} {item.count}
                      </a>
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}
          </article>
          <article className={styles.sessionImpactCard}>
            <span className={styles.sessionImpactLabel}>Sent to review</span>
            <strong>{sessionImpact.sentToReviewCount}</strong>
            <p>
              AI turns that became proposed record changes and now
              depend on a human decision.
            </p>
            {sessionImpact.sentToReviewCount ? (
              <>
                <a
                  className={styles.promotionLink}
                  href={getRecordViewHref("needs-review", undefined, undefined, activeIntakeId || undefined)}
                >
                  Open needs-review ledger
                </a>
                {sessionImpact.sentToReviewAttachmentCounts.length ? (
                  <div className={styles.sessionTargetMap}>
                    {sessionImpact.sentToReviewAttachmentCounts.map((item) => (
                      <a
                        className={styles.sessionTargetLink}
                        href={getRecordViewHref(
                          "needs-review",
                          item.attachment,
                          undefined,
                          activeIntakeId || undefined,
                        )}
                        key={`sent-to-review-target-${item.attachment}`}
                      >
                        {item.label} {item.count}
                      </a>
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}
          </article>
          <article className={styles.sessionImpactCard}>
            <span className={styles.sessionImpactLabel}>Exploratory only</span>
            <strong>{sessionImpact.exploratoryCount}</strong>
            <p>
              AI turns that stayed chat-only because they were not yet
              specific or grounded enough for the public record.
            </p>
          </article>
        </div>

        {sessionImpact.promotedMessages.length ? (
          <div className={styles.sessionImpactTrace}>
            <span className={styles.quickPromptLabel}>AI session impact</span>
            <div className={styles.issueList}>
              {sessionImpact.promotedMessages.slice(-3).reverse().map((message) => (
                <p className={styles.issueItem} key={`impact-${message.id}`}>
                  <strong>{getProviderLabel(message.provider ?? "openai")}:</strong>{" "}
                  {message.promotion?.note}
                  {message.promotion?.assignmentKind || message.promotion?.assignmentLabel
                    ? ` Attached to ${getPromotionAttachmentLabel(message.promotion)}.`
                    : ""}
                </p>
              ))}
            </div>
          </div>
        ) : null}

        {transcript.length ? (
          <div className={styles.transcriptList}>
            {transcript.map((item) => (
              <article
                className={`${styles.transcriptItem} ${
                  item.message.role === "user"
                    ? styles.userMessage
                    : styles.assistantMessage
                } ${
                  highlightedMessageId === item.message.id ? styles.highlightedMessage : ""
                }`}
                id={`topic-chat-message-${item.message.id}`}
                key={item.message.id}
              >
                <div className={styles.transcriptMeta}>
                  <div>
                    <strong>
                      {item.message.role === "user"
                        ? "Visitor"
                        : getProviderLabel(item.message.provider ?? "openai")}
                    </strong>
                    {item.message.role === "assistant" && item.message.model ? (
                      <span>{item.message.model}</span>
                    ) : null}
                  </div>
                  <span>{formatTimestamp(item.message.createdAt)}</span>
                </div>

                <p className={styles.transcriptBody}>{item.message.body}</p>

                {item.message.role === "assistant" && item.message.promotion ? (
                  <div className={styles.promotionBlock}>
                    <span
                      className={`${styles.promotionBadge} ${
                        item.message.promotion.state === "auto-recorded"
                          ? styles.promotionRecorded
                          : item.message.promotion.state === "sent-to-review"
                            ? styles.promotionReview
                            : styles.promotionExploratory
                      }`}
                    >
                      {getPromotionLabel(item.message.promotion.state)}
                    </span>
                    <p>{item.message.promotion.note}</p>
                    {item.message.promotion.assignmentKind ||
                    item.message.promotion.assignmentLabel ? (
                      <dl className={styles.promotionMeta}>
                        <div>
                          <dt>Attachment target</dt>
                          <dd>{getPromotionAttachmentLabel(item.message.promotion)}</dd>
                        </div>
                        {item.message.promotion.lane ? (
                          <div>
                            <dt>Suggested lane</dt>
                            <dd>{getDebateLaneLabel(item.message.promotion.lane)}</dd>
                          </div>
                        ) : null}
                        {item.message.promotion.changedSynthesis !== undefined &&
                        item.message.promotion.changedSynthesis !== null ? (
                          <div>
                            <dt>
                              {item.message.promotion.contributionStatus &&
                              isFinalReviewStatus(
                                item.message.promotion.contributionStatus,
                              )
                                ? "Actual card change"
                                : "Proposed card change"}
                            </dt>
                            <dd>{item.message.promotion.changedSynthesis ? "Yes" : "No"}</dd>
                          </div>
                        ) : null}
                      </dl>
                    ) : null}

                    {item.message.promotion.contributionId ? (
                      <div className={styles.promotionActions}>
                        <a
                          className={styles.promotionLink}
                          href={getContributionRecordHref(
                            item.message.promotion,
                            activeIntakeId || undefined,
                          )}
                        >
                          View public record entry
                        </a>
                        {item.message.promotion.state === "sent-to-review" ? (
                          <a
                            className={styles.promotionLink}
                            href={getReviewQueueHref(
                              roomSlug,
                              topicId,
                              item.message.promotion.contributionStatus,
                            )}
                          >
                            Open review queue
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {item.message.role === "assistant" ? (
                  <div className={styles.aiDraftBridge}>
                    <div>
                      <span className={styles.quickPromptLabel}>
                        Turn this answer into a proposed contribution
                      </span>
                      <p>
                        This only loads the AI answer into the contribution
                        form for human editing and review. It does not publish a
                        record or change the card by itself.
                      </p>
                    </div>
                    <div className={styles.answerActions}>
                      {draftLaneOptions.map((option) => (
                        <button
                          className={styles.answerAction}
                          key={`${item.message.id}-${option.lane}`}
                          onClick={() =>
                            sendToContributionDraft(
                              item.message,
                              item.sourceQuestion,
                              option.lane,
                            )
                          }
                          type="button"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>
              No scoped topic chat is stored for this session yet. Start with a
              real pressure test, and Civic Logos will keep the conversation
              attached to this topic while deciding whether any update belongs in
              the public record.
            </p>
            <p>
              After an AI answers, draft buttons can load that answer into the
              contribution form as a proposed record for human editing and
              review. The AI answer does not publish a record or change the card
              by itself.
            </p>
          </div>
        )}
      </div>

      <label className={styles.field}>
        <span>Question</span>
        <textarea
          maxLength={2500}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask whether the current thesis survives a specific objection, what evidence is weakest, or what assumption the card still depends on."
          rows={5}
          value={question}
        />
      </label>

      <div className={styles.quickPromptBlock}>
        <span className={styles.quickPromptLabel}>Quick challenge prompts</span>
        <div className={styles.quickPromptList}>
          {quickChallengePrompts.map((prompt) => (
            <button
              className={styles.quickPrompt}
              disabled={isPending}
              key={prompt}
              onClick={() => runQuickChallenge(prompt)}
              type="button"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.primaryAction}
          disabled={isPending}
          onClick={() => submitQuestion("openai")}
          type="button"
        >
          {isPending && activeProvider === "openai" ? "Asking GPT…" : "Ask GPT"}
        </button>
        <button
          className={styles.secondaryAction}
          disabled={isPending}
          onClick={() => submitQuestion("anthropic")}
          type="button"
        >
          {isPending && activeProvider === "anthropic" ? "Asking Claude…" : "Ask Claude"}
        </button>
        <button
          className={styles.secondaryAction}
          disabled={isPending}
          onClick={() => submitQuestion("all")}
          type="button"
        >
          {isPending && activeProvider === "all" ? "Asking both AIs…" : "Ask both AIs"}
        </button>
      </div>

      {errorMessage ? (
        <div className={styles.errorState} role="status">
          <p>{errorMessage}</p>
        </div>
      ) : null}

      {issues.length ? (
        <div className={styles.issueList}>
          {issues.map((item) => (
            <p className={styles.issueItem} key={`${item.provider}-${item.model ?? "issue"}`}>
              <strong>{getProviderLabel(item.provider)}:</strong> {item.message}
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
