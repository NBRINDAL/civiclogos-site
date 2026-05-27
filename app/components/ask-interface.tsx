"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  getAskReadOnlyIntentLabel,
  type AskMode,
  type AskReadOnlyResult,
} from "../lib/ask-types";
import type { CandidateRecord } from "../lib/candidate-types";
import type { TopicChatMessage } from "../lib/topic-chat-types";
import styles from "./ask-interface.module.css";

type AskResponse = {
  mode: AskMode;
  intent: AskReadOnlyResult["intent"] | "candidate_intake";
  reply: string;
  topic: {
    roomId: string;
    topicId: string;
    topicTitle: string;
    banner: string;
  };
  candidate:
    | (CandidateRecord & {
        actualCardChange: false;
        publicSubmission: false;
      })
    | null;
  readOnly: AskReadOnlyResult | null;
  messages: TopicChatMessage[];
  safeguards: {
    publicLedgerWrite: boolean;
    publicContributionCountChange: boolean;
    revisionEventCreated: boolean;
    synthesisChanged: boolean;
  };
  issues: Array<{
    provider: "openai" | "anthropic";
    model?: string;
    message: string;
  }>;
};

type AskInterfaceProps = {
  candidateIntakeEnabled: boolean;
  initialCandidate: (CandidateRecord & {
    actualCardChange: false;
    publicSubmission: false;
  }) | null;
  initialMessages: TopicChatMessage[];
  initialReadOnly: AskReadOnlyResult | null;
  initialResultTopic?: AskResponse["topic"] | null;
  prototypeReadOnlyNotice: string | null;
  topic: {
    roomId: string;
    topicId: string;
    topicTitle: string;
  };
  workspaceMode?: boolean;
};

const demoUtterance =
  "This healthcare claim assumes savings will reach patients, but institutions may capture them.";

function getTopicHref(roomId: string, topicId: string) {
  if (roomId === "unrouted" || topicId === "unrouted") {
    return "/review/contributions#candidate-queue";
  }

  return roomId === "healthcare"
    ? `/healthcare/${topicId}`
    : `/rooms/${roomId}/${topicId}`;
}

function formatTopicLabel(candidate: CandidateRecord) {
  if (candidate.roomId === "unrouted" || candidate.topicId === "unrouted") {
    return "unrouted";
  }

  return `${candidate.roomId} / ${candidate.topicId}`;
}

function formatRouteTarget(roomId?: string, topicId?: string) {
  if (!roomId || !topicId) {
    return "No confident topic route";
  }

  return `${roomId} / ${topicId}`;
}

