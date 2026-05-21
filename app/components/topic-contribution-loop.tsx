"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { DebatePrompt, IssueRoomSlug } from "../lib/civic-logos";
import type {
  AiProvider,
  ProviderContributionAiIntake,
  PublicContribution,
} from "../lib/contribution-types";
import {
  getDebateLaneLabel,
  normalizeDebateLane,
  type DebateLane,
  type ReviewStatus,
} from "../lib/reasoning-types";
import styles from "./topic-contribution-loop.module.css";

type TopicContributionLoopProps = {
  roomSlug: IssueRoomSlug;
  topicId: string;
  topicTitle: string;
  debatePrompts: readonly DebatePrompt[];
  openQuestions: readonly string[];
  whatWouldStrengthen: readonly string[];
};

type SubmissionState = {
  kind: "idle" | "success" | "error";
  message?: string;
};

type ContributionResponse = {
  prototype: boolean;
  note: string;
  contributions: PublicContribution[];
};

type FormLane = DebateLane | "";

type FormState = {
  lane: FormLane;
  title: string;
  body: string;
  evidenceLabel: string;
  evidenceUrl: string;
  name: string;
  email: string;
  expertise: string;
};

const initialFormState: FormState = {
  lane: "",
  title: "",
  body: "",
  evidenceLabel: "",
  evidenceUrl: "",
  name: "",
  email: "",
  expertise: "",
};

const statusLabels: Record<ReviewStatus, string> = {
  pending: "Pending review",
  accepted: "Accepted",
  "needs review": "Needs review",
  incorporated: "Incorporated",
  rejected: "Rejected",
};

const prototypeExamplesNote =
  "These are prototype examples showing how Civic Logos preserves and reviews contributions. They are not fake public activity.";

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusClassName(status: ReviewStatus) {
  return status
    .replaceAll(" ", "-")
    .split("-")
    .map((item) => item[0]?.toUpperCase() + item.slice(1))
    .join("");
}

function formatAttachmentPoint(
  kind?: string,
  label?: string,
) {
  if (!kind && !label) {
    return null;
  }

  if (!kind) {
    return label ?? null;
  }

  if (!label) {
    return kind;
  }

  return `${kind} — ${label}`;
}

function getAiReaderLabel(provider: AiProvider) {
  return provider === "openai" ? "Structurer read" : "Critic read";
}

function getAiReaderProviderLabel(provider: AiProvider) {
  return provider === "openai" ? "OpenAI assisted reader" : "Claude assisted reader";
}

function getCompletedReader(
  contribution: PublicContribution,
  provider: AiProvider,
) {
  return contribution.aiIntake?.providers.find(
    (item): item is ProviderContributionAiIntake =>
      item.provider === provider && item.state === "completed",
  );
}

function getChangedCardLabel(value: boolean | null | undefined) {
  if (value === true) {
    return "Yes";
  }

  if (value === false) {
    return "No";
  }

  return "Not decided yet";
}

