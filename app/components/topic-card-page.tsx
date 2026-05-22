import { cookies } from "next/headers";
import Link from "next/link";
import TopicContributionLoop from "./topic-contribution-loop";
import TopicAiPanel from "./topic-ai-panel";
import { SiteBrand } from "./site-brand";
import type { IssueRoomSlug, TopicCardData } from "../lib/civic-logos";
import { topicCardVisibleContributionLimit } from "../lib/contribution-constants";
import type { PublicContribution } from "../lib/contribution-types";
import {
  getContributionStoreMetadata,
  listPublicContributions,
} from "../lib/contribution-store";
import {
  debateLaneLabels,
  debateLaneOptions,
  type DebateLane,
  type ReviewTargetKind,
} from "../lib/reasoning-types";
import {
  getTopicChatSessionCookieName,
} from "../lib/topic-chat-session";
import {
  getTopicChatStoreMetadata,
  listTopicChatMessages,
} from "../lib/topic-chat-store";
import styles from "../healthcare/proposal-001/page.module.css";

type TopicCardLink = {
  id: string;
  title: string;
  href: string;
};

type LanePressureItem = {
  lane: (typeof debateLaneOptions)[number];
  label: string;
  unresolvedCount: number;
  changedCount: number;
  latestUnresolved: PublicContribution | null;
};

type ContributionRecordView =
  | "needs-review"
  | "changed-card"
  | "ai-assisted"
  | "document-backed";

type ContributionAttachmentFilter = Exclude<ReviewTargetKind, "unclear"> | "none-yet";
type ContributionStatusFilter =
  | "pending"
  | "needs-review"
  | "accepted"
  | "incorporated"
  | "rejected";
type ContributionOriginFilter =
  | "human-submitted"
  | "ai-origin"
  | "seed-example";

type TopicCardPageProps = {
  roomSlug: IssueRoomSlug;
  card: TopicCardData;
  brandSubtitle: string;
  roomHref: string;
  roomLabel: string;
  roomCards: readonly TopicCardLink[];
  currentTopicIndex: number;
};

function getPublicContributionOutcomeNote(
  decisionReason?: string,
  publicRecordNote?: string,
  fallback = "This contribution was marked as changing the card.",
) {
  return publicRecordNote ?? decisionReason ?? fallback;
}

function getContributionLedgerHref({
  recordView,
  attachment,
  reviewStatus,
  origin,
  lane,
  contributionId,
}: {
  recordView?: ContributionRecordView;
  attachment?: ContributionAttachmentFilter;
  reviewStatus?: ContributionStatusFilter;
  origin?: ContributionOriginFilter;
  lane?: DebateLane;
  contributionId?: string;
}) {
  const params = new URLSearchParams();

  if (recordView) {
    params.set("recordView", recordView);
  }

  if (attachment) {
    params.set("attachment", attachment);
  }

  if (reviewStatus) {
    params.set("reviewStatus", reviewStatus);
  }

  if (origin) {
    params.set("origin", origin);
  }

  if (lane) {
    params.set("lane", lane);
  }

  const query = params.toString();
  const hash = contributionId ? `contribution-${contributionId}` : "contribution-record";

  return `${query ? `?${query}` : ""}#${hash}`;
}

function getContributionAttachmentFilter(
  contribution: PublicContribution,
): ContributionAttachmentFilter {
  const kind = contribution.review?.assignedToKind ?? contribution.aiIntake?.suggestedAssignmentKind;

  if (!kind || kind === "unclear") {
    return "none-yet";
  }

  return kind;
}

