"use client";

import { useState, useTransition } from "react";
import styles from "./page.module.css";

type ReviewAiConsultProps = {
  contributionId: string;
  contributionTitle: string;
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
  error?: string;
};

type ProviderRequest = "openai" | "anthropic" | "all";

const quickReviewerPrompts = [
  "Does this contribution belong on the assumption layer, evidence layer, objection layer, or synthesis layer?",
  "What would need to be checked before this record could change the visible synthesis?",
  "Based only on the visible record, is the hbar/G reformulation more likely notation, assumption change, prediction change, or unclear?",
  "Draft a cautious public review note that preserves the contribution without endorsing it.",
] as const;

function getProviderLabel(provider: ReviewAiAnswer["provider"] | ReviewAiIssue["provider"]) {
  return provider === "openai" ? "GPT reviewer consult" : "Claude reviewer consult";
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ReviewAiConsult({
  contributionId,
  contributionTitle,
}: ReviewAiConsultProps) {
  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState<ReviewAiAnswer[]>([]);
  const [issues, setIssues] = useState<ReviewAiIssue[]>([]);
  const [disclaimer, setDisclaimer] = useState(
    "Reviewer AI consult is advisory only. It does not publish a record, change review state, or move the visible synthesis.",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<ProviderRequest | null>(null);
  const [isPending, startTransition] = useTransition();

  function askReviewerAi(provider: ProviderRequest, nextQuestion = question) {
    const trimmedQuestion = nextQuestion.trim();

    if (!trimmedQuestion) {
      setErrorMessage("Ask a reviewer question first.");
      return;
    }

    setActiveProvider(provider);
    setErrorMessage(null);

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
          throw new Error(payload.error ?? "Reviewer AI consult failed.");
        }

        setAnswers(payload.answers ?? []);
        setIssues(payload.issues ?? []);
        setDisclaimer(payload.disclaimer);
      } catch (error) {
        setAnswers([]);
        setIssues([]);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Reviewer AI consult could not run right now.",
        );
      } finally {
        setActiveProvider(null);
      }
    });
  }

  function runQuickPrompt(prompt: string) {
    setQuestion(prompt);
    askReviewerAi("all", prompt);
  }

  return (
    <section className={styles.reviewerAiPanel}>
      <div>
        <span className={styles.eyebrow}>Reviewer AI consult</span>
        <h3>Ask about this record before deciding.</h3>
        <p>
          Use this as a scratchpad for the human review decision on{" "}
          <strong>{contributionTitle}</strong>. The answer is not saved as a
          contribution and cannot change the public record by itself.
        </p>
      </div>

      <label className={styles.field}>
        <span>Reviewer question</span>
        <textarea
          maxLength={2200}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask what layer this belongs on, what evidence is missing, or what would have to be true before the synthesis could move."
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
          {isPending && activeProvider === "openai" ? "Asking GPT..." : "Ask GPT"}
        </button>
        <button
          className={styles.submitButton}
          disabled={isPending}
          onClick={() => askReviewerAi("anthropic")}
          type="button"
        >
          {isPending && activeProvider === "anthropic" ? "Asking Claude..." : "Ask Claude"}
        </button>
        <button
          className={styles.submitButton}
          disabled={isPending}
          onClick={() => askReviewerAi("all")}
          type="button"
        >
          {isPending && activeProvider === "all" ? "Asking both..." : "Ask both"}
        </button>
      </div>

      <p className={styles.prefillNote}>{disclaimer}</p>

      {errorMessage ? <p className={styles.errorText}>{errorMessage}</p> : null}

      {issues.length ? (
        <div className={styles.reviewerAiIssueList}>
          {issues.map((issue) => (
            <p key={`${issue.provider}-${issue.model ?? "issue"}`}>
              <strong>{getProviderLabel(issue.provider)}:</strong> {issue.message}
            </p>
          ))}
        </div>
      ) : null}

      {answers.length ? (
        <div className={styles.reviewerAiAnswers}>
          {answers.map((answer) => (
            <article className={styles.providerCard} key={`${answer.provider}-${answer.generatedAt}`}>
              <strong>{getProviderLabel(answer.provider)}</strong>
              <p>
                {answer.model} · {formatTimestamp(answer.generatedAt)}
              </p>
              <p>{answer.response}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
