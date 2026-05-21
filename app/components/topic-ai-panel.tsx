"use client";

import { useMemo, useState, useTransition } from "react";
import type { IssueRoomSlug } from "../lib/civic-logos";
import type { DebateLane } from "../lib/reasoning-types";
import { topicAiDraftEventName, type TopicAiDraftDetail } from "../lib/topic-ai-draft";
import type {
  TopicChatMessage,
  TopicChatPromotionState,
  TopicChatStoreMetadata,
} from "../lib/topic-chat-types";
import styles from "./topic-ai-panel.module.css";

type TopicAiPanelProps = {
  initialMessages: TopicChatMessage[];
  initialStoreMode: TopicChatStoreMetadata["mode"];
  initialStoreNote: string;
  roomSlug: IssueRoomSlug;
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
  { lane: "objection", label: "Draft as objection" },
  { lane: "evidence", label: "Draft as evidence" },
  { lane: "nuance", label: "Draft as nuance" },
];

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getProviderLabel(provider: TopicAiAnswer["provider"] | TopicAiIssue["provider"]) {
  return provider === "openai" ? "GPT assisted reader" : "Claude assisted reader";
}

function getPromotionLabel(state: TopicChatPromotionState) {
  if (state === "auto-recorded") {
    return "Auto-recorded";
  }

  if (state === "sent-to-review") {
    return "Sent to review";
  }

  return "Exploratory only";
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

export default function TopicAiPanel({
  initialMessages,
  initialStoreMode,
  initialStoreNote,
  roomSlug,
  topicId,
  topicTitle,
}: TopicAiPanelProps) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<TopicChatMessage[]>(initialMessages);
  const [issues, setIssues] = useState<TopicAiIssue[]>([]);
  const [disclaimer, setDisclaimer] = useState(
    "These assisted readers stay visible as readers. The room only changes when Civic Logos records an obvious update or sends a proposal to human review.",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<ProviderRequest | null>(null);
  const [storeMode, setStoreMode] = useState<TopicChatStoreMetadata["mode"]>(
    initialStoreMode,
  );
  const [storeNote, setStoreNote] = useState(initialStoreNote);
  const [isPending, startTransition] = useTransition();
  const transcript = useMemo(() => buildTranscript(messages), [messages]);

  function submitQuestion(provider: ProviderRequest, nextQuestion?: string) {
    const prompt = nextQuestion ?? question;
    const trimmedQuestion = prompt.trim();

    if (trimmedQuestion.length < 8) {
      setErrorMessage(
        "Ask a fuller question so the topic readers have something real to respond to.",
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
              "The assisted readers could not answer from this topic card right now.",
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
            : "The assisted readers could not answer from this topic card right now.",
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
    <section className={styles.panel}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Chat this topic</span>
          <h2>Use the live readers to explore the card, then let Civic Logos decide whether the result stays exploratory, goes to review, or updates the record.</h2>
        </div>
        <p className={styles.metaNote}>
          Ask about the thesis, assumptions, objection, evidence, transition cost,
          or economic-delta read. The models are assisted readers of{" "}
          <strong>{topicTitle}</strong>, not the authority that changes the public record.
        </p>
      </div>

      <div className={styles.storeMeta}>
        <span className={styles.storeBadge}>{storeMode} transcript</span>
        <p>{storeNote}</p>
      </div>

      <div className={styles.transcriptBlock}>
        <div className={styles.transcriptHeader}>
          <div>
            <span className={styles.quickPromptLabel}>Scoped topic transcript</span>
            <p className={styles.disclaimer}>{disclaimer}</p>
          </div>
        </div>

        {transcript.length ? (
          <div className={styles.transcriptList}>
            {transcript.map((item) => (
              <article
                className={`${styles.transcriptItem} ${
                  item.message.role === "user"
                    ? styles.userMessage
                    : styles.assistantMessage
                }`}
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
                          <dd>
                            {item.message.promotion.assignmentKind ?? "unclear"}
                            {item.message.promotion.assignmentLabel
                              ? ` · ${item.message.promotion.assignmentLabel}`
                              : ""}
                          </dd>
                        </div>
                        {item.message.promotion.lane ? (
                          <div>
                            <dt>Suggested lane</dt>
                            <dd>{item.message.promotion.lane}</dd>
                          </div>
                        ) : null}
                      </dl>
                    ) : null}
                  </div>
                ) : null}

                {item.message.role === "assistant" ? (
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
          {isPending && activeProvider === "all" ? "Asking both readers…" : "Ask both readers"}
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