export default function TopicContributionLoop({
  roomSlug,
  topicId,
  topicTitle,
  debatePrompts,
  openQuestions,
  whatWouldStrengthen,
}: TopicContributionLoopProps) {
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    kind: "idle",
  });
  const [contributions, setContributions] = useState<PublicContribution[]>([]);
  const [prototypeNote, setPrototypeNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const titleRef = useRef<HTMLInputElement>(null);

  const prompts = useMemo(
    () =>
      debatePrompts
        .map((item) => {
          const lane = item.id ?? normalizeDebateLane(item.title);

          if (!lane) {
            return null;
          }

          return {
            lane,
            title: item.title,
            description: item.description,
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [debatePrompts],
  );

  const hasPrototypeExamples = contributions.some((item) => item.isSeedExample);

  useEffect(() => {
    let isCancelled = false;

    async function loadContributions() {
      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/contributions?roomSlug=${encodeURIComponent(roomSlug)}&topicId=${encodeURIComponent(topicId)}&limit=8`,
        );
        const payload = (await response.json()) as ContributionResponse;

        if (!response.ok) {
          throw new Error("Unable to load contributions.");
        }

        if (!isCancelled) {
          setContributions(payload.contributions);
          setPrototypeNote(payload.note);
        }
      } catch (error) {
        console.error(error);

        if (!isCancelled) {
          setSubmissionState({
            kind: "error",
            message:
              "The contribution record could not be loaded right now. You can still try again in a moment.",
          });
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadContributions();

    return () => {
      isCancelled = true;
    };
  }, [roomSlug, topicId]);

  function handleFieldChange<Key extends keyof FormState>(
    key: Key,
    value: FormState[Key],
  ) {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleLanePick(lane: DebateLane) {
    setFormState((current) => ({
      ...current,
      lane,
    }));

    requestAnimationFrame(() => {
      titleRef.current?.focus();
      titleRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function resetContributionFields() {
    setFormState((current) => ({
      ...current,
      lane: "",
      title: "",
      body: "",
      evidenceLabel: "",
      evidenceUrl: "",
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const website = String(new FormData(event.currentTarget).get("website") ?? "");

    if (!formState.title.trim() || !formState.body.trim()) {
      setSubmissionState({
        kind: "error",
        message: "Title and contribution body are required.",
      });
      return;
    }

    if (!formState.lane) {
      setSubmissionState({
        kind: "error",
        message: "Choose the debate lane your contribution belongs in.",
      });
      return;
    }

    setSubmissionState({ kind: "idle" });

    startTransition(async () => {
      try {
        const response = await fetch("/api/contributions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roomSlug,
            topicId,
            lane: formState.lane,
            title: formState.title,
            body: formState.body,
            evidenceLabel: formState.evidenceLabel,
            evidenceUrl: formState.evidenceUrl,
            name: formState.name,
            email: formState.email,
            expertise: formState.expertise,
            website,
          }),
        });

        const payload = (await response.json()) as {
          error?: string;
          message?: string;
          contribution?: PublicContribution;
        };

        if (!response.ok || !payload.contribution || !payload.message) {
          throw new Error(payload.error ?? "Contribution could not be submitted.");
        }

        setContributions((current) => [payload.contribution!, ...current].slice(0, 8));
        resetContributionFields();
        setSubmissionState({
          kind: "success",
          message: payload.message,
        });
      } catch (error) {
        setSubmissionState({
          kind: "error",
          message:
            error instanceof Error
              ? error.message
              : "Contribution could not be submitted right now.",
        });
      }
    });
  }

  return (
    <>
      <section className={styles.gridSection} id="debate">
        <article className={styles.panel}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.eyebrow}>Debate lanes</span>
              <h2>The point is not to react. It is to improve the object.</h2>
            </div>
            <p className={styles.metaNote}>
              {topicTitle} is a living public reasoning object. Contributions are
              reviewed for how they sharpen claims, objections, evidence,
              assumptions, and open questions.
            </p>
          </div>

          <div className={styles.debateGrid}>
            {prompts.map((item) => {
              const isActive = formState.lane === item.lane;

              return (
                <article className={styles.debateCard} key={item.lane}>
                  <div className={styles.debateCardHeader}>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                    <button
                      className={isActive ? styles.activeLaneButton : styles.laneButton}
                      onClick={() => handleLanePick(item.lane)}
                      type="button"
                    >
                      {isActive ? "Selected" : "Contribute"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formHeader}>
              <div>
                <span className={styles.eyebrow}>Submit contribution</span>
                <h3>Improve the current public record.</h3>
              </div>
              <p className={styles.formNote}>
                Choose the lane deliberately. The room should know whether you are
                adding an objection, evidence item, nuance, correction, or
                perspective before it tries to sort the record.
              </p>
            </div>

            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span>Contribution lane</span>
                <select
                  onChange={(event) =>
                    handleFieldChange(
                      "lane",
                      normalizeDebateLane(event.target.value) ?? "",
                    )
                  }
                  value={formState.lane}
                >
                  <option value="">Choose the reasoning lane for this contribution</option>
                  {prompts.map((item) => (
                    <option key={item.lane} value={item.lane}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span>Title</span>
                <input
                  maxLength={180}
                  onChange={(event) => handleFieldChange("title", event.target.value)}
                  placeholder="Give the contribution a clear working title"
                  ref={titleRef}
                  required
                  value={formState.title}
                />
              </label>
            </div>

            <label className={styles.field}>
              <span>Contribution body</span>
              <textarea
                maxLength={5000}
                onChange={(event) => handleFieldChange("body", event.target.value)}
                placeholder="Add the strongest objection, evidence, correction, or nuance you can."
                required
                rows={7}
                value={formState.body}
              />
            </label>

            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span>Evidence or source label</span>
                <input
                  maxLength={180}
                  onChange={(event) =>
                    handleFieldChange("evidenceLabel", event.target.value)
                  }
                  placeholder="Optional source title"
                  value={formState.evidenceLabel}
                />
              </label>

              <label className={styles.field}>
                <span>Evidence or source link</span>
                <input
                  onChange={(event) =>
                    handleFieldChange("evidenceUrl", event.target.value)
                  }
                  placeholder="https://..."
                  type="url"
                  value={formState.evidenceUrl}
                />
              </label>
            </div>

            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span>Name</span>
                <input
                  maxLength={120}
                  onChange={(event) => handleFieldChange("name", event.target.value)}
                  placeholder="Optional"
                  value={formState.name}
                />
              </label>

              <label className={styles.field}>
                <span>Email</span>
                <input
                  maxLength={240}
                  onChange={(event) => handleFieldChange("email", event.target.value)}
                  placeholder="Optional"
                  type="email"
                  value={formState.email}
                />
              </label>
            </div>

            <label className={styles.field}>
              <span>Expertise or context</span>
              <input
                maxLength={180}
                onChange={(event) => handleFieldChange("expertise", event.target.value)}
                placeholder="Optional lived experience, field knowledge, or implementation context"
                value={formState.expertise}
              />
            </label>

            <input aria-hidden="true" className={styles.honeypot} name="website" tabIndex={-1} />

            <div className={styles.formFooter}>
              <button className={styles.submitButton} disabled={isPending} type="submit">
                {isPending ? "Submitting for review…" : "Submit contribution"}
              </button>
              <p className={styles.formHelp}>
                Strong contributions improve the object directly. They do not
                perform for a feed.
              </p>
            </div>

            {submissionState.kind !== "idle" ? (
              <div
                className={
                  submissionState.kind === "success"
                    ? styles.successState
                    : styles.errorState
                }
                role="status"
              >
                <p>{submissionState.message}</p>
              </div>
            ) : null}
          </form>
        </article>

        <article className={styles.panel}>
          <span className={styles.eyebrow}>What this card needs next</span>
          <h2>The most useful updates are the ones that reduce ambiguity.</h2>

          <div className={styles.copyBlock}>
            <h3>Open questions</h3>
            <ul className={styles.bulletList}>
              {openQuestions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className={styles.copyBlock}>
            <h3>What would strengthen it</h3>
            <ul className={styles.bulletList}>
              {whatWouldStrengthen.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.eyebrow}>Recent contributions</span>
            <h2>Contribution, assisted reading, review, and synthesis impact.</h2>
          </div>
          <p className={styles.metaNote}>
            {hasPrototypeExamples ? prototypeExamplesNote : prototypeNote}
          </p>
        </div>

        {isLoading ? (
          <p className={styles.loadingNote}>Loading the current contribution record…</p>
        ) : contributions.length ? (
          <div className={styles.contributionList}>
            {contributions.map((item) => {
              const statusClassName = `status${getStatusClassName(item.status)}`;
              const proposedAttachmentPoint = formatAttachmentPoint(
                item.aiIntake?.suggestedAssignmentKind,
                item.aiIntake?.suggestedAssignmentLabel,
              );
              const reviewedAttachmentPoint = formatAttachmentPoint(
                item.review?.assignedToKind,
                item.review?.assignedToLabel,
              );
              const structurerRead = getCompletedReader(item, "openai");
              const criticRead = getCompletedReader(item, "anthropic");

              return (
                <article className={styles.contributionCard} key={item.id}>
                  <div className={styles.contributionMeta}>
                    {item.isSeedExample ? (
                      <span className={styles.seedLabel}>Prototype example</span>
                    ) : null}
                    <span className={styles.laneLabel}>
                      {getDebateLaneLabel(item.lane)}
                    </span>
                    <span className={styles[statusClassName]}>
                      {statusLabels[item.status]}
                    </span>
                  </div>

                  <h3>{item.title}</h3>
                  <p className={styles.contributionBody}>{item.body}</p>

                  {item.evidenceSource?.url ? (
                    <div className={styles.recordSection}>
                      <span className={styles.sectionLabel}>Source / evidence</span>
                      <a
                        className={styles.sourceLink}
                        href={item.evidenceSource.url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {item.evidenceSource.label || "View source"}
                      </a>
                    </div>
                  ) : null}

                  {item.aiIntake?.state === "completed" ? (
                    <div className={styles.aiIntake}>
                      <strong>AI sorting result</strong>
                      {item.aiIntake.summary ? <p>{item.aiIntake.summary}</p> : null}

                      <dl className={styles.recordGrid}>
                        <div className={styles.recordRow}>
                          <dt>Lane fit</dt>
                          <dd>{getDebateLaneLabel(item.aiIntake.laneFit ?? item.lane)}</dd>
                        </div>
                        {proposedAttachmentPoint ? (
                          <div className={styles.recordRow}>
                            <dt>Proposed attachment point</dt>
                            <dd>{proposedAttachmentPoint}</dd>
                          </div>
                        ) : null}
                        <div className={styles.recordRow}>
                          <dt>Likely synthesis impact</dt>
                          <dd>{getChangedCardLabel(item.aiIntake.changedSynthesisLikely)}</dd>
                        </div>
                      </dl>

                      {(structurerRead || criticRead) ? (
                        <div className={styles.readerGrid}>
                          {structurerRead ? (
                            <article className={styles.readerCard}>
                              <div className={styles.readerHeader}>
                                <strong>{getAiReaderLabel(structurerRead.provider)}</strong>
                                <span>{getAiReaderProviderLabel(structurerRead.provider)}</span>
                              </div>
                              <p>{structurerRead.summary}</p>
                            </article>
                          ) : null}

                          {criticRead ? (
                            <article className={styles.readerCard}>
                              <div className={styles.readerHeader}>
                                <strong>{getAiReaderLabel(criticRead.provider)}</strong>
                                <span>{getAiReaderProviderLabel(criticRead.provider)}</span>
                              </div>
                              <p>{criticRead.summary}</p>
                            </article>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {item.review ? (
                    <div className={styles.reviewNote}>
                      <strong>Human review</strong>
                      <dl className={styles.recordGrid}>
                        <div className={styles.recordRow}>
                          <dt>Review status</dt>
                          <dd>{statusLabels[item.status]}</dd>
                        </div>
                        {reviewedAttachmentPoint ? (
                          <div className={styles.recordRow}>
                            <dt>Attachment point after review</dt>
                            <dd>{reviewedAttachmentPoint}</dd>
                          </div>
                        ) : null}
                        <div className={styles.recordRow}>
                          <dt>Whether it changed the card</dt>
                          <dd>{getChangedCardLabel(item.review.changedSynthesis)}</dd>
                        </div>
                      </dl>

                      {item.review.decisionReason ? (
                        <div className={styles.reviewCopy}>
                          <span className={styles.sectionLabel}>Decision rationale</span>
                          <p>{item.review.decisionReason}</p>
                        </div>
                      ) : null}

                      {item.review.reviewerNote ? (
                        <div className={styles.reviewCopy}>
                          <span className={styles.sectionLabel}>Human reviewer note</span>
                          <p>{item.review.reviewerNote}</p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className={styles.contributionFooter}>
                    <div className={styles.contributorMeta}>
                      <span>{formatTimestamp(item.createdAt)}</span>
                      {item.author.name ? <span>{item.author.name}</span> : null}
                      {item.author.expertise ? (
                        <span>{item.author.expertise}</span>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className={styles.loadingNote}>
            No contributions have been submitted yet. The first strong objection,
            evidence item, correction, or nuance here will become part of the
            visible review record.
          </p>
        )}
      </section>
    </>
  );
}
