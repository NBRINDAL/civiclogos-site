import Link from "next/link";
import {
  getRoomTopicCard,
  getRoomTopicHref,
  issueRooms,
  type IssueRoomSlug,
} from "@/app/lib/civic-logos";
import { getContributionStoreMetadata, listAllContributions } from "@/app/lib/contribution-store";
import {
  debateLaneOptions,
  debateLaneLabels,
  reviewStatusOptions,
  reviewTargetKindOptions,
  type DebateLane,
} from "@/app/lib/reasoning-types";
import { updateContributionReview } from "./actions";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type ContributionOrigin = "seed-example" | "ai-origin" | "human-submitted";

function isRoomSlug(value: string): value is IssueRoomSlug {
  return value in issueRooms;
}

function isDebateLane(value: string): value is DebateLane {
  return debateLaneOptions.includes(value as DebateLane);
}

const reviewStatusPriority: Record<string, number> = {
  pending: 0,
  "needs review": 1,
  accepted: 2,
  incorporated: 3,
  rejected: 4,
};

function getContributionOrigin(contribution: {
  draftSource?: unknown;
  isSeedExample?: boolean;
}): ContributionOrigin {
  if (contribution.isSeedExample) {
    return "seed-example";
  }

  if (contribution.draftSource) {
    return "ai-origin";
  }

  return "human-submitted";
}

