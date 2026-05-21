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
  const scopedLane = isDebateLane(lane) ? lane : undefined;
  const [contributions, metadata] = await Promise.all([
    listAllContributions({
      roomSlug: scopedRoomSlug,
      topicId: scopedTopicId,
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
  const summary = {
    pending: sortedContributions.filter((item) => item.status === "pending").length,
    needsReview: sortedContributions.filter((item) => item.status === "needs review").length,
    accepted: sortedContributions.filter((item) => item.status === "accepted").length,
    incorporated: sortedContributions.filter((item) => item.status === "incorporated").length,
    rejected: sortedContributions.filter((item) => item.status === "rejected").length,
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
            {sortedContributions.map((item) => (
              <article className={styles.contribution} key={item.id}>
                <div className={styles.statusBar}>
                  <span className={styles.badge}>{item.status}</span>
                  <span className={styles.badge}>{debateLaneLabels[item.lane]}</span>
                  {item.isSeedExample ? <span className={styles.seed}>Seed example</span> : null}
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
                      {item.review.decisionReason ? <p>{item.review.decisionReason}</p> : null}
                      {item.review.reviewerNote ? <p>{item.review.reviewerNote}</p> : null}
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
                        defaultValue={item.review?.assignedToKind ?? ""}
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
                        defaultValue={item.review?.assignedToLabel ?? ""}
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

                  <label className={styles.field}>
                    <span>Decision reason</span>
                    <textarea
                      defaultValue={item.review?.decisionReason ?? ""}
                      name="decisionReason"
                      placeholder="Explain why this contribution was accepted, incorporated, held for review, or rejected."
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
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