function getContributionAttachmentLabel(filter: ContributionAttachmentFilter) {
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

function getContributionAttachmentSummary(contribution: PublicContribution) {
  const baseLabel = getContributionAttachmentLabel(
    getContributionAttachmentFilter(contribution),
  );
  const specificLabel =
    contribution.review?.assignedToLabel ?? contribution.aiIntake?.suggestedAssignmentLabel;

  if (!specificLabel) {
    return baseLabel;
  }

  return `${baseLabel} - ${specificLabel}`;
}

function getContributionOrigin(contribution: PublicContribution): ContributionOriginFilter {
  if (contribution.isSeedExample) {
    return "seed-example";
  }

  if (contribution.draftSource) {
    return "ai-origin";
  }

  return "human-submitted";
}

function getContributionOriginLabel(origin: ContributionOriginFilter) {
  switch (origin) {
    case "ai-origin":
      return "AI-origin";
    case "seed-example":
      return "Prototype example";
    case "human-submitted":
    default:
      return "Public submission";
  }
}

function getContributionStatusFilter(status: PublicContribution["status"]): ContributionStatusFilter {
  return status === "needs review" ? "needs-review" : status;
}

function getContributionRecordView(contribution: PublicContribution):
  | ContributionRecordView
  | undefined {
  if (contribution.draftSource) {
    return "ai-assisted";
  }

  if (contribution.review?.changedSynthesis === true) {
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

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getTopicChatMessageHref(messageId: string) {
  return `?chatMessage=${encodeURIComponent(messageId)}#topic-chat-message-${messageId}`;
}

function getExactContributionLedgerHref(contribution: PublicContribution) {
  return getContributionLedgerHref({
    recordView: getContributionRecordView(contribution),
    attachment: getContributionAttachmentFilter(contribution),
    reviewStatus: getContributionStatusFilter(contribution.status),
    origin: getContributionOrigin(contribution),
    lane: contribution.lane,
    contributionId: contribution.id,
  });
}

export default async function TopicCardPage({
  roomSlug,
  card,
  brandSubtitle,
  roomHref,
  roomLabel,
  roomCards,
  currentTopicIndex,
}: TopicCardPageProps) {
  const cookieStore = await cookies();
  const topicChatSessionId =
    cookieStore.get(getTopicChatSessionCookieName())?.value?.trim() ?? "";
  const [liveContributions, contributionStoreMetadata, topicChatMessages, topicChatStoreMetadata] = await Promise.all([
    listPublicContributions({
      roomSlug,
      topicId: card.id,
      limit: topicCardVisibleContributionLimit,
    }),
    getContributionStoreMetadata(),
    topicChatSessionId
      ? listTopicChatMessages({
          sessionId: topicChatSessionId,
          roomSlug,
          topicId: card.id,
          limit: 24,
        })
      : Promise.resolve([]),
    getTopicChatStoreMetadata(),
  ]);
  const contributorObjectionThatChangedCard = liveContributions.find(
    (item) => item.lane === "objection" && item.review?.changedSynthesis === true,
  );
  const strongestLiveContributorObjection = liveContributions.find(
    (item) => item.lane === "objection",
  );
  const incorporatedContributions = liveContributions.filter(
    (item) => item.review?.changedSynthesis === true,
  );
  const incorporatedAssumptions = incorporatedContributions.filter(
    (item) => item.review?.assignedToKind === "assumption",
  );
  const incorporatedEvidence = incorporatedContributions.filter(
    (item) => item.review?.assignedToKind === "evidence",
  );
  const incorporatedQuestions = incorporatedContributions.filter(
    (item) => item.review?.assignedToKind === "open-question",
  );
  const documentBackedContributions = liveContributions.filter(
    (item) => item.evidenceDocument,
  );
  const pendingDocumentContributions = documentBackedContributions.filter(
    (item) => item.status === "pending" || item.status === "needs review",
  );
  const assistedRecordContributions = liveContributions.filter(
    (item) => item.draftSource,
  );
  const assistedPendingContributions = assistedRecordContributions.filter(
    (item) => item.status === "pending" || item.status === "needs review",
  );
  const assistedChangedContributions = assistedRecordContributions.filter(
    (item) => item.review?.changedSynthesis === true,
  );
  const assistedStatusCounts = (
    ["pending", "needs-review", "accepted", "incorporated", "rejected"] as const
  )
    .map((status) => ({
      status,
      label:
        status === "needs-review"
          ? "Needs review"
          : status[0].toUpperCase() + status.slice(1),
      count: assistedRecordContributions.filter(
        (item) => getContributionStatusFilter(item.status) === status,
      ).length,
    }))
    .filter((item) => item.count > 0);
  const assistedAttachmentCounts = (
    ["claim", "objection", "evidence", "assumption", "open-question", "none-yet"] as const
  )
    .map((attachment) => ({
      attachment,
      label: getContributionAttachmentLabel(attachment),
      count: assistedRecordContributions.filter(
        (item) => getContributionAttachmentFilter(item) === attachment,
      ).length,
    }))
    .filter((item) => item.count > 0);
  const assistedLaneCounts = debateLaneOptions
    .map((lane) => ({
      lane,
      label: debateLaneLabels[lane],
      count: assistedRecordContributions.filter((item) => item.lane === lane).length,
    }))
    .filter((item) => item.count > 0);
  const needsAttentionContributions = liveContributions.filter(
    (item) => item.status === "pending" || item.status === "needs review",
  );
  const contributionStatusCounts = {
    pending: liveContributions.filter((item) => item.status === "pending").length,
    needsReview: liveContributions.filter((item) => item.status === "needs review").length,
    accepted: liveContributions.filter((item) => item.status === "accepted").length,
    incorporated: liveContributions.filter((item) => item.status === "incorporated").length,
    rejected: liveContributions.filter((item) => item.status === "rejected").length,
  };
  const changedCardContributions = liveContributions.filter(
    (item) => item.review?.changedSynthesis === true,
  );
  const originCounts = (
    ["human-submitted", "ai-origin", "seed-example"] as const
  )
    .map((origin) => ({
      origin,
      label: getContributionOriginLabel(origin),
      count: liveContributions.filter((item) => getContributionOrigin(item) === origin).length,
    }))
    .filter((item) => item.count > 0);
  const reviewedContributions = [...liveContributions]
    .filter((item) => item.review?.reviewedAt)
    .sort((left, right) => {
      const leftTime = new Date(left.review?.reviewedAt ?? 0).getTime();
      const rightTime = new Date(right.review?.reviewedAt ?? 0).getTime();
      return rightTime - leftTime;
    });
  const lanePressure = debateLaneOptions.reduce<LanePressureItem[]>((acc, lane) => {
      const unresolved = needsAttentionContributions.filter((item) => item.lane === lane);
      const changed = changedCardContributions.filter((item) => item.lane === lane);

      if (!unresolved.length && !changed.length) {
        return acc;
      }

      acc.push({
        lane,
        label: debateLaneLabels[lane],
        unresolvedCount: unresolved.length,
        changedCount: changed.length,
        latestUnresolved: unresolved[0] ?? null,
      });

      return acc;
    }, []);
  const previousCard =
    currentTopicIndex > 0 ? roomCards[currentTopicIndex - 1] : null;
  const nextCard =
    currentTopicIndex < roomCards.length - 1
      ? roomCards[currentTopicIndex + 1]
      : null;
  const siblingCards = roomCards.filter((item) => item.id !== card.id);
  const showInstitutionalPilotCta =
    roomSlug === "institutional-trust" && card.id === "topic-001";

  return (
    <div className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.headerBar}>
          <SiteBrand className={styles.brand} href={roomHref} subtitle={brandSubtitle} />

          <nav className={styles.nav}>
            <Link href="/">Home</Link>
            <Link href={roomHref}>{roomLabel}</Link>
            <a href="#room-context">Room context</a>
            <a href="#debate">Debate lanes</a>
          </nav>
        </div>

        <div className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Working topic card</span>
            <h1>{card.title}</h1>
            <p className={styles.subtitle}>{card.subtitle}</p>
            <p className={styles.thesis}>{card.thesis}</p>
          </div>

          <aside className={styles.heroPanel}>
            <span className={styles.panelLabel}>Card note</span>
            <p>{card.draftNote}</p>
            <p>{card.currentRead}</p>

            <div className={styles.heroMeta}>
              <div>
                <span>Maturity</span>
                <strong>{card.maturity}</strong>
              </div>
              <div>
                <span>Revision history</span>
                <strong>{card.revisionHistory.length} visible updates</strong>
              </div>
              <div>
                <span>AI roles</span>
                <strong>{card.aiPanels.length} active AI roles</strong>
              </div>
            </div>
          </aside>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.gridSection}>
          <article className={styles.panel}>
            <span className={styles.eyebrow}>Current read</span>
            <h2>Why this topic card matters even before it is proven</h2>
            <p>{card.currentRead}</p>

            <div className={styles.copyBlock}>
              <h3>The problem it is trying to solve</h3>
              <p>{card.problemStatement}</p>
            </div>

            <div className={styles.copyBlock}>
              <h3>The proposed move</h3>
              <p>{card.proposedSolution}</p>
            </div>
          </article>

          <article className={styles.scorePanel}>
            <span className={styles.eyebrow}>Current scorecard</span>
            <p>
              These scores are provisional founder estimates about whether the
              card is getting sharper, not a declaration that the room has settled
              the question. Each score should eventually be challengeable by a
              visible rubric and review history.
            </p>

            <div className={styles.scoreList}>
              {card.scorecard.map((item) => (
                <div className={styles.scoreItem} key={item.label}>
                  <div className={styles.scoreTop}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                  <div className={styles.scoreTrack}>
                    <span style={{ width: `${item.value}%` }} />
                  </div>
                  <details className={styles.scoreDetails}>
                    <summary>How this was scored</summary>
                    <p>
                      {item.basis ??
                        "Provisional founder estimate pending a public scoring rubric and challenge workflow."}
                    </p>
                  </details>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className={styles.gridSection}>
          <article className={styles.panel}>
            <span className={styles.eyebrow}>How it works</span>
            <h2>The mechanism should be explicit enough to attack.</h2>
            <ol className={styles.numberList}>
              {card.mechanism.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>

            <div className={styles.copyBlock}>
              <h3>Expected upside</h3>
              <ul className={styles.bulletList}>
                {card.benefits.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </article>

          <article className={styles.panel}>
            <span className={styles.eyebrow}>What it depends on</span>
            <h2>The topic card is only as credible as its assumptions.</h2>
            <ul className={styles.bulletList}>
              {card.assumptions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className={styles.copyBlock}>
              <h3>Stakeholders already in the blast radius</h3>
              <div className={styles.tagList}>
                {card.stakeholders.map((item) => (
                  <span className={styles.tag} key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.copyBlock}>
              <h3>Live review notes on the assumption layer</h3>
              {incorporatedAssumptions.length ? (
                <div className={styles.historyList}>
                  {incorporatedAssumptions.slice(0, 3).map((item) => (
                    <article className={styles.historyItem} key={`assumption-${item.id}`}>
                      <div>
                        <strong>
                          <Link
                            className={styles.sourceLink}
                            href={getExactContributionLedgerHref(item)}
                          >
                            {item.review?.assignedToLabel ?? item.title}
                          </Link>
                        </strong>
                        <span>{item.title}</span>
                      </div>
                      <p>
                        {getPublicContributionOutcomeNote(
                          item.review?.decisionReason,
                          item.review?.publicRecordNote,
                          "A reviewed outside contribution was attached to this assumption layer.",
                        )}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <p>
                  No reviewed outside contribution has yet been attached to the
                  card&apos;s assumption layer.
                </p>
              )}
              <div className={styles.roomActions}>
                <Link
                  className={styles.roomActionSecondary}
                  href={getContributionLedgerHref({ attachment: "assumption" })}
                >
                  Open assumption slice
                </Link>
              </div>
            </div>
          </article>
        </section>

        <section className={styles.gridSection}>
          <article className={styles.panel}>
            <span className={styles.eyebrow}>Stress test</span>
            <h2>Where the topic could fail or misfire</h2>
            <ul className={styles.bulletList}>
              {card.risks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className={styles.copyBlock}>
              <h3>Anticipated objection</h3>
              <p>{card.anticipatedObjection ?? card.strongestObjection}</p>
            </div>

            <div className={styles.copyBlock}>
              <h3>Contributor objection that changed the card</h3>
              {contributorObjectionThatChangedCard ? (
                <>
                  <p>
                    <strong>
                      <Link
                        className={styles.sourceLink}
                        href={getExactContributionLedgerHref(
                          contributorObjectionThatChangedCard,
                        )}
                      >
                        {contributorObjectionThatChangedCard.title}
                      </Link>
                      .
                    </strong>{" "}
                    {contributorObjectionThatChangedCard.body}
                  </p>
                  {contributorObjectionThatChangedCard.review?.reviewerNote ? (
                    <p className={styles.metaParagraph}>
                      Human reviewer note:{" "}
                      {contributorObjectionThatChangedCard.review.reviewerNote}
                    </p>
                  ) : null}
                </>
              ) : strongestLiveContributorObjection ? (
                <>
                  <p>
                    No contributor objection has changed this card yet. The
                    strongest live objection in the visible record is{" "}
                    <strong>
                      <Link
                        className={styles.sourceLink}
                        href={getExactContributionLedgerHref(
                          strongestLiveContributorObjection,
                        )}
                      >
                        {strongestLiveContributorObjection.title}
                      </Link>
                      .
                    </strong>
                  </p>
                  <p>{strongestLiveContributorObjection.body}</p>
                </>
              ) : (
                <p>
                  No contributor objection has changed this card yet. That field
                  should only fill when a reviewed outside objection materially
                  alters the public record.
                </p>
              )}
              <div className={styles.roomActions}>
                <Link
                  className={styles.roomActionSecondary}
                  href={getContributionLedgerHref({ attachment: "objection" })}
                >
                  Open objection slice
                </Link>
              </div>
            </div>

            <div className={styles.copyBlock}>
              <h3>Economic delta</h3>
              <p>{card.economicDelta.summary}</p>
              <ul className={styles.bulletList}>
                {card.economicDelta.metrics.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </article>

          <article className={styles.panel}>
            <span className={styles.eyebrow}>Support and evidence</span>
            <h2>What currently makes the card worth keeping alive</h2>
            <p>{card.strongestSupport}</p>

            <div className={styles.evidenceList}>
              {card.evidence.map((item) => (
                <article className={styles.evidenceCard} key={item.title}>
                  <span>{item.status}</span>
                  <h3>{item.title}</h3>
                  <p>{item.note}</p>
                </article>
              ))}
            </div>

            <div className={styles.copyBlock}>
              <h3>Live review notes on the evidence layer</h3>
              {incorporatedEvidence.length ? (
                <div className={styles.historyList}>
                  {incorporatedEvidence.slice(0, 3).map((item) => (
                    <article className={styles.historyItem} key={`evidence-${item.id}`}>
                      <div>
                        <strong>
                          <Link
                            className={styles.sourceLink}
                            href={getExactContributionLedgerHref(item)}
                          >
                            {item.review?.assignedToLabel ?? item.title}
                          </Link>
                        </strong>
                        <span>{item.title}</span>
                      </div>
                      <p>
                        {getPublicContributionOutcomeNote(
                          item.review?.decisionReason,
                          item.review?.publicRecordNote,
                          "A reviewed outside contribution was attached to the evidence layer.",
                        )}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <p>
                  No reviewed outside contribution has yet been attached to the
                  card&apos;s evidence layer.
                </p>
              )}
              <div className={styles.roomActions}>
                <Link
                  className={styles.roomActionSecondary}
                  href={getContributionLedgerHref({ attachment: "evidence" })}
                >
                  Open evidence slice
                </Link>
              </div>
            </div>

            <div className={styles.copyBlock}>
              <h3>Uploaded documents in the visible evidence record</h3>
              {documentBackedContributions.length ? (
                <>
                  <div className={styles.historyList}>
                    {documentBackedContributions.slice(0, 4).map((item) => {
                      const document = item.evidenceDocument;

                      if (!document) {
                        return null;
                      }

                      const isPendingDocument =
                        item.status === "pending" || item.status === "needs review";

                      return (
                        <article className={styles.historyItem} key={`document-${item.id}`}>
                          <div>
                            <strong>
                              <a
                                className={styles.sourceLink}
                                href={document.downloadHref}
                                rel="noreferrer"
                                target="_blank"
                              >
                                {document.fileName}
                              </a>
                            </strong>
                            <span>
                              {item.status} · {document.mimeType}
                              {item.review?.assignedToLabel
                                ? ` · ${item.review.assignedToLabel}`
                                : ""}
                            </span>
                          </div>
                          <p>
                            Attached through{" "}
                            <strong>
                              <Link
                                className={styles.sourceLink}
                                href={getExactContributionLedgerHref(item)}
                              >
                                {item.title}
                              </Link>
                            </strong>
                            .
                            {item.review?.publicRecordNote
                              ? ` ${item.review.publicRecordNote}`
                              : isPendingDocument
                                ? " This document-backed contribution is still waiting on a full human review decision."
                                : " This document is visible in the record even if its full synthesis impact is still being clarified."}
                          </p>
                          {document.extraction.note ? (
                            <p className={styles.metaParagraph}>
                              {document.extraction.note}
                            </p>
                          ) : null}
                          {document.extraction.excerpt ? (
                            <p className={styles.metaParagraph}>
                              {document.extraction.excerpt}
                            </p>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                  <div className={styles.roomActions}>
                    <Link
                      className={styles.roomActionSecondary}
                      href={getContributionLedgerHref({
                        recordView: "document-backed",
                      })}
                    >
                      View document-backed contributions
                    </Link>
                  </div>
                </>
              ) : (
                <p>
                  No uploaded paper or document is visible on this topic card
                  yet. When someone attaches one through the contribution loop,
                  it should become part of the evidence record rather than
                  disappearing into the queue.
                </p>
              )}
            </div>
          </article>
        </section>

        <section className={styles.gridSection}>
          <article className={styles.panel}>
            <span className={styles.eyebrow}>Review-driven record</span>
            <h2>Human review should change the visible object, not just the queue.</h2>
            <p>
              These are the reviewed outside contributions that have already been
              marked as changing the card&apos;s public reasoning record.
            </p>

            <div className={styles.copyBlock}>
              <h3>Assumptions now under live pressure</h3>
              {incorporatedAssumptions.length ? (
                <div className={styles.historyList}>
                  {incorporatedAssumptions.slice(0, 3).map((item) => (
                    <article className={styles.historyItem} key={item.id}>
                        <div>
                          <strong>
                            <Link
                              className={styles.sourceLink}
                              href={getExactContributionLedgerHref(item)}
                            >
                              {item.title}
                            </Link>
                          </strong>
                          <span>{item.review?.assignedToLabel ?? "Assumption shift"}</span>
                        </div>
                      <p>
                        {getPublicContributionOutcomeNote(
                          item.review?.decisionReason,
                          item.review?.publicRecordNote,
                          "This reviewed contribution was marked as changing an assumption on the card.",
                        )}
                      </p>
                      <p className={styles.metaParagraph}>
                        Debate lane:{" "}
                        <Link
                          className={styles.sourceLink}
                          href={getContributionLedgerHref({
                            recordView: "changed-card",
                            lane: item.lane,
                          })}
                        >
                          {debateLaneLabels[item.lane]}
                        </Link>
                        . Origin:{" "}
                        <Link
                          className={styles.sourceLink}
                          href={getContributionLedgerHref({
                            recordView: "changed-card",
                            origin: getContributionOrigin(item),
                          })}
                        >
                          {getContributionOriginLabel(getContributionOrigin(item))}
                        </Link>
                        . Public record target:{" "}
                        <Link
                          className={styles.sourceLink}
                          href={getContributionLedgerHref({
                            recordView: "changed-card",
                            attachment: getContributionAttachmentFilter(item),
                          })}
                        >
                          {getContributionAttachmentSummary(item)}
                        </Link>
                        .
                      </p>
                      {item.draftSource ? (
                        <p className={styles.metaParagraph}>
                          AI origin: {item.draftSource.providerLabel}
                          {item.draftSource.model
                            ? ` (${item.draftSource.model})`
                            : ""}{" "}
                          on {formatTimestamp(item.draftSource.generatedAt)}.
                          {item.draftSource.messageId ? (
                            <>
                              {" "}
                              <Link
                                className={styles.sourceLink}
                                href={getTopicChatMessageHref(item.draftSource.messageId)}
                              >
                                Open source AI turn
                              </Link>
                            </>
                          ) : null}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p>
                  No reviewed contribution has yet changed the card&apos;s assumption
                  layer. When that happens, it should surface here rather than
                  disappearing into the review backend.
                </p>
              )}
              <div className={styles.roomActions}>
                <Link
                  className={styles.roomActionSecondary}
                  href={getContributionLedgerHref({ attachment: "assumption" })}
                >
                  Open assumption-layer record
                </Link>
              </div>
            </div>

            <div className={styles.copyBlock}>
              <h3>Evidence and question updates already carried forward</h3>
              {incorporatedEvidence.length || incorporatedQuestions.length ? (
                <div className={styles.historyList}>
                  {[...incorporatedEvidence, ...incorporatedQuestions]
                    .slice(0, 4)
                    .map((item) => (
                      <article className={styles.historyItem} key={item.id}>
                        <div>
                          <strong>
                            <Link
                              className={styles.sourceLink}
                              href={getExactContributionLedgerHref(item)}
                            >
                              {item.title}
                            </Link>
                          </strong>
                          <span>{item.review?.assignedToLabel ?? "Reviewed update"}</span>
                        </div>
                        <p>
                          {getPublicContributionOutcomeNote(
                            item.review?.decisionReason,
                            item.review?.publicRecordNote,
                            "This reviewed contribution was marked as changing the card's visible record.",
                          )}
                        </p>
                        <p className={styles.metaParagraph}>
                          Debate lane:{" "}
                          <Link
                            className={styles.sourceLink}
                            href={getContributionLedgerHref({
                              recordView: "changed-card",
                              lane: item.lane,
                            })}
                          >
                            {debateLaneLabels[item.lane]}
                          </Link>
                          . Origin:{" "}
                          <Link
                            className={styles.sourceLink}
                            href={getContributionLedgerHref({
                              recordView: "changed-card",
                              origin: getContributionOrigin(item),
                            })}
                          >
                            {getContributionOriginLabel(getContributionOrigin(item))}
                          </Link>
                          . Public record target:{" "}
                          <Link
                            className={styles.sourceLink}
                            href={getContributionLedgerHref({
                              recordView: "changed-card",
                              attachment: getContributionAttachmentFilter(item),
                            })}
                          >
                            {getContributionAttachmentSummary(item)}
                          </Link>
                          .
                        </p>
                        {item.draftSource ? (
                          <p className={styles.metaParagraph}>
                            AI origin: {item.draftSource.providerLabel}
                            {item.draftSource.model
                              ? ` (${item.draftSource.model})`
                              : ""}{" "}
                            on {formatTimestamp(item.draftSource.generatedAt)}.
                            {item.draftSource.messageId ? (
                              <>
                                {" "}
                                <Link
                                  className={styles.sourceLink}
                                  href={getTopicChatMessageHref(item.draftSource.messageId)}
                                >
                                  Open source AI turn
                              </Link>
                            </>
                          ) : null}
                        </p>
                        ) : null}
                      </article>
                    ))}
                </div>
              ) : (
                <p>
                  No reviewed evidence or open-question contribution has yet been
                  marked as changing the visible record.
                </p>
              )}
              <div className={styles.roomActions}>
                <Link
                  className={styles.roomActionSecondary}
                  href={getContributionLedgerHref({ attachment: "evidence" })}
                >
                  Open evidence slice
                </Link>
                <Link
                  className={styles.roomActionSecondary}
                  href={getContributionLedgerHref({ attachment: "open-question" })}
                >
                  Open open-question slice
                </Link>
              </div>
            </div>
          </article>

          <article className={styles.panel}>
            <span className={styles.eyebrow}>Open pressure</span>
            <h2>The object should also show what is still unresolved.</h2>
            <p>
              A living idea is not only the record of what survived review. It is
              also the record of what still needs a human decision before the
              synthesis can move.
            </p>

            {needsAttentionContributions.length ? (
              <div className={styles.historyList}>
                {needsAttentionContributions.slice(0, 4).map((item) => (
                  <article className={styles.historyItem} key={item.id}>
                    <div>
                      <strong>
                        <Link
                          className={styles.sourceLink}
                          href={getExactContributionLedgerHref(item)}
                        >
                          {item.title}
                        </Link>
                      </strong>
                      <span>{item.status}</span>
                    </div>
                    <p>
                      {item.aiIntake?.reviewerNote ??
                        "Waiting on human placement, acceptance, or rejection."}
                    </p>
                    <p className={styles.metaParagraph}>
                      Lane:{" "}
                      <Link
                        className={styles.sourceLink}
                        href={getContributionLedgerHref({
                          recordView: "needs-review",
                          lane: item.lane,
                        })}
                      >
                        {debateLaneLabels[item.lane]}
                      </Link>
                      . Current record target: {getContributionAttachmentSummary(item)}. Origin:{" "}
                      {getContributionOriginLabel(getContributionOrigin(item))}.
                    </p>
                    {item.draftSource ? (
                      <p className={styles.metaParagraph}>
                        AI origin: {item.draftSource.providerLabel}
                        {item.draftSource.model ? ` (${item.draftSource.model})` : ""} on{" "}
                        {formatTimestamp(item.draftSource.generatedAt)}.
                        {item.draftSource.messageId ? (
                          <>
                            {" "}
                            <Link
                              className={styles.sourceLink}
                              href={getTopicChatMessageHref(item.draftSource.messageId)}
                            >
                              Open source AI turn
                            </Link>
                          </>
                        ) : null}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <p>
                Nothing is currently unresolved on this card. New submissions
                should appear here until a maintainer review resolves them.
              </p>
            )}

            <div className={styles.copyBlock}>
              <h3>Reviewed updates to the open-question layer</h3>
              {incorporatedQuestions.length ? (
                <div className={styles.historyList}>
                  {incorporatedQuestions.slice(0, 3).map((item) => (
                    <article className={styles.historyItem} key={`question-${item.id}`}>
                      <div>
                        <strong>
                          <Link
                            className={styles.sourceLink}
                            href={getExactContributionLedgerHref(item)}
                          >
                            {item.review?.assignedToLabel ?? item.title}
                          </Link>
                        </strong>
                        <span>{item.title}</span>
                      </div>
                      <p>
                        {getPublicContributionOutcomeNote(
                          item.review?.decisionReason,
                          item.review?.publicRecordNote,
                          "A reviewed outside contribution was attached to the open-question layer.",
                        )}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <p>
                  No reviewed outside contribution has yet been attached to the
                  card&apos;s open-question layer.
                </p>
              )}
              <div className={styles.roomActions}>
                <Link
                  className={styles.roomActionSecondary}
                  href={getContributionLedgerHref({ attachment: "open-question" })}
                >
                  Open open-question slice
                </Link>
              </div>
            </div>
          </article>
        </section>

        <section className={styles.panel}>
          <span className={styles.eyebrow}>AI review</span>
          <h2>The AI layer should stay visible as AI analysis, not pretend to be the final judge.</h2>
          <div className={styles.aiGrid}>
            {card.aiPanels.map((item) => (
              <article className={styles.aiCard} key={item.role}>
                <div className={styles.aiMeta}>
                  <h3>{item.role}</h3>
                  <span>{item.confidence} confidence</span>
                </div>
                <p>{item.summary}</p>
                {item.provenance ? (
                  <dl className={styles.aiProvenance}>
                    <div>
                      <dt>Source</dt>
                      <dd>{item.provenance.sourceLabel}</dd>
                    </div>
                    {item.provenance.model ? (
                      <div>
                        <dt>Model</dt>
                        <dd>{item.provenance.model}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt>Stamped</dt>
                      <dd>{item.provenance.generatedAt}</dd>
                    </div>
                    <div>
                      <dt>Prompt class</dt>
                      <dd>{item.provenance.promptCategory}</dd>
                    </div>
                  </dl>
                ) : null}
                {item.provenance?.note ? (
                  <p className={styles.aiProvenanceNote}>{item.provenance.note}</p>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        {showInstitutionalPilotCta ? (
          <section className={styles.panel}>
            <span className={styles.eyebrow}>Institutional pilot</span>
            <h2>Request an institutional review pilot.</h2>
            <p>
              Civic Logos can use a room like this to structure a hard public or
              institutional question into a living review object. Paying for the
              pilot funds review capacity, evidence work, synthesis labor, and
              public memory. It does not buy favorable conclusions.
            </p>

            <div className={styles.copyBlock}>
              <h3>Revenue firewall</h3>
              <ul className={styles.bulletList}>
                <li>Paying funds review capacity, not authority over the synthesis.</li>
                <li>Funder identity, relevant constraints, and review conditions must be disclosed.</li>
                <li>Objections, reviewer notes, and visible revision history remain part of the record.</li>
                <li>Civic Logos does not sell legitimacy, favorable scoring, or quiet review outcomes.</li>
              </ul>
            </div>

            <div className={styles.roomActions}>
              <Link
                className={styles.roomActionPrimary}
                href="/?interest=Institutional%20pilot#contact"
              >
                Request an institutional review pilot
              </Link>
              <Link
                className={styles.roomActionSecondary}
                href="/rooms/institutional-trust"
              >
                Return to trust room
              </Link>
            </div>
          </section>
        ) : null}

        <section className={styles.gridSection}>
          <article className={styles.panel}>
            <span className={styles.eyebrow}>Review cycle</span>
            <h2>This card should show what is waiting on human judgment.</h2>
            <p>
              The contribution record is currently running in{" "}
              <strong>{contributionStoreMetadata.mode}</strong> mode.{" "}
              {contributionStoreMetadata.note}
            </p>

            <div className={styles.snapshotGrid}>
              <article className={styles.snapshotCard}>
                <span className={styles.snapshotLabel}>Live record</span>
                <strong>{liveContributions.length}</strong>
                <p>Visible contributions currently attached to this topic card.</p>
                <Link
                  className={styles.roomActionSecondary}
                  href="#contribution-record"
                >
                  Open contribution ledger
                </Link>
              </article>
              <article className={styles.snapshotCard}>
                <span className={styles.snapshotLabel}>Pending review</span>
                <strong>
                  {contributionStatusCounts.pending + contributionStatusCounts.needsReview}
                </strong>
                <p>Items still waiting on a clear maintainer decision.</p>
                <Link
                  className={styles.roomActionSecondary}
                  href={getContributionLedgerHref({ recordView: "needs-review" })}
                >
                  Open needs-review slice
                </Link>
              </article>
              <article className={styles.snapshotCard}>
                <span className={styles.snapshotLabel}>Changed card</span>
                <strong>{changedCardContributions.length}</strong>
                <p>Contributions whose human review says they altered the public record.</p>
                <Link
                  className={styles.roomActionSecondary}
                  href={getContributionLedgerHref({ recordView: "changed-card" })}
                >
                  Open changed-card slice
                </Link>
              </article>
              <article className={styles.snapshotCard}>
                <span className={styles.snapshotLabel}>Uploaded evidence</span>
                <strong>{documentBackedContributions.length}</strong>
                <p>
                  Document-backed contributions attached to this topic card,
                  with {pendingDocumentContributions.length} still awaiting a
                  full human decision.
                </p>
                <Link
                  className={styles.roomActionSecondary}
                  href={getContributionLedgerHref({ recordView: "document-backed" })}
                >
                  Open document-backed slice
                </Link>
              </article>
            </div>

            <div className={styles.copyBlock}>
              <h3>Review status breakdown</h3>
              <div className={styles.reviewPills}>
                <Link
                  className={styles.reviewPillLink}
                  href={getContributionLedgerHref({ reviewStatus: "pending" })}
                >
                  Pending {contributionStatusCounts.pending}
                </Link>
                <Link
                  className={styles.reviewPillLink}
                  href={getContributionLedgerHref({ reviewStatus: "needs-review" })}
                >
                  Needs review {contributionStatusCounts.needsReview}
                </Link>
                <Link
                  className={styles.reviewPillLink}
                  href={getContributionLedgerHref({ reviewStatus: "accepted" })}
                >
                  Accepted {contributionStatusCounts.accepted}
                </Link>
                <Link
                  className={styles.reviewPillLink}
                  href={getContributionLedgerHref({ reviewStatus: "incorporated" })}
                >
                  Incorporated {contributionStatusCounts.incorporated}
                </Link>
                <Link
                  className={styles.reviewPillLink}
                  href={getContributionLedgerHref({ reviewStatus: "rejected" })}
                >
                  Rejected {contributionStatusCounts.rejected}
                </Link>
              </div>
            </div>

            <div className={styles.copyBlock}>
              <h3>Record origins</h3>
              <p>
                The visible record can now be inspected not just by review
                state or attachment target, but also by where the contribution
                came from.
              </p>
              <div className={styles.reviewPills}>
                {originCounts.map((item) => (
                  <Link
                    className={styles.reviewPillLink}
                    href={getContributionLedgerHref({ origin: item.origin })}
                    key={`origin-${item.origin}`}
                  >
                    {item.label} {item.count}
                  </Link>
                ))}
              </div>
            </div>

            <div className={styles.copyBlock}>
              <h3>Pressure by lane</h3>
              {lanePressure.length ? (
                <div className={styles.lanePressureGrid}>
                  {lanePressure.map((item) => (
                    <article className={styles.lanePressureCard} key={item.lane}>
                      <div className={styles.lanePressureHeader}>
                        <strong>{item.label}</strong>
                        <span>
                          {item.unresolvedCount} open · {item.changedCount} changed card
                        </span>
                      </div>
                      {item.latestUnresolved ? (
                        <>
                          <p>
                            Latest open pressure:{" "}
                            <Link
                              className={styles.sourceLink}
                              href={getExactContributionLedgerHref(item.latestUnresolved)}
                            >
                              {item.latestUnresolved.title}
                            </Link>
                            .
                          </p>
                          <p className={styles.metaParagraph}>
                            Status: {item.latestUnresolved.status}. Current record target:{" "}
                            {getContributionAttachmentSummary(item.latestUnresolved)}. Origin:{" "}
                            <Link
                              className={styles.sourceLink}
                              href={getContributionLedgerHref({
                                recordView: "needs-review",
                                lane: item.lane,
                                origin: getContributionOrigin(item.latestUnresolved),
                              })}
                            >
                              {getContributionOriginLabel(
                                getContributionOrigin(item.latestUnresolved),
                              )}
                            </Link>
                            .
                          </p>
                          {item.latestUnresolved.draftSource ? (
                            <p className={styles.metaParagraph}>
                              AI origin: {item.latestUnresolved.draftSource.providerLabel}
                              {item.latestUnresolved.draftSource.model
                                ? ` (${item.latestUnresolved.draftSource.model})`
                                : ""}{" "}
                              on {formatTimestamp(item.latestUnresolved.draftSource.generatedAt)}.
                              {item.latestUnresolved.draftSource.messageId ? (
                                <>
                                  {" "}
                                  <Link
                                    className={styles.sourceLink}
                                    href={getTopicChatMessageHref(
                                      item.latestUnresolved.draftSource.messageId,
                                    )}
                                  >
                                    Open source AI turn
                                  </Link>
                                </>
                              ) : null}
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <p>
                          No open pressure right now. This lane has only reviewed
                          changes in the current visible record.
                        </p>
                      )}
                      {item.unresolvedCount ? (
                        <Link
                          className={styles.lanePressureLink}
                          href={getContributionLedgerHref({
                            recordView: "needs-review",
                            lane: item.lane,
                          })}
                        >
                          Open unresolved lane slice
                        </Link>
                      ) : null}
                      {item.changedCount ? (
                        <Link
                          className={styles.lanePressureLink}
                          href={getContributionLedgerHref({
                            recordView: "changed-card",
                            lane: item.lane,
                          })}
                        >
                          Open changed-card lane slice
                        </Link>
                      ) : null}
                      <Link
                        className={styles.lanePressureLink}
                        href={`/review/contributions?roomSlug=${encodeURIComponent(
                          roomSlug,
                        )}&topicId=${encodeURIComponent(card.id)}&lane=${encodeURIComponent(
                          item.lane,
                        )}`}
                      >
                        Review this lane
                      </Link>
                    </article>
                  ))}
                </div>
              ) : (
                <p>
                  No lane-level pressure is visible yet. As real contributions
                  arrive, this should show which parts of the card are carrying
                  unresolved scrutiny and which lanes have already changed the
                  object.
                </p>
              )}
            </div>
          </article>

          <article className={styles.panel}>
            <span className={styles.eyebrow}>Manual cycle</span>
            <h2>The loop only becomes real when review decisions become visible.</h2>
            <p>
              A maintainer should be able to read the pending queue, attach each
              contribution to a claim, objection, evidence item, assumption, or
              open question, and then state whether it changed the card.
            </p>

            {changedCardContributions.length ? (
              <>
                <div className={styles.copyBlock}>
                  <h3>Most recent contributor-driven card changes</h3>
                  <ul className={styles.bulletList}>
                    {changedCardContributions.slice(0, 3).map((item) => (
                      <li key={item.id}>
                        <strong>
                          <Link
                            className={styles.sourceLink}
                            href={getExactContributionLedgerHref(item)}
                          >
                            {item.title}
                          </Link>
                          .
                        </strong>{" "}
                        {getPublicContributionOutcomeNote(
                          item.review?.decisionReason,
                          item.review?.publicRecordNote,
                          "Marked as changing the card.",
                        )}
                        <p className={styles.metaParagraph}>
                          Debate lane:{" "}
                          <Link
                            className={styles.sourceLink}
                            href={getContributionLedgerHref({
                              recordView: "changed-card",
                              lane: item.lane,
                            })}
                          >
                            {debateLaneLabels[item.lane]}
                          </Link>
                          . Origin:{" "}
                          <Link
                            className={styles.sourceLink}
                            href={getContributionLedgerHref({
                              recordView: "changed-card",
                              origin: getContributionOrigin(item),
                            })}
                          >
                            {getContributionOriginLabel(getContributionOrigin(item))}
                          </Link>
                          . Public record target:{" "}
                          <Link
                            className={styles.sourceLink}
                            href={getContributionLedgerHref({
                              recordView: "changed-card",
                              attachment: getContributionAttachmentFilter(item),
                            })}
                          >
                            {getContributionAttachmentSummary(item)}
                          </Link>
                          .
                        </p>
                        {item.draftSource ? (
                          <p className={styles.metaParagraph}>
                            AI origin: {item.draftSource.providerLabel}
                            {item.draftSource.model
                              ? ` (${item.draftSource.model})`
                              : ""}{" "}
                            on {formatTimestamp(item.draftSource.generatedAt)}.
                            {item.draftSource.messageId ? (
                              <>
                                {" "}
                                <Link
                                  className={styles.sourceLink}
                                  href={getTopicChatMessageHref(item.draftSource.messageId)}
                                >
                                  Open source AI turn
                                </Link>
                              </>
                            ) : null}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={styles.roomActions}>
                  <Link
                    className={styles.roomActionSecondary}
                    href={getContributionLedgerHref({ recordView: "changed-card" })}
                  >
                    View changed-card contributions
                  </Link>
                </div>
              </>
            ) : (
              <div className={styles.copyBlock}>
                <h3>No contributor-driven card change yet</h3>
                <p>
                  The card is still waiting for a reviewed outside contribution to
                  visibly move its synthesis. That is the threshold this manual
                  cycle is meant to prove.
                </p>
              </div>
            )}

            <div className={styles.copyBlock}>
              <h3>Needs maintainer attention</h3>
              {needsAttentionContributions.length ? (
                <>
                  <ul className={styles.bulletList}>
                    {needsAttentionContributions.slice(0, 3).map((item) => (
                      <li key={item.id}>
                        <strong>
                          <Link
                            className={styles.sourceLink}
                            href={getExactContributionLedgerHref(item)}
                          >
                            {item.title}
                          </Link>
                          .
                        </strong>{" "}
                        {item.aiIntake?.reviewerNote ??
                          "Awaiting clearer human placement, acceptance, or rejection."}
                        <p className={styles.metaParagraph}>
                          Debate lane:{" "}
                          <Link
                            className={styles.sourceLink}
                            href={getContributionLedgerHref({
                              recordView: "needs-review",
                              lane: item.lane,
                            })}
                          >
                            {debateLaneLabels[item.lane]}
                          </Link>
                          . Origin:{" "}
                          <Link
                            className={styles.sourceLink}
                            href={getContributionLedgerHref({
                              recordView: "needs-review",
                              origin: getContributionOrigin(item),
                            })}
                          >
                            {getContributionOriginLabel(getContributionOrigin(item))}
                          </Link>
                          . Current record target:{" "}
                          <Link
                            className={styles.sourceLink}
                            href={getContributionLedgerHref({
                              recordView: "needs-review",
                              attachment: getContributionAttachmentFilter(item),
                            })}
                          >
                            {getContributionAttachmentSummary(item)}
                          </Link>
                          .
                        </p>
                        {item.draftSource ? (
                          <p className={styles.metaParagraph}>
                            AI origin: {item.draftSource.providerLabel}
                            {item.draftSource.model
                              ? ` (${item.draftSource.model})`
                              : ""}{" "}
                            on {formatTimestamp(item.draftSource.generatedAt)}.
                            {item.draftSource.messageId ? (
                              <>
                                {" "}
                                <Link
                                  className={styles.sourceLink}
                                  href={getTopicChatMessageHref(item.draftSource.messageId)}
                                >
                                  Open source AI turn
                                </Link>
                              </>
                            ) : null}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  <div className={styles.roomActions}>
                    <Link
                    className={styles.roomActionSecondary}
                    href={getContributionLedgerHref({ recordView: "needs-review" })}
                  >
                    View needs-review contributions
                  </Link>
                  </div>
                </>
              ) : (
                <p>
                  Nothing is currently waiting on a maintainer decision for this
                  card. New submissions should appear here until a human review
                  resolves them.
                </p>
              )}
            </div>

            <div className={styles.copyBlock}>
              <h3>AI-assisted record activity</h3>
              {assistedRecordContributions.length ? (
                <>
                  <p>
                    {assistedRecordContributions.length} visible contribution
                    {assistedRecordContributions.length === 1 ? "" : "s"} on
                    this card began in the GPT/Claude topic AI layer, with{" "}
                    {assistedPendingContributions.length} still waiting on a full
                    human decision and {assistedChangedContributions.length} already
                    marked as changing the card.
                  </p>
                  <p className={styles.metaParagraph}>
                    By review status:
                  </p>
                  <div className={styles.reviewPills}>
                    {assistedStatusCounts.map((item) => (
                      <Link
                        className={styles.reviewPillLink}
                        href={getContributionLedgerHref({
                          recordView: "ai-assisted",
                          origin: "ai-origin",
                          reviewStatus: item.status,
                        })}
                        key={`assisted-status-${item.status}`}
                      >
                        {item.label} {item.count}
                      </Link>
                    ))}
                  </div>
                  <p className={styles.metaParagraph}>
                    By attachment target:
                  </p>
                  <div className={styles.reviewPills}>
                    {assistedAttachmentCounts.map((item) => (
                      <Link
                        className={styles.reviewPillLink}
                        href={getContributionLedgerHref({
                          recordView: "ai-assisted",
                          origin: "ai-origin",
                          attachment: item.attachment,
                        })}
                        key={`assisted-target-${item.attachment}`}
                      >
                        {item.label} {item.count}
                      </Link>
                    ))}
                  </div>
                  <p className={styles.metaParagraph}>
                    By debate lane:
                  </p>
                  <div className={styles.reviewPills}>
                    {assistedLaneCounts.map((item) => (
                      <Link
                        className={styles.reviewPillLink}
                        href={getContributionLedgerHref({
                          recordView: "ai-assisted",
                          origin: "ai-origin",
                          lane: item.lane,
                        })}
                        key={`assisted-lane-${item.lane}`}
                      >
                        {item.label} {item.count}
                      </Link>
                    ))}
                  </div>
                  <div className={styles.historyList}>
                    {assistedRecordContributions.slice(0, 4).map((item) => (
                      <article className={styles.historyItem} key={`assisted-${item.id}`}>
                        <div>
                        <strong>
                          <Link
                            className={styles.sourceLink}
                            href={getExactContributionLedgerHref(item)}
                          >
                            {item.title}
                          </Link>
                          </strong>
                          <span>
                            {item.status} · {item.draftSource?.providerLabel}
                            {item.draftSource?.model
                              ? ` (${item.draftSource.model})`
                              : ""}{" "}
                            · {getContributionAttachmentSummary(item)}
                          </span>
                        </div>
                        <p>
                          {getPublicContributionOutcomeNote(
                            item.review?.decisionReason,
                            item.review?.publicRecordNote,
                            item.status === "pending" || item.status === "needs review"
                              ? "This AI-assisted topic-chat suggestion is visible in the record and still waiting on a human decision."
                              : "This AI-assisted topic-chat suggestion has been resolved in the public record.",
                          )}
                        </p>
                        <p className={styles.metaParagraph}>
                          Debate lane:{" "}
                          <Link
                            className={styles.sourceLink}
                            href={getContributionLedgerHref({
                              recordView: "ai-assisted",
                              origin: "ai-origin",
                              lane: item.lane,
                            })}
                          >
                            {debateLaneLabels[item.lane]}
                          </Link>
                          . Review status:{" "}
                          <Link
                            className={styles.sourceLink}
                            href={getContributionLedgerHref({
                              recordView: "ai-assisted",
                              origin: "ai-origin",
                              reviewStatus: getContributionStatusFilter(item.status),
                            })}
                          >
                            {item.status}
                          </Link>
                          . Public record target:{" "}
                          <Link
                            className={styles.sourceLink}
                            href={getContributionLedgerHref({
                              recordView: "ai-assisted",
                              origin: "ai-origin",
                              attachment: getContributionAttachmentFilter(item),
                            })}
                          >
                            {getContributionAttachmentSummary(item)}
                          </Link>
                          .
                        </p>
                        <dl className={styles.aiProvenance}>
                          <div>
                            <dt>Source AI</dt>
                            <dd>
                              {item.draftSource?.providerLabel}
                              {item.draftSource?.model
                                ? ` (${item.draftSource.model})`
                                : ""}
                            </dd>
                          </div>
                          <div>
                            <dt>Generated</dt>
                            <dd>
                              {item.draftSource?.generatedAt
                                ? formatTimestamp(item.draftSource.generatedAt)
                                : "Unknown"}
                            </dd>
                          </div>
                          {item.draftSource?.messageId ? (
                            <div>
                              <dt>Source AI turn</dt>
                              <dd>
                                <Link
                                  className={styles.sourceLink}
                                  href={getTopicChatMessageHref(item.draftSource.messageId)}
                                >
                                  Open source AI turn
                                </Link>
                              </dd>
                            </div>
                          ) : null}
                        </dl>
                        {item.draftSource?.question ? (
                          <p className={styles.aiProvenanceNote}>
                            Originating prompt: {item.draftSource.question}
                          </p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                  <div className={styles.roomActions}>
                    <Link
                    className={styles.roomActionSecondary}
                    href={getContributionLedgerHref({
                      recordView: "ai-assisted",
                      origin: "ai-origin",
                    })}
                  >
                    View AI-assisted contributions
                  </Link>
                  </div>
                </>
              ) : (
                <p>
                  No visible contribution on this card has yet come through the
                  live GPT/Claude topic-AI path. When that happens, the card
                  should show the chat-to-record trace here instead of burying it
                  inside the transcript alone.
                </p>
              )}
            </div>

            <div className={styles.copyBlock}>
              <h3>Recent human review decisions</h3>
              {reviewedContributions.length ? (
                <div className={styles.historyList}>
                  {reviewedContributions.slice(0, 4).map((item) => (
                    <article className={styles.historyItem} key={`review-${item.id}`}>
                      <div>
                        <strong>
                          <Link
                            className={styles.sourceLink}
                            href={getContributionLedgerHref({
                              recordView: getContributionRecordView(item),
                              origin: getContributionOrigin(item),
                              reviewStatus: getContributionStatusFilter(item.status),
                              attachment: getContributionAttachmentFilter(item),
                              contributionId: item.id,
                            })}
                          >
                            {item.title}
                          </Link>
                        </strong>
                        <span>
                          {item.status} · {debateLaneLabels[item.lane]} ·{" "}
                          {item.review?.reviewedAt
                            ? new Date(item.review.reviewedAt).toLocaleString("en-US", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : "Reviewed"}
                        </span>
                      </div>
                      <p>
                        {getPublicContributionOutcomeNote(
                          item.review?.decisionReason,
                          item.review?.publicRecordNote,
                          "Human review resolved this contribution without a public note yet.",
                        )}
                      </p>
                      <p className={styles.metaParagraph}>
                        Debate lane:{" "}
                        <Link
                          className={styles.sourceLink}
                          href={getContributionLedgerHref({
                            reviewStatus: getContributionStatusFilter(item.status),
                            lane: item.lane,
                          })}
                        >
                          {debateLaneLabels[item.lane]}
                        </Link>
                        . Origin:{" "}
                        <Link
                          className={styles.sourceLink}
                          href={getContributionLedgerHref({
                            reviewStatus: getContributionStatusFilter(item.status),
                            origin: getContributionOrigin(item),
                          })}
                        >
                          {getContributionOriginLabel(getContributionOrigin(item))}
                        </Link>
                        . Public record target:{" "}
                        <Link
                          className={styles.sourceLink}
                          href={getContributionLedgerHref({
                            reviewStatus: getContributionStatusFilter(item.status),
                            attachment: getContributionAttachmentFilter(item),
                          })}
                        >
                          {getContributionAttachmentSummary(item)}
                        </Link>
                        .{" "}
                        <Link
                          className={styles.sourceLink}
                          href={getContributionLedgerHref({
                            recordView: getContributionRecordView(item),
                            origin: getContributionOrigin(item),
                            reviewStatus: getContributionStatusFilter(item.status),
                            attachment: getContributionAttachmentFilter(item),
                            contributionId: item.id,
                          })}
                        >
                          Open public record entry
                        </Link>
                      </p>
                      {item.draftSource ? (
                        <p className={styles.metaParagraph}>
                          AI origin: {item.draftSource.providerLabel}
                          {item.draftSource.model
                            ? ` (${item.draftSource.model})`
                            : ""}{" "}
                          on {formatTimestamp(item.draftSource.generatedAt)}.
                          {item.draftSource.messageId ? (
                            <>
                              {" "}
                              <Link
                                className={styles.sourceLink}
                                href={getTopicChatMessageHref(item.draftSource.messageId)}
                              >
                                Open source AI turn
                              </Link>
                            </>
                          ) : null}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p>
                  No human review decisions are visible on this card yet. As the
                  manual cycle becomes real, this section should show the latest
                  decisions that resolved or carried forward outside pressure.
                </p>
              )}
            </div>

            <div className={styles.roomActions}>
              <Link
                className={styles.roomActionPrimary}
                href={`/review/contributions?roomSlug=${encodeURIComponent(
                  roomSlug,
                )}&topicId=${encodeURIComponent(card.id)}`}
              >
                Open review queue for this card
              </Link>
              <Link
                className={styles.roomActionSecondary}
                href={`/review/contributions?roomSlug=${encodeURIComponent(
                  roomSlug,
                )}&topicId=${encodeURIComponent(card.id)}&status=${encodeURIComponent(
                  "pending",
                )}`}
              >
                Pending only
              </Link>
              <Link
                className={styles.roomActionSecondary}
                href={`/review/contributions?roomSlug=${encodeURIComponent(
                  roomSlug,
                )}&topicId=${encodeURIComponent(card.id)}&status=${encodeURIComponent(
                  "needs review",
                )}`}
              >
                Needs review only
              </Link>
            </div>
          </article>
        </section>

        <TopicAiPanel
          initialMessages={topicChatMessages}
          initialStoreMode={topicChatStoreMetadata.mode}
          initialStoreNote={topicChatStoreMetadata.note}
          roomSlug={roomSlug}
          topicId={card.id}
          topicTitle={card.title}
        />

        <TopicContributionLoop
          debatePrompts={card.debatePrompts}
          initialContributions={liveContributions}
          initialStoreMode={contributionStoreMetadata.mode}
          initialStoreNote={contributionStoreMetadata.note}
          openQuestions={card.openQuestions}
          roomSlug={roomSlug}
          topicId={card.id}
          topicTitle={card.title}
          whatWouldStrengthen={card.whatWouldStrengthen}
        />

        <section className={styles.gridSection} id="room-context">
          <article className={styles.panel}>
            <span className={styles.eyebrow}>Room context</span>
            <h2>This card should feel like one live object inside a room, not a detached essay.</h2>
            <p>
              {roomLabel} currently has {roomCards.length} live topic
              {roomCards.length === 1 ? " card" : " cards"} in view. This card is{" "}
              {currentTopicIndex + 1} of {roomCards.length}.
            </p>

            <div className={styles.roomActions}>
              <Link className={styles.roomActionPrimary} href={roomHref}>
                Return to room
              </Link>
              {previousCard ? (
                <Link className={styles.roomActionSecondary} href={previousCard.href}>
                  Previous card
                </Link>
              ) : null}
              {nextCard ? (
                <Link className={styles.roomActionSecondary} href={nextCard.href}>
                  Next card
                </Link>
              ) : null}
            </div>
          </article>

          <article className={styles.panel}>
            <span className={styles.eyebrow}>Other live cards</span>
            <h2>The room gets stronger when multiple inspectable directions stay visible.</h2>
            {siblingCards.length ? (
              <div className={styles.relatedCardList}>
                {siblingCards.map((item) => (
                  <Link className={styles.relatedCardItem} href={item.href} key={item.id}>
                    <span>{item.id.replace("topic-", "Topic ")}</span>
                    <strong>{item.title}</strong>
                  </Link>
                ))}
              </div>
            ) : (
              <p>
                This is currently the only live card in the room. The next step is
                not to make this card do everything, but to open more competing
                directions beside it.
              </p>
            )}
          </article>
        </section>

        <section className={styles.panel}>
          <span className={styles.eyebrow}>Version history</span>
          <h2>The card should show how the public reasoning moves over time.</h2>
          <div className={styles.historyList}>
            {card.revisionHistory.map((item) => (
              <article className={styles.historyItem} key={item.version}>
                <div>
                  <strong>{item.version}</strong>
                  <span>{item.date}</span>
                </div>
                <p>{item.note}</p>
              </article>
            ))}
          </div>

          <div className={styles.copyBlock}>
            <h3>Contribution-driven trace</h3>
            {changedCardContributions.length ? (
              <div className={styles.historyList}>
                {changedCardContributions.slice(0, 4).map((item) => (
                  <article className={styles.historyItem} key={item.id}>
                    <div>
                      <strong>{item.title}</strong>
                      <span>
                        {item.review?.reviewedAt
                          ? new Date(item.review.reviewedAt).toLocaleString("en-US", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "Reviewed change"}
                      </span>
                    </div>
                    <p>
                      {getPublicContributionOutcomeNote(
                        item.review?.decisionReason,
                        item.review?.publicRecordNote,
                      )}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p>
                No reviewed outside contribution has been marked as changing this
                card yet. When that happens, the change should appear here as part
                of the visible public revision trail.
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