function getContributionOriginLabel(origin: ContributionOrigin) {
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

function isPublicSubmission(contribution: {
  draftSource?: unknown;
  isSeedExample?: boolean;
}) {
  return !contribution.isSeedExample && !contribution.draftSource;
}

function getContributionStatusFilter(status: string) {
  return status === "needs review" ? "needs-review" : status;
}

function getContributionAttachmentFilter(contribution: {
  aiIntake?: { suggestedAssignmentKind?: string | null };
  review?: { assignedToKind?: string | null };
}) {
  const kind = contribution.review?.assignedToKind ?? contribution.aiIntake?.suggestedAssignmentKind;

  if (!kind || kind === "unclear") {
    return "none-yet";
  }

  return kind;
}

function getContributionAttachmentLabel(filter: string) {
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

function getContributionAttachmentSummary(contribution: {
  aiIntake?: { suggestedAssignmentKind?: string | null; suggestedAssignmentLabel?: string | null };
  review?: { assignedToKind?: string | null; assignedToLabel?: string | null };
}) {
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

function getContributionRecordView(contribution: {
  draftSource?: unknown;
  evidenceDocument?: unknown;
  review?: { changedSynthesis?: boolean | null };
  status: string;
}) {
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

function isReviewableContribution(contribution: { status: string }) {
  return contribution.status === "pending" || contribution.status === "needs review";
}

function getReviewQueueHref({
  lane,
  roomSlug,
  status,
  topicId,
}: {
  lane?: DebateLane;
  roomSlug?: IssueRoomSlug;
  status?: string;
  topicId?: string;
}) {
  const params = new URLSearchParams();

  if (roomSlug) {
    params.set("roomSlug", roomSlug);
  }

  if (topicId) {
    params.set("topicId", topicId);
  }

  if (status) {
    params.set("status", status);
  }

  if (lane) {
    params.set("lane", lane);
  }

  const query = params.toString();
  return query ? `/review/contributions?${query}` : "/review/contributions";
}

function getTopicChatMessageHref(item: {
  aiIntake?: {
    suggestedAssignmentKind?: string | null;
    suggestedAssignmentLabel?: string | null;
  };
  draftSource?: { messageId?: string | null };
  evidenceDocument?: unknown;
  id: string;
  isSeedExample?: boolean;
  lane: string;
  review?: {
    assignedToKind?: string | null;
    assignedToLabel?: string | null;
    changedSynthesis?: boolean | null;
  };
  status: string;
  title: string;
}) {
  const messageId = item.draftSource?.messageId?.trim();

  if (!messageId) {
    return "#topic-ai-transcript";
  }

  const params = new URLSearchParams({
    chatMessage: messageId,
    sourceContribution: item.id,
    sourceContributionTitle: item.title,
    sourceOrigin: getContributionOrigin(item),
    sourceReviewStatus: getContributionStatusFilter(item.status),
    sourceAttachment: getContributionAttachmentFilter(item),
    sourceAttachmentSummary: getContributionAttachmentSummary(item),
    sourceLane: item.lane,
  });

  const recordView = getContributionRecordView(item);

  if (recordView) {
    params.set("sourceRecordView", recordView);
  }

  return `?${params.toString()}#topic-chat-message-${messageId}`;
}

function getSuggestedAttachmentTargets(
  topicCard: NonNullable<ReturnType<typeof getRoomTopicCard>>,
) {
  return {
    claim: [
      { label: "Card thesis", value: topicCard.thesis },
      { label: "Current read", value: topicCard.currentRead },
      ...topicCard.whatWouldStrengthen.slice(0, 3).map((item) => ({
        label: "Strengthening path",
        value: item,
      })),
    ],
    objection: [
      {
        label: "Anticipated objection",
        value: topicCard.anticipatedObjection ?? topicCard.strongestObjection,
      },
    ],
    evidence: topicCard.evidence.map((item) => ({
      label: item.status,
      value: item.title,
    })),
    assumption: topicCard.assumptions.map((item) => ({
      label: "Assumption",
      value: item,
    })),
    "open-question": topicCard.openQuestions.map((item) => ({
      label: "Open question",
      value: item,
    })),
  };
}

export default async function ContributionReviewPage({
  searchParams,
}: {
  searchParams: Promise<{
    roomSlug?: string;
    topicId?: string;
    status?: string;
    lane?: string;
  }>;
}) {
  const params = await searchParams;
  const roomSlug = params.roomSlug?.trim() ?? "";
  const topicId = params.topicId?.trim() ?? "";
  const status = params.status?.trim() ?? "";
  const lane = params.lane?.trim() ?? "";
  const scopedRoomSlug = isRoomSlug(roomSlug) ? roomSlug : undefined;
  const scopedTopicId =
    scopedRoomSlug && topicId && getRoomTopicCard(scopedRoomSlug, topicId)
      ? topicId
      : undefined;
  const scopedTopicCard =
    scopedRoomSlug && scopedTopicId
      ? getRoomTopicCard(scopedRoomSlug, scopedTopicId)
      : undefined;
  const scopedLane = isDebateLane(lane) ? lane : undefined;
  const scopedLaneGuidance =
    scopedTopicCard && scopedLane
      ? scopedTopicCard.debatePrompts.find((item) => item.id === scopedLane)
      : undefined;
  const suggestedAttachmentTargets = scopedTopicCard
    ? getSuggestedAttachmentTargets(scopedTopicCard)
    : null;
  const assignmentDatalistId =
    scopedRoomSlug && scopedTopicId
      ? `assignment-targets-${scopedRoomSlug}-${scopedTopicId}`
      : "assignment-targets-generic";
  const [contributions, metadata] = await Promise.all([
    listAllContributions({
      roomSlug: scopedRoomSlug,
      topicId: scopedTopicId,
      limit: 50,
      status: status || undefined,
      lane: scopedLane,
    }),
    getContributionStoreMetadata(),
  ]);
  const sortedContributions = [...contributions].sort((left, right) => {
    const statusDelta =
      (reviewStatusPriority[left.status] ?? 99) -
      (reviewStatusPriority[right.status] ?? 99);

    if (statusDelta !== 0) {
      return statusDelta;
    }

    return (
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  });
  const publicSubmissions = sortedContributions.filter(isPublicSubmission);
  const publicReviewQueue = publicSubmissions.filter(isReviewableContribution);
  const publicSpotlightItems = (
    publicReviewQueue.length ? publicReviewQueue : publicSubmissions
  ).slice(0, 3);
  const summary = {
    pending: sortedContributions.filter((item) => item.status === "pending").length,
    needsReview: sortedContributions.filter((item) => item.status === "needs review").length,
    accepted: sortedContributions.filter((item) => item.status === "accepted").length,
    incorporated: sortedContributions.filter((item) => item.status === "incorporated").length,
    rejected: sortedContributions.filter((item) => item.status === "rejected").length,
    reviewable: sortedContributions.filter(isReviewableContribution).length,
    publicSubmissions: publicSubmissions.length,
    prototypeExamples: sortedContributions.filter((item) => item.isSeedExample).length,
    aiOrigin: sortedContributions.filter((item) => item.draftSource).length,
    documentBacked: sortedContributions.filter((item) => item.evidenceDocument).length,
    changedCard: sortedContributions.filter(
      (item) => item.review?.changedSynthesis === true,
    ).length,
  };
  const scopeLabel =
    scopedRoomSlug && scopedTopicId
      ? `${scopedRoomSlug} / ${scopedTopicId}`
      : scopedRoomSlug
        ? scopedRoomSlug
        : "all rooms";

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <span className={styles.eyebrow}>Maintainer review</span>
          <h1>Review the contribution queue like a reasoning object, not a comment inbox.</h1>
          <p>
            This prototype surface is where pending submissions can be assigned to
            claims, objections, evidence, assumptions, and open questions before
            they visibly affect a living topic card.
          </p>
          <p className={styles.meta}>{metadata.note}</p>
          <p className={styles.meta}>
            Current scope: <strong>{scopeLabel}</strong>
          </p>
        </section>

        <section className={styles.panel}>
          <div className={styles.queueHeader}>
            <div>
              <span className={styles.eyebrow}>First public contribution watch</span>
              <h2>Make outside submissions impossible to miss.</h2>
            </div>
            <Link
              className={styles.topicSnapshotLink}
              href="/healthcare/topic-001?view=ledger&contributeLane=objection&contributeFrom=first-card#debate"
            >
              Open pressure-test path
            </Link>
          </div>

          <div className={styles.provenanceGrid}>
            <article className={styles.provenanceCard}>
              <span>Public submissions</span>
              <strong>{summary.publicSubmissions}</strong>
              <p>Non-prototype, non-AI-origin records from outside contributors.</p>
            </article>
            <article className={styles.provenanceCard}>
              <span>Needs human review</span>
              <strong>{summary.reviewable}</strong>
              <p>Pending or needs-review records awaiting maintainer judgment.</p>
            </article>
            <article className={styles.provenanceCard}>
              <span>Prototype examples</span>
              <strong>{summary.prototypeExamples}</strong>
              <p>Seed records used to show the product loop without faking usage.</p>
            </article>
            <article className={styles.provenanceCard}>
              <span>AI-origin records</span>
              <strong>{summary.aiOrigin}</strong>
              <p>Contributions promoted from assisted reader turns, not final judgments.</p>
            </article>
            <article className={styles.provenanceCard}>
              <span>Document-backed</span>
              <strong>{summary.documentBacked}</strong>
              <p>Records with uploaded evidence artifacts or extraction state.</p>
            </article>
            <article className={styles.provenanceCard}>
              <span>Changed card</span>
              <strong>{summary.changedCard}</strong>
              <p>Records marked by human review as changing the live synthesis.</p>
            </article>
          </div>

          {publicSpotlightItems.length ? (
            <div className={styles.publicSubmissionPanel}>
              <div className={styles.queueHeader}>
                <div>
                  <span className={styles.eyebrow}>Public submission spotlight</span>
                  <h2>
                    {publicReviewQueue.length
                      ? "Review these outside submissions first."
                      : "Public submissions are present in the record."}
                  </h2>
                </div>
                {publicReviewQueue.length ? (
                  <Link
                    className={styles.topicSnapshotLink}
                    href={getReviewQueueHref({
                      roomSlug: scopedRoomSlug,
                      topicId: scopedTopicId,
                      lane: scopedLane,
                    })}
                  >
                    Open review queue
                  </Link>
                ) : null}
              </div>

              <div className={styles.publicSubmissionList}>
                {publicSpotlightItems.map((item) => (
                  <article className={styles.publicSubmissionCard} key={item.id}>
                    <div className={styles.statusBar}>
                      <span className={styles.badge}>{item.status}</span>
                      <span className={styles.badge}>{debateLaneLabels[item.lane]}</span>
                      {item.evidenceDocument ? (
                        <span className={styles.seed}>Document-backed</span>
                      ) : null}
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                    <dl className={styles.spotlightFacts}>
                      <div>
                        <dt>Created</dt>
                        <dd>
                          {new Date(item.createdAt).toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </dd>
                      </div>
                      <div>
                        <dt>Suggested attachment</dt>
                        <dd>{getContributionAttachmentSummary(item)}</dd>
                      </div>
                      <div>
                        <dt>Card impact</dt>
                        <dd>
                          {item.review?.changedSynthesis === true
                            ? "Changed card"
                            : item.aiIntake?.changedSynthesisLikely === true
                              ? "AI suggests possible card change"
                              : "Human decision pending"}
                        </dd>
                      </div>
                    </dl>
                    {item.aiIntake?.reviewerNote ? (
                      <p className={styles.prefillNote}>{item.aiIntake.reviewerNote}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <span className={styles.eyebrow}>No outside public submissions yet</span>
              <h2>The first public contribution will get its own review lane here.</h2>
              <p>
                When someone submits a real objection, evidence source, or correction,
                it will appear with its lane, AI sorting, suggested attachment, and
                human-review status. Prototype examples stay labeled separately so
                Civic Logos never has to pretend seeded records are public use.
              </p>
            </div>
          )}
        </section>

        <section className={styles.panel}>
          {scopedRoomSlug && scopedTopicCard ? (
            <div className={styles.topicSnapshot}>
              <div className={styles.topicSnapshotHeader}>
                <div>
                  <span className={styles.eyebrow}>Scoped topic snapshot</span>
                  <h2>{scopedTopicCard.title}</h2>
                </div>
                <Link
                  className={styles.topicSnapshotLink}
                  href={getRoomTopicHref(scopedRoomSlug, scopedTopicCard.id)}
                >
                  Open topic card
                </Link>
              </div>

              <div className={styles.topicSnapshotGrid}>
                <article className={styles.topicSnapshotCard}>
                  <strong>Current read</strong>
                  <p>{scopedTopicCard.currentRead}</p>
                </article>
                <article className={styles.topicSnapshotCard}>
                  <strong>Thesis under review</strong>
                  <p>{scopedTopicCard.thesis}</p>
                </article>
              </div>

              <div className={styles.topicSnapshotGrid}>
                <article className={styles.topicSnapshotCard}>
                  <strong>Anticipated objection</strong>
                  <p>
                    {scopedTopicCard.anticipatedObjection ??
                      scopedTopicCard.strongestObjection}
                  </p>
                </article>
                <article className={styles.topicSnapshotCard}>
                  <strong>Open questions the queue can help resolve</strong>
                  <ul className={styles.topicQuestionList}>
                    {scopedTopicCard.openQuestions.slice(0, 3).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              </div>

              <div className={styles.topicSnapshot}>
                <div className={styles.topicSnapshotHeader}>
                  <div>
                    <span className={styles.eyebrow}>Reasoning lane guidance</span>
                    <h2>
                      {scopedLaneGuidance
                        ? `Current lane: ${scopedLaneGuidance.title}`
                        : "How this topic wants contributions to behave"}
                    </h2>
                  </div>
                </div>

                {scopedLaneGuidance ? (
                  <div className={styles.topicSnapshotCard}>
                    <strong>{scopedLaneGuidance.title}</strong>
                    <p>{scopedLaneGuidance.description}</p>
                    <Link
                      className={styles.topicSnapshotLink}
                      href={`/review/contributions?roomSlug=${encodeURIComponent(
                        scopedRoomSlug,
                      )}&topicId=${encodeURIComponent(scopedTopicCard.id)}`}
                    >
                      View all lanes for this topic
                    </Link>
                  </div>
                ) : (
                  <div className={styles.laneGuidanceGrid}>
                    {scopedTopicCard.debatePrompts
                      .filter((item): item is typeof item & { id: DebateLane } =>
                        Boolean(item.id),
                      )
                      .map((item) => (
                        <article className={styles.laneGuidanceCard} key={item.id}>
                          <strong>{item.title}</strong>
                          <p>{item.description}</p>
                          <Link
                            className={styles.topicSnapshotLink}
                            href={`/review/contributions?roomSlug=${encodeURIComponent(
                              scopedRoomSlug,
                            )}&topicId=${encodeURIComponent(
                              scopedTopicCard.id,
                            )}&lane=${encodeURIComponent(item.id)}`}
                          >
                            Open this lane
                          </Link>
                        </article>
                      ))}
                  </div>
                )}
              </div>

              {suggestedAttachmentTargets ? (
                <div className={styles.topicSnapshot}>
                  <div className={styles.topicSnapshotHeader}>
                    <div>
                      <span className={styles.eyebrow}>Suggested attachment targets</span>
                      <h2>Attach reviewed contributions back to the live object.</h2>
                    </div>
                  </div>

                  <div className={styles.attachmentGrid}>
                    {(
                      [
                        ["claim", "Claims and room direction"],
                        ["objection", "Objection anchor"],
                        ["evidence", "Evidence layer"],
                        ["assumption", "Assumption layer"],
                        ["open-question", "Open questions"],
                      ] as const
                    ).map(([kind, title]) => {
                      const items = suggestedAttachmentTargets[kind];

                      return (
                        <article className={styles.attachmentCard} key={kind}>
                          <strong>{title}</strong>
                          <ul className={styles.topicQuestionList}>
                            {items.length ? (
                              items.slice(0, 4).map((item) => (
                                <li key={`${kind}-${item.value}`}>
                                  <span>{item.label}: </span>
                                  {item.value}
                                </li>
                              ))
                            ) : (
                              <li>No current targets listed for this layer.</li>
                            )}
                          </ul>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <form className={styles.filterForm} method="get">
            {scopedRoomSlug ? (
              <input name="roomSlug" type="hidden" value={scopedRoomSlug} />
            ) : null}
            {scopedTopicId ? (
              <input name="topicId" type="hidden" value={scopedTopicId} />
            ) : null}
            <label className={styles.filterField}>
              <span>Status filter</span>
              <select defaultValue={status} name="status">
                <option value="">All statuses</option>
                {reviewStatusOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.filterField}>
              <span>Lane filter</span>
              <select defaultValue={scopedLane ?? ""} name="lane">
                <option value="">All lanes</option>
                {debateLaneOptions.map((item) => (
                  <option key={item} value={item}>
                    {debateLaneLabels[item]}
                  </option>
                ))}
              </select>
            </label>
            <button className={styles.filterButton} type="submit">
              Apply filters
            </button>
            <Link
              className={styles.filterReset}
              href={
                scopedRoomSlug && scopedTopicId
                  ? `/review/contributions?roomSlug=${encodeURIComponent(
                      scopedRoomSlug,
                    )}&topicId=${encodeURIComponent(scopedTopicId)}`
                  : scopedRoomSlug
                    ? `/review/contributions?roomSlug=${encodeURIComponent(scopedRoomSlug)}`
                    : "/review/contributions"
              }
            >
              Clear filters
            </Link>
          </form>

          <div className={styles.summaryRow}>
            <div className={styles.summaryCard}>
              <span>Pending</span>
              <strong>{summary.pending}</strong>
            </div>
            <div className={styles.summaryCard}>
              <span>Needs review</span>
              <strong>{summary.needsReview}</strong>
            </div>
            <div className={styles.summaryCard}>
              <span>Accepted</span>
              <strong>{summary.accepted}</strong>
            </div>
            <div className={styles.summaryCard}>
              <span>Incorporated</span>
              <strong>{summary.incorporated}</strong>
            </div>
            <div className={styles.summaryCard}>
              <span>Rejected</span>
              <strong>{summary.rejected}</strong>
            </div>
          </div>

          <h2 className={styles.sectionTitle}>Contribution queue</h2>
          <div className={styles.list}>
            {sortedContributions.length ? sortedContributions.map((item) => {
              const suggestedAssignmentKind =
                item.review?.assignedToKind ?? item.aiIntake?.suggestedAssignmentKind ?? "";
              const suggestedAssignmentLabel =
                item.review?.assignedToLabel ?? item.aiIntake?.suggestedAssignmentLabel ?? "";
              const suggestedChangedSynthesis =
                item.review?.changedSynthesis ?? item.aiIntake?.changedSynthesisLikely ?? null;
              const hasAiReviewSuggestion =
                Boolean(item.aiIntake?.summary) ||
                Boolean(item.aiIntake?.reviewerNote) ||
                Boolean(item.aiIntake?.suggestedAssignmentKind) ||
                Boolean(item.aiIntake?.suggestedAssignmentLabel);
              const origin = getContributionOrigin(item);
              const provenanceBadges = [
                getContributionOriginLabel(origin),
                item.evidenceDocument ? "Document-backed" : null,
                item.review?.changedSynthesis === true ? "Changed card" : null,
              ].filter(Boolean) as string[];

              return (
              <article className={styles.contribution} key={item.id}>
                <div className={styles.statusBar}>
                  <span className={styles.badge}>{item.status}</span>
                  <span className={styles.badge}>{debateLaneLabels[item.lane]}</span>
                  {provenanceBadges.map((badge) => (
                    <span
                      className={badge === "Prototype example" ? styles.seed : styles.badge}
                      key={`${item.id}-${badge}`}
                    >
                      {badge}
                    </span>
                  ))}
                  <Link
                    className={styles.topicLink}
                    href={getRoomTopicHref(item.roomSlug, item.topicId)}
                  >
                    Open topic card
                  </Link>
                </div>

                <div className={styles.meta}>
                  <h2>{item.title}</h2>
                  <p>{item.body}</p>
                  <p>
                    <strong>{item.topicTitle}</strong> · {item.roomSlug} · created{" "}
                    {new Date(item.createdAt).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  {item.draftSource ? (
                    <p>
                      Assisted draft source: {item.draftSource.providerLabel} (
                      {item.draftSource.model}) ·{" "}
                      {new Date(item.draftSource.generatedAt).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                      {item.draftSource.messageId ? (
                        <>
                          {" "}·{" "}
                          <Link
                            className={styles.topicLink}
                            href={`${getRoomTopicHref(item.roomSlug, item.topicId)}${getTopicChatMessageHref(item)}`}
                          >
                            Open source AI turn
                          </Link>
                        </>
                      ) : null}
                    </p>
                  ) : null}
                  {item.author.name || item.author.email || item.author.expertise ? (
                    <p>
                      Contributor:{" "}
                      {[item.author.name, item.author.email, item.author.expertise]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  ) : null}
                  {item.evidenceSource?.url ? (
                    <p>
                      Source:{" "}
                      <a href={item.evidenceSource.url} rel="noreferrer" target="_blank">
                        {item.evidenceSource.label || item.evidenceSource.url}
                      </a>
                    </p>
                  ) : null}
                  {item.evidenceDocument ? (
                    <>
                      <p>
                        Uploaded document:{" "}
                        <a
                          href={item.evidenceDocument.downloadHref}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {item.evidenceDocument.fileName}
                        </a>{" "}
                        · {item.evidenceDocument.mimeType} ·{" "}
                        {Math.max(item.evidenceDocument.sizeBytes / 1024, 1).toFixed(1)} KB
                      </p>
                      <p>
                        Extraction status: {item.evidenceDocument.extraction.status}
                        {item.evidenceDocument.extraction.pageCount
                          ? ` · ${item.evidenceDocument.extraction.pageCount} pages`
                          : ""}
                        {item.evidenceDocument.extraction.wordCount
                          ? ` · ${item.evidenceDocument.extraction.wordCount} words`
                          : ""}
                      </p>
                      {item.evidenceDocument.extraction.note ? (
                        <p>{item.evidenceDocument.extraction.note}</p>
                      ) : null}
                      {item.evidenceDocument.extraction.excerpt ? (
                        <p>{item.evidenceDocument.extraction.excerpt}</p>
                      ) : null}
                    </>
                  ) : null}
                </div>

                <div className={styles.providerList}>
                  {item.aiIntake?.providers.length ? (
                    item.aiIntake.providers.map((provider) => (
                      <div className={styles.providerCard} key={provider.provider}>
                        <strong>
                          {provider.provider === "openai" ? "OpenAI intake" : "Claude intake"}
                        </strong>
                        <p>Status: {provider.state}</p>
                        {provider.model ? <p>Model: {provider.model}</p> : null}
                        {provider.summary ? <p>{provider.summary}</p> : null}
                        {provider.suggestedAssignmentLabel ? (
                          <p>
                            Suggested placement:{" "}
                            {provider.suggestedAssignmentKind
                              ? `${provider.suggestedAssignmentKind} — `
                              : ""}
                            {provider.suggestedAssignmentLabel}
                          </p>
                        ) : null}
                        {provider.reviewerNote ? <p>{provider.reviewerNote}</p> : null}
                        {provider.errorMessage ? <p>{provider.errorMessage}</p> : null}
                      </div>
                    ))
                  ) : (
                    <div className={styles.providerCard}>
                      <strong>AI intake</strong>
                      <p>No provider output is attached to this contribution yet.</p>
                    </div>
                  )}

                  {item.review ? (
                    <div className={styles.reviewSummary}>
                      <strong>Current review record</strong>
                      {item.review.assignedToKind || item.review.assignedToLabel ? (
                        <p>
                          Assigned to:{" "}
                          {[item.review.assignedToKind, item.review.assignedToLabel]
                            .filter(Boolean)
                            .join(" — ")}
                        </p>
                      ) : null}
                      {typeof item.review.changedSynthesis === "boolean" ? (
                        <p>
                          Changed synthesis: {item.review.changedSynthesis ? "yes" : "no"}
                        </p>
                      ) : null}
                      {item.review.publicRecordNote ? (
                        <p>
                          Public record note: {item.review.publicRecordNote}
                        </p>
                      ) : null}
                      {item.review.decisionReason ? <p>{item.review.decisionReason}</p> : null}
                      {item.review.reviewerNote ? <p>{item.review.reviewerNote}</p> : null}
                    </div>
                  ) : null}

                  {hasAiReviewSuggestion ? (
                    <div className={styles.suggestionSummary}>
                      <strong>Assisted-review recommendation</strong>
                      {item.aiIntake?.summary ? <p>{item.aiIntake.summary}</p> : null}
                      {item.aiIntake?.suggestedAssignmentLabel ? (
                        <p>
                          Suggested placement:{" "}
                          {item.aiIntake.suggestedAssignmentKind
                            ? `${item.aiIntake.suggestedAssignmentKind} — `
                            : ""}
                          {item.aiIntake.suggestedAssignmentLabel}
                        </p>
                      ) : null}
                      {item.aiIntake?.laneFit ? (
                        <p>Suggested lane fit: {debateLaneLabels[item.aiIntake.laneFit]}</p>
                      ) : null}
                      {typeof item.aiIntake?.changedSynthesisLikely === "boolean" ? (
                        <p>
                          Suggested synthesis impact:{" "}
                          {item.aiIntake.changedSynthesisLikely
                            ? "Likely to change the card"
                            : "Unlikely to change the card"}
                        </p>
                      ) : null}
                      {item.aiIntake?.reviewerNote ? (
                        <p>{item.aiIntake.reviewerNote}</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <form action={updateContributionReview} className={styles.reviewForm}>
                  <input name="id" type="hidden" value={item.id} />
                  <input name="roomSlug" type="hidden" value={item.roomSlug} />
                  <input name="topicId" type="hidden" value={item.topicId} />
                  <h3>Review decision</h3>

                  <div className={styles.reviewFields}>
                    <label className={styles.field}>
                      <span>Status</span>
                      <select defaultValue={item.status} name="status">
                        {reviewStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className={styles.field}>
                      <span>Assign to</span>
                      <select
                        defaultValue={suggestedAssignmentKind}
                        name="assignedToKind"
                      >
                        <option value="">Not assigned yet</option>
                        {reviewTargetKindOptions.map((kind) => (
                          <option key={kind} value={kind}>
                            {kind}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className={styles.field}>
                      <span>Assignment label</span>
                      <input
                        defaultValue={suggestedAssignmentLabel}
                        list={assignmentDatalistId}
                        name="assignedToLabel"
                        placeholder="Claim, objection, evidence item, assumption, or question"
                      />
                    </label>

                    <label className={styles.field}>
                      <span>Changed synthesis?</span>
                      <select
                        defaultValue={
                          item.review?.changedSynthesis === true
                            ? "yes"
                          : item.review?.changedSynthesis === false
                              ? "no"
                              : suggestedChangedSynthesis === true
                                ? "yes"
                                : suggestedChangedSynthesis === false
                                  ? "no"
                                  : "undecided"
                        }
                        name="changedSynthesis"
                      >
                        <option value="undecided">Undecided</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </label>
                  </div>

                  {hasAiReviewSuggestion && !item.review ? (
                    <p className={styles.prefillNote}>
                      The placement fields above were prefilled from the AI
                      suggestion. Keep, revise, or clear them before saving the human
                      review decision.
                    </p>
                  ) : null}

                  <label className={styles.field}>
                    <span>Public record note</span>
                    <textarea
                      defaultValue={item.review?.publicRecordNote ?? ""}
                      name="publicRecordNote"
                      placeholder="Short public-facing note for the topic card describing what changed or why this contribution matters."
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Decision reason</span>
                    <textarea
                      defaultValue={item.review?.decisionReason ?? ""}
                      name="decisionReason"
                      placeholder="Internal maintainer rationale for the review decision."
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Reviewer note</span>
                    <textarea
                      defaultValue={item.review?.reviewerNote ?? ""}
                      name="reviewerNote"
                      placeholder="Optional maintainer note for follow-up or room placement."
                    />
                  </label>

                  <button className={styles.submitButton} type="submit">
                    Save review state
                  </button>
                </form>
              </article>
            )}) : (
              <div className={styles.emptyState}>
                <span className={styles.eyebrow}>No matching records</span>
                <h2>No contributions match this review scope yet.</h2>
                <p>
                  Clear the filters or send a test contribution through the healthcare
                  card to verify the submission, AI sorting, and human review path.
                </p>
              </div>
            )}
          </div>

          {suggestedAttachmentTargets ? (
            <datalist id={assignmentDatalistId}>
              {Object.entries(suggestedAttachmentTargets).flatMap(([kind, items]) =>
                items.map((item) => (
                  <option
                    key={`${kind}-${item.value}`}
                    value={item.value}
                  >{`${kind} — ${item.label}`}</option>
                )),
              )}
            </datalist>
          ) : null}
        </section>
      </div>
    </div>
  );
}