function buildInitialResultTopic(args: {
  initialResultTopic: AskInterfaceProps["initialResultTopic"];
  topic: AskInterfaceProps["topic"];
}): AskResponse["topic"] {
  if (args.initialResultTopic) {
    return args.initialResultTopic;
  }

  return {
    roomId: args.topic.roomId,
    topicId: args.topic.topicId,
    topicTitle: args.topic.topicTitle,
    banner:
      "Read-only questions are answered from the live healthcare card. Contribution-style messages may attach to an existing topic or stay internal as unrouted candidates.",
  };
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getLatestAssistantReply(messages: TopicChatMessage[]) {
  return [...messages].reverse().find((item) => item.role === "assistant")?.body ?? "";
}

export default function AskInterface({
  candidateIntakeEnabled,
  initialCandidate,
  initialMessages,
  initialReadOnly,
  initialResultTopic = null,
  prototypeReadOnlyNotice,
  topic,
  workspaceMode = false,
}: AskInterfaceProps) {
  const [question, setQuestion] = useState("");
  const [resultMode, setResultMode] = useState<AskMode | "idle">(
    initialReadOnly ? "read-only" : initialCandidate ? "candidate" : "idle",
  );
  const [candidate, setCandidate] = useState(initialCandidate);
  const [readOnlyResult, setReadOnlyResult] = useState(initialReadOnly);
  const [messages, setMessages] = useState(initialMessages);
  const [issues, setIssues] = useState<AskResponse["issues"]>([]);
  const [resultTopic, setResultTopic] = useState<AskResponse["topic"]>(() =>
    buildInitialResultTopic({
      initialResultTopic,
      topic,
    }),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const latestReply = getLatestAssistantReply(messages);

  function submitQuestion(nextQuestion: string) {
    startTransition(async () => {
      setErrorMessage(null);

      try {
        const response = await fetch("/api/ai/ask", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: nextQuestion,
            provider: "openai",
          }),
        });

        const payload = (await response.json()) as AskResponse | { error?: string };

        if (!response.ok || !("candidate" in payload)) {
          setErrorMessage(
            "error" in payload && payload.error
              ? payload.error
              : "Civic Logos could not answer from the ledger or structure a candidate from that message.",
          );
          return;
        }

        setResultMode(payload.mode);
        setCandidate(payload.candidate);
        setReadOnlyResult(payload.readOnly);
        setMessages(payload.messages);
        setIssues(payload.issues);
        setResultTopic(payload.topic);
        setQuestion("");
      } catch {
        setErrorMessage("Civic Logos could not reach the ask endpoint right now.");
      }
    });
  }

  return (
    <div className={styles.shell}>
      {!workspaceMode ? (
        <>
          <section className={styles.hero}>
            <div>
              <span className={styles.eyebrow}>Civic Logos V2</span>
              <h1>Ask the ledger without letting AI write the ledger.</h1>
            </div>
            <p className={styles.heroCopy}>
              `/ask` turns a natural-language pressure test into an internal candidate record
              for human review. The public healthcare card stays unchanged until a reviewer
              promotes that candidate into the normal contribution queue.
            </p>
          </section>

          <section className={styles.trustBlock}>
            <div>
              <span className={styles.eyebrow}>Trust boundary</span>
              <h2>Ask Civic Logos</h2>
            </div>
            <p>
              Ask Civic Logos is a pre-ledger intake. You can speak naturally. AI helps
              structure your thought into a candidate record, but nothing enters the
              public ledger until human review.
            </p>
            <div className={styles.flowTrack} aria-label="V2 intake flow">
              {[
                "Natural language",
                "AI-assisted candidate",
                "human review queue",
                "optional public contribution",
                "optional later revision",
              ].map((step) => (
                <span className={styles.flowStep} key={step}>
                  {step}
                </span>
              ))}
            </div>
            <ul className={styles.boundaryList}>
              <li>Chat is the interaction surface.</li>
              <li>Candidate is the internal pre-ledger object.</li>
              <li>Contribution becomes public only after reviewer promotion.</li>
              <li>Revision can happen later only through the existing public review path.</li>
            </ul>
            <p className={styles.auditNote}>
              /ask does not change public counts, does not create RevisionEvents, and
              does not change synthesis.
            </p>
          </section>

          <section className={styles.topicBanner} data-testid="ask-topic-banner">
            <div>
              <span className={styles.eyebrow}>Current public reader card</span>
              <h2>{topic.topicTitle}</h2>
            </div>
            <p>
              Read-only ledger questions are answered from <strong>{topic.roomId} / {topic.topicId}</strong>.
              Contribution-style messages may attach to that card, route to the existing
              Physics Foundations topic when the signal is clearly foundational-science,
              or stay internal as unrouted candidates needing maintainer routing. No new
              room or topic is created automatically, and no public ledger count changes
              from this page.
            </p>
          </section>
        </>
      ) : null}

      <div className={styles.layout}>
        <section className={styles.chatPanel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.eyebrow}>Chat intake</span>
              <h2>Ask a question or pressure-test the card in plain language.</h2>
            </div>
            <button
              className={styles.secondaryAction}
              data-testid="ask-load-demo"
              disabled={isPending || !candidateIntakeEnabled}
              onClick={() => setQuestion(demoUtterance)}
              type="button"
            >
              Load demo contribution
            </button>
          </div>

          {prototypeReadOnlyNotice ? (
            <div className={styles.prototypeNotice} role="status">
              <p>{prototypeReadOnlyNotice}</p>
            </div>
          ) : null}

          <label className={styles.field}>
            <span>Message</span>
            <textarea
              data-testid="ask-message-input"
              maxLength={2500}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask what changed, what evidence is attached, or describe an objection, assumption challenge, correction, or evidence pressure."
              rows={6}
              value={question}
            />
          </label>

          <div className={styles.actions}>
            <button
              className={styles.primaryAction}
              data-testid="ask-submit"
              disabled={isPending || question.trim().length < 8}
              onClick={() => submitQuestion(question.trim())}
              type="button"
            >
              {isPending ? "Processing ask..." : "Ask Civic Logos"}
            </button>
            <Link
              className={styles.linkAction}
              href={getTopicHref(
                candidate?.roomId ?? topic.roomId,
                candidate?.topicId ?? topic.topicId,
              )}
            >
              {candidate?.roomId === "unrouted"
                ? "Open maintainer queue"
                : "Open routed topic"}
            </Link>
          </div>

          {latestReply ? (
            <article className={styles.replyCard} data-testid="ask-ai-reply">
              <span className={styles.eyebrow}>
                {resultMode === "read-only" ? "Ledger answer" : "Short AI reply"}
              </span>
              <p className={styles.replyBody}>{latestReply}</p>
            </article>
          ) : null}

          {errorMessage ? (
            <div className={styles.errorState} role="status">
              <p>{errorMessage}</p>
            </div>
          ) : null}

          {issues.length ? (
            <div className={styles.issueList}>
              {issues.map((item) => (
                <p className={styles.issueItem} key={`${item.provider}-${item.model ?? "issue"}`}>
                  <strong>{item.provider === "openai" ? "GPT AI" : "Claude AI"}:</strong>{" "}
                  {item.message}
                </p>
              ))}
            </div>
          ) : null}

          <div className={styles.transcript}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>Transcript</span>
                <h2>Scoped to this intake session.</h2>
              </div>
            </div>

            {messages.length ? (
              <div className={styles.transcriptList}>
                {messages.map((message) => (
                  <article
                    className={`${styles.transcriptItem} ${
                      message.role === "assistant"
                        ? styles.assistantMessage
                        : styles.userMessage
                    }`}
                    key={message.id}
                  >
                    <div className={styles.transcriptMeta}>
                      <strong>{message.role === "assistant" ? "Civic Logos" : "You"}</strong>
                      <span>{formatTimestamp(message.createdAt)}</span>
                    </div>
                    {message.roomSlug !== topic.roomId || message.topicId !== topic.topicId ? (
                      <p className={styles.limitations}>
                        Route: {message.roomSlug} / {message.topicId}
                      </p>
                    ) : null}
                    <p>{message.body}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
              <p>
                  {candidateIntakeEnabled
                    ? "No ask-session messages yet. Try a read-only question like “What changed in this card?” or load the demo contribution to test the pre-ledger candidate flow."
                    : "No ask-session messages yet. Read-only ledger questions are available here, but contribution-style candidate submission is disabled until durable storage is configured."}
                </p>
              </div>
            )}
          </div>
        </section>

        <section className={styles.candidatePanel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.eyebrow}>
                {resultMode === "read-only" ? "Read-only answer" : "Structured candidate"}
              </span>
              <h2>
                {resultMode === "read-only"
                  ? "Records used from the public ledger."
                  : "Pre-ledger object only."}
              </h2>
            </div>
          </div>

          {resultMode === "candidate" && candidate ? (
            <>
            <article className={styles.candidateCard} data-testid="ask-candidate-card">
                <div className={styles.badgeRow}>
                  <span className={styles.badge}>{candidate.reviewStatus}</span>
                  <span className={styles.badge}>actual card change: false</span>
                  <span className={styles.badge}>public submission: false</span>
                </div>

                <div className={styles.noteBlock}>
                  <strong>Route</strong>
                  <p>{resultTopic.banner}</p>
                </div>

                <div className={styles.noteBlock}>
                  <strong>Routing metadata</strong>
                  <p>{candidate.routeReason}</p>
                  <p className={styles.limitations}>
                    Routing status: {candidate.routingStatus} · Proposed route:{" "}
                    {formatRouteTarget(candidate.routedRoomId, candidate.routedTopicId)} ·
                    Confidence: {candidate.routeConfidence}
                  </p>
                  {candidate.matchedSignals.length ? (
                    <p className={styles.limitations}>
                      Matched signals: {candidate.matchedSignals.join(", ")}
                    </p>
                  ) : null}
                  {candidate.rejectedRoutes.length ? (
                    <ul className={styles.recordList}>
                      {candidate.rejectedRoutes.map((route) => (
                        <li
                          key={`${route.roomId}-${route.topicId ?? "none"}-${route.reason}`}
                        >
                          <span>Rejected route</span>
                          <p>
                            {formatRouteTarget(route.roomId, route.topicId)} ·{" "}
                            {route.confidence} confidence
                          </p>
                          <p>{route.reason}</p>
                          {route.matchedSignals.length ? (
                            <p className={styles.limitations}>
                              Signals: {route.matchedSignals.join(", ")}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                {candidate.reviewStatus === "needs_routing" ? (
                  <div className={styles.noteBlock}>
                    <strong>Needs routing</strong>
                    <p>
                      Civic Logos could not confidently attach this to an existing topic.
                      It has been saved as an internal candidate needing maintainer routing.
                    </p>
                  </div>
                ) : null}

                <h3>{candidate.normalizedTitle}</h3>
                <p>{candidate.normalizedBody}</p>

                <dl className={styles.factGrid}>
                  <div>
                    <dt>Lane</dt>
                    <dd>{candidate.proposedLane}</dd>
                  </div>
                  <div>
                    <dt>Topic</dt>
                    <dd>{formatTopicLabel(candidate)}</dd>
                  </div>
                  <div>
                    <dt>Attachment target</dt>
                    <dd>{candidate.proposedAttachmentTarget.label}</dd>
                  </div>
                  <div>
                    <dt>Evidence status</dt>
                    <dd>{candidate.evidenceStatus}</dd>
                  </div>
                  <div>
                    <dt>Evidential distance</dt>
                    <dd>{candidate.evidentialDistance}</dd>
                  </div>
                  <div>
                    <dt>Impact field</dt>
                    <dd>{candidate.impactField.join(", ")}</dd>
                  </div>
                </dl>

                {candidate.evidenceAnchor ? (
                  <div className={styles.noteBlock}>
                    <strong>Evidence anchor</strong>
                    <p>{candidate.evidenceAnchor}</p>
                  </div>
                ) : null}

                <div className={styles.noteBlock}>
                  <strong>Scale map</strong>
                  <p>{candidate.scaleMap.join(" · ")}</p>
                </div>

                {candidate.internalAiNotes.map((note) => (
                  <div className={styles.noteBlock} key={`${note.provider}-${note.createdAt}`}>
                    <strong>Internal AI note</strong>
                    <p>{note.summary}</p>
                    {note.limitations.length ? (
                      <p className={styles.limitations}>
                        Limits: {note.limitations.join(" ")}
                      </p>
                    ) : null}
                  </div>
                ))}
              </article>

              <article className={styles.safeguardCard}>
                <span className={styles.eyebrow}>Safeguards</span>
                <ul className={styles.safeguardList}>
                  <li>No public ledger write</li>
                  <li>No public contribution count change</li>
                  <li>No revision event</li>
                  <li>No synthesis change</li>
                </ul>
              </article>
            </>
          ) : resultMode === "read-only" && readOnlyResult ? (
            <>
              <article className={styles.readOnlyCard} data-testid="ask-read-only-card">
                <div className={styles.badgeRow}>
                  <span className={styles.badge}>read-only answer</span>
                  <span className={styles.badge}>
                    {getAskReadOnlyIntentLabel(readOnlyResult.intent)}
                  </span>
                </div>

                <div className={styles.noteBlock}>
                  <strong>Route</strong>
                  <p>{resultTopic.banner}</p>
                </div>

                <div className={styles.noteBlock}>
                  <strong>Read-only note</strong>
                  <p>{readOnlyResult.note}</p>
                </div>

                <div className={styles.noteBlock}>
                  <strong>Records used</strong>
                  <ul className={styles.recordList}>
                    {readOnlyResult.recordsUsed.map((record) => (
                      <li key={`${record.kind}-${record.id ?? record.label}`}>
                        <span>{record.kind}</span>
                        <p>
                          {record.id ? `${record.id} - ${record.label}` : record.label}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>

              <article className={styles.safeguardCard}>
                <span className={styles.eyebrow}>Safeguards</span>
                <ul className={styles.safeguardList}>
                  <li>No public ledger write</li>
                  <li>No public contribution count change</li>
                  <li>No revision event</li>
                  <li>No synthesis change</li>
                </ul>
              </article>
            </>
          ) : (
            <div className={styles.emptyState}>
              <p>
                The result panel stays empty until you submit a message. Read-only
                questions stay on the public ledger surface, and contribution-style
                messages create a pending human-review candidate instead of touching
                the public record directly.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
