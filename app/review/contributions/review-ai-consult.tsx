"use client";

import { useState, useTransition } from "react";
import type {
  ReviewChatMessage,
  ReviewChatStoreMetadata,
} from "@/app/lib/review-chat-types";
import styles from "./page.module.css";

type ReviewAiConsultProps = {
  contributionId: string;
  contributionTitle: string;
  initialMessages: ReviewChatMessage[];
  storeMetadata: ReviewChatStoreMetadata;
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

type ReviewAiResponse = {
  state: "completed" | "partial" | "error";
  disclaimer: string;
  answers: ReviewAiAnswer[];
  issues: ReviewAiIssue[];
  messages?: ReviewChatMessage[];
  store?: ReviewChatStoreMetadata;
  error?: string;
};

type ProviderRequest = "openai" | "anthropic" | "all";
type ReviewMode = "chat" | "synthesis";

const quickReviewerPrompts = [
  "What is the cleanest review framing for this record now that the paper is readable?",
  "Separate what is notation from what is a physical assumption or prediction.",
  "What would need outside physics review before this could change the visible synthesis?",
  "Draft a cautious public review note that preserves the contribution without endorsing it.",
] as const;

function getProviderLabel(provider?: ReviewAiAnswer["provider"] | ReviewAiIssue["provider"]) {
  if (provider === "openai") {
    return "GPT reviewer";
  }

  if (provider === "anthropic") {
    return "Claude reviewer";
  }

  return "Reviewer AI";
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getStoreStatus(metadata: ReviewChatStoreMetadata) {
  if (metadata.mode === "database") {
    return `${metadata.note} You can leave and return to this review.`;
  }

  if (metadata.mode === "fallback") {
    return `${metadata.note} This review chat is still attached to the contribution, but the database should be checked if fallback mode persists.`;
  }

  return `${metadata.note} This review chat is attached to the contribution in the current prototype environment.`;
}

export default function ReviewAiConsult({
  contributionId,
  contributionTitle,
  initialMessages,
  storeMetadata: initialStoreMetadata,
}: ReviewAiConsultProps) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ReviewChatMessage[]>(initialMessages);
  const [storeMetadata, setStoreMetadata] = useState(initialStoreMetadata);
  const [issues, setIssues] = useState<ReviewAiIssue[]>([]);
  const [disclaimer, setDisclaimer] = useState(
    "Reviewer AI chat is advisory only. It does not publish a record, change review state, or move the visible synthesis.",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<ProviderRequest | null>(null);
  const [activeMode, setActiveMode] = useState<ReviewMode | null>(null);
  const [isPending, startTransition] = useTransition();

  const synthesisMessages = messages.filter(
    (message) => message.role === "assistant" && message.mode === "synthesis",
  );

  function askReviewerAi(
    provider: ProviderRequest,
    mode: ReviewMode = "chat",
    nextQuestion = question,
  ) {
    const trimmedQuestion = nextQuestion.trim();

    if (mode === "chat" && !trimmedQuestion) {
      setErrorMessage("Ask a reviewer question first.");
      return;
    }

    const userMessage: ReviewChatMessage | null =
      mode === "chat"
        ? {
            id: makeId("reviewer"),
            contributionId,
            role: "user",
            body: trimmedQuestion,
            createdAt: new Date().toISOString(),
            mode,
          }
        : null;
    setActiveProvider(provider);
    setActiveMode(mode);
    setErrorMessage(null);
    setIssues([]);

    if (userMessage) {
      setMessages((current) => [...current, userMessage]);
      setQuestion("");
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/ai/review-contribution", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contributionId,
            provider,
            question: trimmedQuestion,
            mode,
          }),
        });
        const contentType = response.headers.get("content-type") ?? "";
        const payload = contentType.includes("application/json")
          ? ((await response.json()) as ReviewAiResponse)
          : ({
              state: "error",
              disclaimer,
              answers: [],
              issues: [],
              error: "Reviewer AI returned an unexpected server response.",
            } satisfies ReviewAiResponse);

        if (!response.ok || payload.error) {
          throw new Error(payload.error ?? "Reviewer AI chat failed.");
        }

        if (payload.messages?.length) {
          setMessages(payload.messages);
        } else {
          const answerMessages = (payload.answers ?? []).map((answer) => ({
            id: makeId(answer.provider),
            contributionId,
            role: "assistant" as const,
            body: answer.response,
            provider: answer.provider,
            model: answer.model,
            createdAt: answer.generatedAt,
            mode,
          }));

          setMessages((current) => [...current, ...answerMessages]);
        }
        setIssues(payload.issues ?? []);
        setDisclaimer(payload.disclaimer);
        if (payload.store) {
          setStoreMetadata(payload.store);
        }
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Reviewer AI chat could not run right now.",
        );
      } finally {
        setActiveProvider(null);
        setActiveMode(null);
      }
    });
  }

  function runQuickPrompt(prompt: string) {
    setQuestion(prompt);
    askReviewerAi("all", "chat", prompt);
  }

  return (
    <section className={styles.reviewerAiPanel}>
      <div>
        <span className={styles.eyebrow}>Reviewer AI chat</span>
        <h3>Discuss this record before deciding.</h3>
        <p>
          Use this as a contribution-scoped review conversation for{" "}
          <strong>{contributionTitle}</strong>. The discussion can later be
          synthesized into draft review language, but it still cannot publish a
          record or change the card by itself.
        </p>
        <p className={styles.prefillNote}>
          {getStoreStatus(storeMetadata)}
        </p>
      </div>

      {messages.length ? (
        <div className={styles.reviewChatTranscript}>
          {messages.map((message) => (
            <article
              className={`${styles.reviewChatMessage} ${
                message.role === "user" ? styles.reviewChatUser : styles.reviewChatAssistant
              }`}
              key={message.id}
            >
              <strong>
                {message.role === "user"
                  ? "Reviewer"
                  : message.provider
                    ? getProviderLabel(message.provider)
                    : "Reviewer AI"}
              </strong>
              <span>
                {message.model ? `${message.model} · ` : ""}
                {formatTimestamp(message.createdAt)}
                {message.mode === "synthesis" ? " · synthesis draft" : ""}
              </span>
              <p>{message.body}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.reviewChatEmpty}>
          <strong>No reviewer chat yet.</strong>
          <p>
            Start with a focused question. The AIs will receive the prior turns on
            each follow-up, so the review can build instead of resetting.
          </p>
        </div>
      )}

      <label className={styles.field}>
        <span>Reviewer message</span>
        <textarea
          maxLength={2200}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask a follow-up, challenge the model read, request a narrower public note, or ask what would need to be checked next."
          rows={4}
          value={question}
        />
      </label>

      <div className={styles.reviewerPromptList}>
        {quickReviewerPrompts.map((prompt) => (
          <button
            className={styles.filterReset}
            disabled={isPending}
            key={prompt}
            onClick={() => runQuickPrompt(prompt)}
            type="button"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className={styles.reviewAiActions}>
        <button
          className={styles.submitButton}
          disabled={isPending}
          onClick={() => askReviewerAi("openai")}
          type="button"
        >
          {isPending && activeProvider === "openai" && activeMode === "chat"
            ? "Asking GPT..."
            : "Ask GPT"}
        </button>
        <button
          className={styles.submitButton}
          disabled={isPending}
          onClick={() => askReviewerAi("anthropic")}
          type="button"
        >
          {isPending && activeProvider === "anthropic" && activeMode === "chat"
            ? "Asking Claude..."
            : "Ask Claude"}
        </button>
        <button
          className={styles.submitButton}
          disabled={isPending}
          onClick={() => askReviewerAi("all")}
          type="button"
        >
          {isPending && activeProvider === "all" && activeMode === "chat"
            ? "Asking both..."
            : "Ask both"}
        </button>
        <button
          className={styles.secondaryButton}
          disabled={isPending || !messages.length}
          onClick={() => askReviewerAi("all", "synthesis")}
          type="button"
        >
          {isPending && activeMode === "synthesis"
            ? "Synthesizing..."
            : "Synthesize discussion for review"}
        </button>
      </div>

      <p className={styles.prefillNote}>{disclaimer}</p>

      {errorMessage ? <p className={styles.errorText}>{errorMessage}</p> : null}

      {issues.length ? (
        <div className={styles.reviewerAiIssueList}>
          {issues.map((issue) => (
            <p key={`${issue.provider}-${issue.model ?? "issue"}-${issue.message}`}>
              <strong>{getProviderLabel(issue.provider)}:</strong> {issue.message}
            </p>
          ))}
        </div>
      ) : null}

      {synthesisMessages.length ? (
        <div className={styles.reviewSynthesisPanel}>
          <strong>Latest review synthesis draft</strong>
          <p>
            Use this as drafting material for the human review fields below. It is
            not a saved review decision.
          </p>
          {synthesisMessages.slice(-2).map((message) => (
            <article className={styles.providerCard} key={`synthesis-${message.id}`}>
              <strong>
                {message.provider ? getProviderLabel(message.provider) : "Reviewer AI"}
              </strong>
              <p>{message.body}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
