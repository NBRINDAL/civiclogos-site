"use client";

import { useState, useTransition } from "react";
import type { IssueRoomSlug } from "../lib/civic-logos";
import type { DebateLane } from "../lib/reasoning-types";
import { topicAiDraftEventName, type TopicAiDraftDetail } from "../lib/topic-ai-draft";
import styles from "./topic-ai-panel.module.css";

type TopicAiPanelProps = {
  roomSlug: IssueRoomSlug;
  topicId: string;
  topicTitle: string;
};

type TopicAiAnswer = {
  provider: "openai" | "anthropic";
  model: string;
  generatedAt: string;
  promptCategory: "topic-question";
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
  error?: string;
};

type ProviderRequest = "openai" | "anthropic" | "all";

const quickChallengePrompts = [
  "Which assumption is carrying the most hidden risk in this card right now?",
  "Steelman the strongest objection to this card from the current public record.",
  "What evidence gap most weakens the current read on this topic?",
  "How could the economic-delta case fail in implementation even if the mechanism sounds plausible?",
  "What change would most materially improve this card without pretending the room is settled?",
] as const;

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getProviderLabel(provider: TopicAiAnswer["provider"] | TopicAiIssue["provider"]) {
  return provider === "openai" ? "GPT assisted reader" : "Claude assisted reader";
}

const draftLaneOptions: Array<{
  lane: DebateLane;
  label: string;
}> = [
  { lane: "objection", label: "Draft as objection" },
  { lane: "evidence", label: "Draft as evidence" },
  { lane: "nuance", label: "Draft as nuance" },
];

export default function TopicAiPanel({
  roomSlug,
  topicId,
  topicTitle,
}: TopicAiPanelProps) {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<TopicAiResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<ProviderRequest | null>(null);
  const [lastAskedQuestion, setLastAskedQuestion] = useState("");
  const [isPending, startTransition] = useTransition();

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
    setLastAskedQuestion(trimmedQuestion);

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

        if (!response.ok && !payload.answers?.length) {
          throw new Error(
            payload.error ??
              "The assisted readers could not answer from this topic card right now.",
          );
        }

        setResult(payload);
      } catch (error) {
        setResult(null);
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

  function sendToContributionDraft(answer: TopicAiAnswer, suggestedLane?: DebateLane) {
    if (!lastAskedQuestion) {
      return;
    }

    const detail: TopicAiDraftDetail = {
      roomSlug,
      topicId,
      provider: answer.provider,
      providerLabel: getProviderLabel(answer.provider),
      model: answer.model,
      question: lastAskedQuestion,
      response: answer.response,
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
          <span className={styles.eyebrow}>Ask this topic</span>
          <h2>Use the live readers to pressure-test the current card.</h2>
        </div>
        <p className={styles.metaNote}>
          Ask about the thesis, assumptions, objection, evidence, transition cost,
          or economic-delta read. The models are assisted readers of{" "}
          <strong>{topicTitle}</strong>, not the authority that changes the public record.
        </p>
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

      {result ? (
        <div className={styles.resultBlock}>
          <p className={styles.disclaimer}>{result.disclaimer}</p>

          {result.answers.length ? (
            <div className={styles.answerGrid}>
              {result.answers.map((item) => (
                <article className={styles.answerCard} key={`${item.provider}-${item.generatedAt}`}>
                  <div className={styles.answerHeader}>
                    <div>
                      <strong>{getProviderLabel(item.provider)}</strong>
                      <span>{item.model}</span>
                    </div>
                    <span>{formatTimestamp(item.generatedAt)}</span>
                  </div>
                  <p className={styles.answerBody}>{item.response}</p>
                  <dl className={styles.answerMeta}>
                    <div>
                      <dt>Prompt class</dt>
                      <dd>{item.promptCategory}</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd>Assisted reader output</dd>
                    </div>
                  </dl>
                  <div className={styles.answerActions}>
                    {draftLaneOptions.map((option) => (
                      <button
                        className={styles.answerAction}
                        key={option.lane}
                        onClick={() => sendToContributionDraft(item, option.lane)}
                        type="button"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          {result.issues.length ? (
            <div className={styles.issueList}>
              {result.issues.map((item) => (
                <p className={styles.issueItem} key={`${item.provider}-${item.model ?? "issue"}`}>
                  <strong>{getProviderLabel(item.provider)}:</strong> {item.message}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
