import { cookies } from "next/headers";
import Link from "next/link";
import TopicContributionLoop from "./topic-contribution-loop";
import TopicAiPanel from "./topic-ai-panel";
import { SiteBrand } from "./site-brand";
import type { IssueRoomSlug, TopicCardData } from "../lib/civic-logos";
import {
  getHomeIntakeCookieName,
  parseHomeIntakeCookie,
} from "../lib/home-intake-cookie";
import {
  getHomeIntakeDraftTopicsHref,
  getHomeIntakeRoomCandidatesHref,
  HOME_INTAKE_TOPIC_CARD_PRESSURE_SECTION_ID,
} from "../lib/home-intake-artifact-links";
import { getHomeIntakeHeldQuestions } from "../lib/home-intake-held-questions";
import { getHomeIntakeClosestMapPath } from "../lib/home-intake-map-path";
import {
  formatPromptDate,
  getLatestAttachedPrompt,
  getPromptEvolution,
  getPromptHistoryHref,
} from "../lib/home-intake-prompt-history";
import { getHomeIntakeEntry } from "../lib/home-intake-store";
import type { HomeIntakeRecord } from "../lib/home-intake-types";
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
import { getRoomTopicHref } from "../lib/civic-logos";
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

type ContributionSummaryReference = {
  label: string;
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

type ContributionSliceDefinition = {
  label: string;
  recordView?: ContributionRecordView;
  attachment?: ContributionAttachmentFilter;
  reviewStatus?: ContributionStatusFilter;
  origin?: ContributionOriginFilter;
  lane?: DebateLane;
};

type ScoreTransparencySlice = ContributionSliceDefinition & {
  count: number;
  href: string;
};

type ContributionScoreReference = {
  scoreLabel: string;
  scoreSliceLabel: string;
};

type ScorePressureContext = {
  latestVisibleContribution: PublicContribution | null;
  latestVisibleSliceLabel: null | string;
  latestUnresolvedContribution: PublicContribution | null;
  latestUnresolvedSliceLabel: null | string;
};

type TopicCardIntakeContext = {
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

type TopicCardPageProps = {
  roomSlug: IssueRoomSlug;
  card: TopicCardData;
  brandSubtitle: string;
  roomHref: string;
  roomLabel: string;
  roomCards: readonly TopicCardLink[];
  currentTopicIndex: number;
  searchParams?: Record<string, string | string[] | undefined>;
};

function getHomeIntakeRecordFromCookie(
  cookieEntry: ReturnType<typeof parseHomeIntakeCookie>,
): HomeIntakeRecord | null {
  if (!cookieEntry) {
    return null;
  }

  return {
    id: cookieEntry.id,
    prompt: cookieEntry.prompt,
    createdAt: "",
    updatedAt: "",
    promptCount:
      cookieEntry.promptCount ?? cookieEntry.relatedPrompts?.length ?? 1,
    relatedPrompts: cookieEntry.relatedPrompts,
    routing: cookieEntry.routing,
  };
}

function getPublicContributionOutcomeNote(
  decisionReason?: string,
  publicRecordNote?: string,
  fallback = "This contribution was marked as changing the card.",
) {
  return publicRecordNote ?? decisionReason ?? fallback;
}

function getScorePressureInterpretation(contribution: PublicContribution) {
  if (contribution.review?.reviewedAt) {
    return {
      label: "Human review read",
      note: getPublicContributionOutcomeNote(
        contribution.review.decisionReason,
        contribution.review.publicRecordNote,
        "Human review resolved this contribution without a public note yet.",
      ),
    };
  }

  if (contribution.aiIntake?.reviewerNote || contribution.aiIntake?.summary) {
    return {
      label: "AI sorting read",
      note:
        contribution.aiIntake.reviewerNote ??
        contribution.aiIntake.summary ??
        "This contribution still needs a human review decision.",
    };
  }

  return null;
}

function getContributionLedgerHref({
  recordView,
  attachment,
  reviewStatus,
  origin,
  lane,
  contributionId,
  sourceSummary,
  sourceScoreLabel,
  sourceScoreSliceLabel,
  sourceIntakeId,
}: {
  recordView?: ContributionRecordView;
  attachment?: ContributionAttachmentFilter;
  reviewStatus?: ContributionStatusFilter;
  origin?: ContributionOriginFilter;
  lane?: DebateLane;
  contributionId?: string;
  sourceSummary?: string;
  sourceScoreLabel?: string;
  sourceScoreSliceLabel?: string;
  sourceIntakeId?: string;
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

  if (sourceSummary) {
    params.set("sourceSummary", sourceSummary);
  }

  if (sourceScoreLabel) {
    params.set("scoreLabel", sourceScoreLabel);
  }

  if (sourceScoreSliceLabel) {
    params.set("scoreSlice", sourceScoreSliceLabel);
  }

  if (sourceIntakeId) {
    params.set("intake", sourceIntakeId);
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

function getTopicChatMessageHref(
  messageId: string,
  contribution?: PublicContribution,
  sourceSummary?: string,
  sourceScoreLabel?: string,
  sourceScoreSliceLabel?: string,
  sourceIntakeId?: string,
) {
  const params = new URLSearchParams({
    chatMessage: messageId,
  });

  if (contribution) {
    params.set("sourceContribution", contribution.id);
    params.set("sourceContributionTitle", contribution.title);
    params.set("sourceOrigin", getContributionOrigin(contribution));
    params.set("sourceReviewStatus", getContributionStatusFilter(contribution.status));
    params.set("sourceAttachment", getContributionAttachmentFilter(contribution));
    params.set(
      "sourceAttachmentSummary",
      getContributionAttachmentSummary(contribution),
    );
    params.set("sourceLane", contribution.lane);

    const recordView = getContributionRecordView(contribution);

    if (recordView) {
      params.set("sourceRecordView", recordView);
    }
  }

  if (sourceSummary) {
    params.set("sourceSummary", sourceSummary);
  }

  if (sourceScoreLabel) {
    params.set("sourceScoreLabel", sourceScoreLabel);
  }

  if (sourceScoreSliceLabel) {
    params.set("sourceScoreSlice", sourceScoreSliceLabel);
  }

  if (sourceIntakeId) {
    params.set("intake", sourceIntakeId);
  }

  return `?${params.toString()}#topic-chat-message-${messageId}`;
}

function getSingleSearchParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getExactContributionLedgerHref(
  contribution: PublicContribution,
  sourceSummary?: string,
  sourceScoreLabel?: string,
  sourceScoreSliceLabel?: string,
  sourceIntakeId?: string,
) {
  return getContributionLedgerHref({
    recordView: getContributionRecordView(contribution),
    attachment: getContributionAttachmentFilter(contribution),
    reviewStatus: getContributionStatusFilter(contribution.status),
    origin: getContributionOrigin(contribution),
    lane: contribution.lane,
    contributionId: contribution.id,
    sourceSummary,
    sourceScoreLabel,
    sourceScoreSliceLabel,
    sourceIntakeId,
  });
}

function getContributionSummaryHref(
  contributionId: string,
  label: string,
  hash: string,
) {
  const params = new URLSearchParams();
  params.set("summaryRecord", contributionId);
  params.set("summaryLabel", label);

  return `?${params.toString()}${hash}`;
}

function getIntakeContextPrimaryActionLabel(
  routeKind: TopicCardIntakeContext["routeKind"],
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

function getScoreAnchorId(label: string) {
  return `score-${label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}

function getScoreAwareSummaryHref(
  href: string,
  sourceScoreLabel?: string,
  sourceScoreSliceLabel?: string,
  intakeId?: string,
) {
  if (!sourceScoreLabel && !sourceScoreSliceLabel && !intakeId) {
    return href;
  }

  const [pathAndQuery, hashFragment] = href.split("#");
  const [path, query = ""] = pathAndQuery.split("?");
  const nextSearchParams = new URLSearchParams(query);

  if (sourceScoreLabel) {
    nextSearchParams.set("scoreLabel", sourceScoreLabel);
  }

  if (sourceScoreSliceLabel) {
    nextSearchParams.set("scoreSlice", sourceScoreSliceLabel);
  }

  if (intakeId) {
    nextSearchParams.set("intake", intakeId);
  }

  const nextQuery = nextSearchParams.toString();
  const nextHash = hashFragment ? `#${hashFragment}` : "";

  return `${path}${nextQuery ? `?${nextQuery}` : ""}${nextHash}`;
}

function matchesContributionSlice(
  contribution: PublicContribution,
  slice: Omit<ContributionSliceDefinition, "label">,
) {
  if (
    slice.recordView &&
    getContributionRecordView(contribution) !== slice.recordView
  ) {
    return false;
  }

  if (
    slice.attachment &&
    getContributionAttachmentFilter(contribution) !== slice.attachment
  ) {
    return false;
  }

  if (
    slice.reviewStatus &&
    getContributionStatusFilter(contribution.status) !== slice.reviewStatus
  ) {
    return false;
  }

  if (slice.origin && getContributionOrigin(contribution) !== slice.origin) {
    return false;
  }

  if (slice.lane && contribution.lane !== slice.lane) {
    return false;
  }

  return true;
}

function getContributionActivityTimestamp(contribution: PublicContribution) {
  const updatedTime = Date.parse(contribution.updatedAt);

  if (!Number.isNaN(updatedTime) && updatedTime > 0) {
    return updatedTime;
  }

  const createdTime = Date.parse(contribution.createdAt);
  return Number.isNaN(createdTime) ? 0 : createdTime;
}

function getScoreTransparencySliceDefinitions(
  scoreLabel: string,
): ContributionSliceDefinition[] {
  switch (scoreLabel) {
    case "Novelty":
      return [
        { label: "Changed-card record", recordView: "changed-card" },
        { label: "AI-origin record", origin: "ai-origin" },
      ];
    case "Coherence":
      return [
        { label: "Changed-card record", recordView: "changed-card" },
        { label: "Open-question pressure", attachment: "open-question" },
      ];
    case "Feasibility":
      return [
        { label: "Assumption pressure", attachment: "assumption" },
        { label: "Needs-review record", recordView: "needs-review" },
      ];
    case "Evidence quality":
      return [
        { label: "Evidence record", attachment: "evidence" },
        { label: "Document-backed record", recordView: "document-backed" },
      ];
    case "Economic delta clarity":
      return [
        {
          label: "Economic-challenge lane",
          lane: "economic-assumption-challenge",
        },
        { label: "Open-question pressure", attachment: "open-question" },
      ];
    case "Public value":
      return [
        { label: "Public submissions", origin: "human-submitted" },
        { label: "Changed-card record", recordView: "changed-card" },
      ];
    default:
      return [];
  }
}

function getScoreTransparencySlices(
  scoreLabel: string,
  liveContributions: readonly PublicContribution[],
): ScoreTransparencySlice[] {
  return getScoreTransparencySliceDefinitions(scoreLabel).map((slice) => ({
    ...slice,
    count: liveContributions.filter((contribution) =>
      matchesContributionSlice(contribution, slice),
    ).length,
    href: getContributionLedgerHref({
      recordView: slice.recordView,
      attachment: slice.attachment,
      reviewStatus: slice.reviewStatus,
      origin: slice.origin,
      lane: slice.lane,
    }),
  }));
}

function getLatestScoreTransparencyContribution(
  slices: readonly ScoreTransparencySlice[],
  liveContributions: readonly PublicContribution[],
  matches: (contribution: PublicContribution) => boolean = () => true,
) {
  let bestMatch:
    | {
        slice: ScoreTransparencySlice;
        contribution: PublicContribution;
      }
    | null = null;

  for (const slice of slices) {
    const candidate = liveContributions
      .filter(
        (contribution) =>
          matchesContributionSlice(contribution, slice) && matches(contribution),
      )
      .sort(
        (left, right) =>
          getContributionActivityTimestamp(right) -
          getContributionActivityTimestamp(left),
      )[0];

    if (!candidate) {
      continue;
    }

    if (
      !bestMatch ||
      getContributionActivityTimestamp(candidate) >
        getContributionActivityTimestamp(bestMatch.contribution)
    ) {
      bestMatch = {
        slice,
        contribution: candidate,
      };
    }
  }

  return bestMatch;
}

function getSummaryFocusLedgerHref(
  searchParams?: Record<string, string | string[] | undefined>,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (key === "summaryRecord" || key === "summaryLabel") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) {
          params.append(key, item);
        }
      }
      continue;
    }

    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return `${query ? `?${query}` : ""}#contribution-record`;
}

function getScoreFocusHref(
  searchParams?: Record<string, string | string[] | undefined>,
) {
  const scoreLabel = getSingleSearchParamValue(searchParams?.scoreLabel)?.trim();

  if (!scoreLabel) {
    return "";
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (key === "summaryRecord" || key === "summaryLabel") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) {
          params.append(key, item);
        }
      }
      continue;
    }

    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return `${query ? `?${query}` : ""}#${getScoreAnchorId(scoreLabel)}`;
}

function getScoreItemHref(
  scoreLabel: string,
  scoreSliceLabel?: string,
  searchParams?: Record<string, string | string[] | undefined>,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (key === "scoreLabel" || key === "scoreSlice") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) {
          params.append(key, item);
        }
      }
      continue;
    }

    if (value) {
      params.set(key, value);
    }
  }

  params.set("scoreLabel", scoreLabel);

  if (scoreSliceLabel) {
    params.set("scoreSlice", scoreSliceLabel);
  }

  const query = params.toString();
  return `${query ? `?${query}` : ""}#${getScoreAnchorId(scoreLabel)}`;
}

function ContributionRecordContext({
  contribution,
  recordView,
  targetLabel = "Public record target",
  showReviewStatus = false,
}: {
  contribution: PublicContribution;
  recordView?: ContributionRecordView;
  targetLabel?: string;
  showReviewStatus?: boolean;
}) {
  return (
    <p className={styles.metaParagraph}>
      Debate lane:{" "}
      <Link
        className={styles.sourceLink}
        href={getContributionLedgerHref({
          recordView,
          reviewStatus: getContributionStatusFilter(contribution.status),
          lane: contribution.lane,
        })}
      >
        {debateLaneLabels[contribution.lane]}
      </Link>
      {showReviewStatus ? (
        <>
          . Review status:{" "}
          <Link
            className={styles.sourceLink}
            href={getContributionLedgerHref({
              recordView,
              reviewStatus: getContributionStatusFilter(contribution.status),
            })}
          >
            {contribution.status}
          </Link>
        </>
      ) : null}
      . Origin:{" "}
      <Link
        className={styles.sourceLink}
        href={getContributionLedgerHref({
          recordView,
          reviewStatus: getContributionStatusFilter(contribution.status),
          origin: getContributionOrigin(contribution),
        })}
      >
        {getContributionOriginLabel(getContributionOrigin(contribution))}
      </Link>
      . {targetLabel}:{" "}
      <Link
        className={styles.sourceLink}
        href={getContributionLedgerHref({
          recordView,
          reviewStatus: getContributionStatusFilter(contribution.status),
          attachment: getContributionAttachmentFilter(contribution),
        })}
      >
        {getContributionAttachmentSummary(contribution)}
      </Link>
      .
    </p>
  );
}

function ContributionAiOriginContext({
  contribution,
  sourceSummaryLabel,
  sourceScoreLabel,
  sourceScoreSliceLabel,
  sourceIntakeId,
}: {
  contribution: PublicContribution;
  sourceSummaryLabel?: string;
  sourceScoreLabel?: string;
  sourceScoreSliceLabel?: string;
  sourceIntakeId?: string;
}) {
  if (!contribution.draftSource) {
    return null;
  }

  return (
    <p className={styles.metaParagraph}>
      AI origin: {contribution.draftSource.providerLabel}
      {contribution.draftSource.model ? ` (${contribution.draftSource.model})` : ""} on{" "}
      {formatTimestamp(contribution.draftSource.generatedAt)}.
      {contribution.draftSource.messageId ? (
        <>
          {" "}
          <Link
            className={styles.sourceLink}
            href={getTopicChatMessageHref(
              contribution.draftSource.messageId,
              contribution,
              sourceSummaryLabel,
              sourceScoreLabel,
              sourceScoreSliceLabel,
              sourceIntakeId,
            )}
          >
            Open source AI turn
          </Link>
        </>
      ) : null}
    </p>
  );
}

function addContributionSummaryReference(
  map: Map<string, ContributionSummaryReference[]>,
  contribution: PublicContribution | null | undefined,
  label: string,
  href: string,
) {
  if (!contribution) {
    return;
  }

  const existing = map.get(contribution.id) ?? [];
  const exactHref = getContributionSummaryHref(contribution.id, label, href);

  if (!existing.some((item) => item.label === label && item.href === exactHref)) {
    existing.push({ label, href: exactHref });
    map.set(contribution.id, existing);
  }
}

function addContributionScoreReference(
  map: Map<string, ContributionScoreReference[]>,
  contribution: PublicContribution | null | undefined,
  scoreLabel: string,
  scoreSliceLabel: string,
) {
  if (!contribution) {
    return;
  }

  const existing = map.get(contribution.id) ?? [];

  if (
    !existing.some(
      (item) =>
        item.scoreLabel === scoreLabel && item.scoreSliceLabel === scoreSliceLabel,
    )
  ) {
    existing.push({ scoreLabel, scoreSliceLabel });
    map.set(contribution.id, existing);
  }
}

function SummaryFocusNotice({
  activeSummaryLabel,
  activeSummaryRecordId,
  activeIntakeId,
  activeScoreLabel,
  activeScoreSliceLabel,
  activeScoreLatestVisibleContribution,
  activeScoreLatestUnresolvedContribution,
  contribution,
  intakeContext,
  ledgerHref,
  scoreReturnHref,
  scoreReferences,
  searchParams,
  summaryReferences,
  summaryLabel,
}: {
  activeSummaryLabel?: string;
  activeSummaryRecordId?: string;
  activeIntakeId?: string;
  activeScoreLabel?: string;
  activeScoreSliceLabel?: string;
  activeScoreLatestVisibleContribution?: {
    contribution: PublicContribution;
    slice: ScoreTransparencySlice;
  } | null;
  activeScoreLatestUnresolvedContribution?: {
    contribution: PublicContribution;
    slice: ScoreTransparencySlice;
  } | null;
  contribution: null | PublicContribution;
  intakeContext?: TopicCardIntakeContext | null;
  ledgerHref: string;
  scoreReturnHref?: string;
  scoreReferences: ContributionScoreReference[];
  searchParams?: Record<string, string | string[] | undefined>;
  summaryReferences: ContributionSummaryReference[];
  summaryLabel: string;
}) {
  if (activeSummaryLabel !== summaryLabel) {
    return null;
  }

  if (!contribution) {
    if (!activeSummaryRecordId) {
      return null;
    }

    return (
      <div className={`${styles.summaryFocusNotice} ${styles.summaryFocusMissing}`}>
        <span className={styles.panelLabel}>Focused record unavailable</span>
        <p>
          This summary was opened from an exact public-record link, but that
          contribution is not in the current visible topic ledger right now.
          The summary is still shown below.
        </p>
        {activeScoreLabel ? (
          <div className={styles.summaryReferenceBlock}>
            <span className={styles.metaParagraph}>Score context</span>
            <div className={styles.summaryReferenceList}>
              {scoreReturnHref ? (
                <Link className={styles.summaryReferenceLink} href={scoreReturnHref}>
                  Return to {activeScoreLabel}
                </Link>
              ) : null}
              {activeScoreSliceLabel ? (
                <Link className={styles.summaryReferenceLink} href={ledgerHref}>
                  Return to {activeScoreSliceLabel}
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
        {intakeContext ? (
          <div className={styles.summaryReferenceBlock}>
            <span className={styles.metaParagraph}>Held intake pressure</span>
            <p className={styles.metaParagraph}>
              This summary is still being read under pressure from{" "}
              <strong>{intakeContext.artifactTitle}</strong>, which is currently
              holding {intakeContext.promptCount} prompt
              {intakeContext.promptCount === 1 ? "" : "s"} and{" "}
              {intakeContext.heldQuestionCount} question
              {intakeContext.heldQuestionCount === 1 ? "" : "s"} in the intake layer.
            </p>
            <div className={styles.summaryReferenceList}>
              <Link
                className={styles.summaryReferenceLink}
                href={intakeContext.pressureNoticeHref}
              >
                Return to intake pressure notice
              </Link>
              <Link
                className={styles.summaryReferenceLink}
                href={intakeContext.exactArtifactHref}
              >
                {getIntakeContextPrimaryActionLabel(intakeContext.routeKind)}
              </Link>
              <Link
                className={styles.summaryReferenceLink}
                href={intakeContext.intakeArtifactHref}
              >
                Return to intake artifact
              </Link>
              <Link
                className={styles.summaryReferenceLink}
                href={intakeContext.routingHref}
              >
                Open routing AIs
              </Link>
            </div>
          </div>
        ) : null}
        <div className={styles.roomActions}>
          <Link className={styles.roomActionSecondary} href={ledgerHref}>
            Open contribution ledger
          </Link>
        </div>
      </div>
    );
  }

  const alternateSummaryReferences = summaryReferences.filter(
    (reference) => reference.label !== summaryLabel,
  );
  const alternateScoreReferences = scoreReferences.filter(
    (reference) =>
      !(
        activeScoreLabel === reference.scoreLabel &&
        activeScoreSliceLabel === reference.scoreSliceLabel
      ),
  );
  const scorePressureInterpretation =
    activeScoreLabel && contribution
      ? getScorePressureInterpretation(contribution)
      : null;
  const unresolvedContributionMatchesFocusedRecord =
    Boolean(
      activeScoreLatestUnresolvedContribution &&
        activeScoreLatestUnresolvedContribution.contribution.id === contribution.id,
    );
  const unresolvedContributionMatchesLatestVisible =
    Boolean(
      activeScoreLatestUnresolvedContribution &&
        activeScoreLatestVisibleContribution &&
        activeScoreLatestUnresolvedContribution.contribution.id ===
          activeScoreLatestVisibleContribution.contribution.id,
    );

  return (
    <div className={styles.summaryFocusNotice}>
      <span className={styles.panelLabel}>Focused by exact record</span>
      <p>
        This summary was opened from the public-record entry{" "}
        <strong>
          <Link
            className={styles.sourceLink}
            href={getExactContributionLedgerHref(
              contribution,
              summaryLabel,
              activeScoreLabel,
              activeScoreSliceLabel,
              activeIntakeId,
            )}
          >
            {contribution.title}
          </Link>
        </strong>
        .
      </p>
      <ContributionRecordContext
        contribution={contribution}
        recordView={getContributionRecordView(contribution)}
        showReviewStatus
      />
      <ContributionAiOriginContext
        contribution={contribution}
        sourceSummaryLabel={summaryLabel}
        sourceScoreLabel={activeScoreLabel}
        sourceScoreSliceLabel={activeScoreSliceLabel}
        sourceIntakeId={activeIntakeId}
      />
      {scorePressureInterpretation ? (
        <div className={styles.summaryReferenceBlock}>
          <span className={styles.metaParagraph}>
            {scorePressureInterpretation.label}
          </span>
          <p className={styles.metaParagraph}>{scorePressureInterpretation.note}</p>
        </div>
      ) : null}
      {intakeContext ? (
        <div className={styles.summaryReferenceBlock}>
          <span className={styles.metaParagraph}>Held intake pressure</span>
          <p className={styles.metaParagraph}>
            This summary is still being read under pressure from{" "}
            <strong>{intakeContext.artifactTitle}</strong>, which is currently
            holding {intakeContext.promptCount} prompt
            {intakeContext.promptCount === 1 ? "" : "s"} and{" "}
            {intakeContext.heldQuestionCount} question
            {intakeContext.heldQuestionCount === 1 ? "" : "s"} in the intake layer.
          </p>
          <div className={styles.summaryReferenceList}>
            <Link
              className={styles.summaryReferenceLink}
              href={intakeContext.pressureNoticeHref}
            >
              Return to intake pressure notice
            </Link>
            <Link
              className={styles.summaryReferenceLink}
              href={intakeContext.exactArtifactHref}
            >
              {getIntakeContextPrimaryActionLabel(intakeContext.routeKind)}
            </Link>
            <Link
              className={styles.summaryReferenceLink}
              href={intakeContext.intakeArtifactHref}
            >
              Return to intake artifact
            </Link>
            <Link
              className={styles.summaryReferenceLink}
              href={intakeContext.routingHref}
            >
              Open routing AIs
            </Link>
          </div>
        </div>
      ) : null}
      {activeScoreLabel ? (
        <div className={styles.summaryReferenceBlock}>
          <span className={styles.metaParagraph}>Score context</span>
          <p className={styles.metaParagraph}>
            Returned from scorecard: <strong>{activeScoreLabel}</strong>
            {activeScoreSliceLabel ? ` · ${activeScoreSliceLabel}` : ""}.
          </p>
          <div className={styles.summaryReferenceList}>
            {scoreReturnHref ? (
              <Link className={styles.summaryReferenceLink} href={scoreReturnHref}>
                Return to {activeScoreLabel}
              </Link>
            ) : null}
            {activeScoreSliceLabel ? (
              <Link className={styles.summaryReferenceLink} href={ledgerHref}>
                Return to {activeScoreSliceLabel}
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
      {activeScoreLabel ? (
        <div className={styles.summaryReferenceBlock}>
          <span className={styles.metaParagraph}>Open review pressure on this score</span>
          {activeScoreLatestUnresolvedContribution ? (
            unresolvedContributionMatchesFocusedRecord ? (
              <p className={styles.metaParagraph}>
                This exact record is still unresolved and could still move{" "}
                <strong>{activeScoreLabel}</strong> after human review.
              </p>
            ) : unresolvedContributionMatchesLatestVisible ? (
              <p className={styles.metaParagraph}>
                The freshest visible record on <strong>{activeScoreLabel}</strong>{" "}
                is still unresolved and could still move the score after human review.
              </p>
            ) : (
              <p className={styles.metaParagraph}>
                The newest unresolved public pressure that could still move{" "}
                <strong>{activeScoreLabel}</strong> is{" "}
                <Link
                  className={styles.sourceLink}
                  href={getExactContributionLedgerHref(
                    activeScoreLatestUnresolvedContribution.contribution,
                    summaryLabel,
                    activeScoreLabel,
                    activeScoreLatestUnresolvedContribution.slice.label,
                    activeIntakeId,
                  )}
                >
                  {activeScoreLatestUnresolvedContribution.contribution.title}
                </Link>
                {" "}through{" "}
                <strong>{activeScoreLatestUnresolvedContribution.slice.label}</strong>.
              </p>
            )
          ) : (
            <p className={styles.metaParagraph}>
              No unresolved public pressure is currently linked to{" "}
              <strong>{activeScoreLabel}</strong>.
            </p>
          )}
        </div>
      ) : null}
      <div className={styles.summaryReferenceBlock}>
        <span className={styles.metaParagraph}>Public record</span>
        <div className={styles.summaryReferenceList}>
          <Link
            className={styles.summaryReferenceLink}
            href={getExactContributionLedgerHref(
              contribution,
              summaryLabel,
              activeScoreLabel,
              activeScoreSliceLabel,
              activeIntakeId,
            )}
          >
            Open exact ledger entry
          </Link>
        </div>
      </div>
      {alternateSummaryReferences.length ? (
        <div className={styles.summaryReferenceBlock}>
          <span className={styles.metaParagraph}>Also surfaced in</span>
          <div className={styles.summaryReferenceList}>
            {alternateSummaryReferences.map((reference) => (
              <Link
                className={styles.summaryReferenceLink}
                href={getScoreAwareSummaryHref(
                  reference.href,
                  activeScoreLabel,
                  activeScoreSliceLabel,
                  activeIntakeId,
                )}
                key={`${reference.href}-${reference.label}`}
              >
                {reference.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      {alternateScoreReferences.length ? (
        <div className={styles.summaryReferenceBlock}>
          <span className={styles.metaParagraph}>
            {activeScoreLabel
              ? "Also used by scorecard"
              : "Scorecard items using this record"}
          </span>
          <div className={styles.summaryReferenceList}>
            {alternateScoreReferences.map((reference) => (
              <Link
                className={styles.summaryReferenceLink}
                href={getScoreItemHref(
                  reference.scoreLabel,
                  reference.scoreSliceLabel,
                  searchParams,
                )}
                key={`${reference.scoreLabel}-${reference.scoreSliceLabel}`}
              >
                {reference.scoreLabel} · {reference.scoreSliceLabel}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default async function TopicCardPage({
  roomSlug,
  card,
  brandSubtitle,
  roomHref,
  roomLabel,
  roomCards,
  currentTopicIndex,
  searchParams,
}: TopicCardPageProps) {
  const cookieStore = await cookies();
  const intakeId = getSingleSearchParamValue(searchParams?.intake)?.trim();
  const cookieIntakeEntry = parseHomeIntakeCookie(
    cookieStore.get(getHomeIntakeCookieName())?.value,
  );
  const cookieTopicIntakeEntry = getHomeIntakeRecordFromCookie(
    cookieIntakeEntry?.id === intakeId ? cookieIntakeEntry : null,
  );
  const topicChatSessionId =
    cookieStore.get(getTopicChatSessionCookieName())?.value?.trim() ?? "";
  const [liveContributions, contributionStoreMetadata, topicChatMessages, topicChatStoreMetadata, storedTopicIntakeEntry] = await Promise.all([
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
    intakeId && !cookieTopicIntakeEntry
      ? getHomeIntakeEntry(intakeId)
      : Promise.resolve(null),
  ]);
  const topicIntakeEntry = cookieTopicIntakeEntry ?? storedTopicIntakeEntry;
  const topicIntakeClosestMapPath = topicIntakeEntry
    ? getHomeIntakeClosestMapPath(topicIntakeEntry.routing)
    : null;
  const topicIntakeHeldQuestions = topicIntakeEntry
    ? getHomeIntakeHeldQuestions(topicIntakeEntry.routing, 2)
    : [];
  const topicIntakePromptCount = topicIntakeEntry
    ? topicIntakeEntry.promptCount ?? topicIntakeEntry.relatedPrompts?.length ?? 1
    : 0;
  const topicIntakeLatestPrompt = topicIntakeEntry
    ? getLatestAttachedPrompt(topicIntakeEntry)
    : null;
  const topicIntakeLatestPromptDate = topicIntakeLatestPrompt
    ? formatPromptDate(topicIntakeLatestPrompt.createdAt)
    : undefined;
  const topicIntakePromptEvolution = topicIntakeEntry
    ? getPromptEvolution(topicIntakeEntry)
    : null;
  const topicIntakePromptHistoryHref = topicIntakeEntry
    ? getPromptHistoryHref(topicIntakeEntry)
    : null;
  const topicIntakeMatchesCard = Boolean(
    topicIntakeEntry &&
      ((topicIntakeEntry.routing.roomSlug === roomSlug &&
        topicIntakeEntry.routing.topicId === card.id) ||
        (topicIntakeClosestMapPath?.roomSlug === roomSlug &&
          topicIntakeClosestMapPath.topicId === card.id)),
  );
  const activeIntakeContextId =
    topicIntakeMatchesCard && topicIntakeEntry ? topicIntakeEntry.id : undefined;
  const topicIntakeArtifactHref = topicIntakeEntry
    ? topicIntakeEntry.routing.routeKind === "room-topic-draft"
      ? getHomeIntakeDraftTopicsHref(roomHref, {
          entryId: topicIntakeEntry.id,
          intakeId: topicIntakeEntry.id,
        })
      : topicIntakeEntry.routing.routeKind === "new-room-draft"
        ? getHomeIntakeRoomCandidatesHref(topicIntakeEntry.id)
        : `${roomHref}?intake=${topicIntakeEntry.id}`
    : null;
  const topicContributionIntakeContext =
    topicIntakeMatchesCard && topicIntakeEntry && topicIntakeArtifactHref
      ? ({
          intakeId: topicIntakeEntry.id,
          routeKind: topicIntakeEntry.routing.routeKind ?? "existing-room",
          artifactTitle:
            topicIntakeEntry.routing.suggestedTopicTitle ??
            topicIntakeEntry.routing.suggestedCentralQuestion ??
            topicIntakeEntry.prompt,
          promptCount: topicIntakePromptCount,
          heldQuestionCount: topicIntakeHeldQuestions.length,
          pressureNoticeHref: `#${HOME_INTAKE_TOPIC_CARD_PRESSURE_SECTION_ID}`,
          exactArtifactHref: topicIntakeArtifactHref,
          intakeArtifactHref: `/intake/${topicIntakeEntry.id}`,
          routingHref: `/intake/${topicIntakeEntry.id}#routing-ais`,
          promptHistoryHref: topicIntakePromptHistoryHref,
          heldQuestions: topicIntakeHeldQuestions,
          latestPrompt: topicIntakeLatestPrompt
            ? {
                label:
                  topicIntakePromptCount > 1
                    ? "Latest attached prompt"
                    : "Current seed prompt",
                prompt: topicIntakeLatestPrompt.prompt,
                date: topicIntakeLatestPromptDate,
              }
            : null,
        } satisfies TopicCardIntakeContext)
      : null;
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
  const contributionSummaryReferences = (() => {
    const map = new Map<string, ContributionSummaryReference[]>();

    for (const item of incorporatedAssumptions.slice(0, 3)) {
      addContributionSummaryReference(map, item, "Assumption layer", "#assumption-layer");
      addContributionSummaryReference(map, item, "Review-driven record", "#review-driven-record");
    }

    for (const item of incorporatedEvidence.slice(0, 3)) {
      addContributionSummaryReference(map, item, "Evidence layer", "#evidence-layer");
    }

    for (const item of documentBackedContributions.slice(0, 4)) {
      addContributionSummaryReference(
        map,
        item,
        "Visible evidence record",
        "#document-evidence-record",
      );
    }

    addContributionSummaryReference(
      map,
      contributorObjectionThatChangedCard,
      "Objection layer",
      "#objection-layer",
    );
    addContributionSummaryReference(
      map,
      strongestLiveContributorObjection,
      "Objection layer",
      "#objection-layer",
    );

    for (const item of [...incorporatedEvidence, ...incorporatedQuestions].slice(0, 4)) {
      addContributionSummaryReference(map, item, "Review-driven record", "#review-driven-record");
    }

    for (const item of needsAttentionContributions.slice(0, 4)) {
      addContributionSummaryReference(map, item, "Open pressure", "#open-pressure");
    }

    for (const item of incorporatedQuestions.slice(0, 3)) {
      addContributionSummaryReference(
        map,
        item,
        "Open-question layer",
        "#open-question-layer",
      );
    }

    for (const item of lanePressure) {
      addContributionSummaryReference(
        map,
        item.latestUnresolved,
        "Pressure by lane",
        "#pressure-by-lane",
      );
    }

    for (const item of changedCardContributions.slice(0, 3)) {
      addContributionSummaryReference(
        map,
        item,
        "Manual cycle - Changed card",
        "#manual-cycle",
      );
    }

    for (const item of needsAttentionContributions.slice(0, 3)) {
      addContributionSummaryReference(
        map,
        item,
        "Manual cycle - Needs attention",
        "#manual-cycle",
      );
    }

    for (const item of assistedRecordContributions.slice(0, 4)) {
      addContributionSummaryReference(
        map,
        item,
        "AI-assisted record activity",
        "#ai-assisted-record-activity",
      );
    }

    for (const item of reviewedContributions.slice(0, 4)) {
      addContributionSummaryReference(
        map,
        item,
        "Recent human review decisions",
        "#recent-human-review-decisions",
      );
    }

    for (const item of changedCardContributions.slice(0, 4)) {
      addContributionSummaryReference(
        map,
        item,
        "Contribution-driven trace",
        "#contribution-driven-trace",
      );
    }

    return Object.fromEntries(map.entries());
  })();
  const contributionScoreReferences = (() => {
    const map = new Map<string, ContributionScoreReference[]>();

    for (const scoreItem of card.scorecard) {
      const relatedSlices = getScoreTransparencySlices(scoreItem.label, liveContributions);
      const latestScoreContribution = getLatestScoreTransparencyContribution(
        relatedSlices,
        liveContributions,
      );

      if (!latestScoreContribution) {
        continue;
      }

      addContributionScoreReference(
        map,
        latestScoreContribution.contribution,
        scoreItem.label,
        latestScoreContribution.slice.label,
      );
    }

    return Object.fromEntries(map.entries());
  })();
  const scorePressureContexts = Object.fromEntries(
    card.scorecard.map((scoreItem) => {
      const relatedSlices = getScoreTransparencySlices(
        scoreItem.label,
        liveContributions,
      );
      const latestVisibleContribution = getLatestScoreTransparencyContribution(
        relatedSlices,
        liveContributions,
      );
      const latestUnresolvedContribution = getLatestScoreTransparencyContribution(
        relatedSlices,
        liveContributions,
        (contribution) =>
          contribution.status === "pending" ||
          contribution.status === "needs review",
      );

      return [
        scoreItem.label,
        {
          latestVisibleContribution:
            latestVisibleContribution?.contribution ?? null,
          latestVisibleSliceLabel:
            latestVisibleContribution?.slice.label ?? null,
          latestUnresolvedContribution:
            latestUnresolvedContribution?.contribution ?? null,
          latestUnresolvedSliceLabel:
            latestUnresolvedContribution?.slice.label ?? null,
        } satisfies ScorePressureContext,
      ];
    }),
  );
  const previousCard =
    currentTopicIndex > 0 ? roomCards[currentTopicIndex - 1] : null;
  const nextCard =
    currentTopicIndex < roomCards.length - 1
      ? roomCards[currentTopicIndex + 1]
      : null;
  const siblingCards = roomCards.filter((item) => item.id !== card.id);
  const activeSummaryRecordId = getSingleSearchParamValue(searchParams?.summaryRecord)?.trim();
  const activeSummaryLabel = getSingleSearchParamValue(searchParams?.summaryLabel)?.trim();
  const activeScoreLabel = getSingleSearchParamValue(searchParams?.scoreLabel)?.trim();
  const activeScoreSliceLabel = getSingleSearchParamValue(searchParams?.scoreSlice)?.trim();
  const activeScoreRelatedSlices = activeScoreLabel
    ? getScoreTransparencySlices(activeScoreLabel, liveContributions)
    : [];
  const activeScoreLatestVisibleContribution = activeScoreLabel
    ? getLatestScoreTransparencyContribution(
        activeScoreRelatedSlices,
        liveContributions,
      )
    : null;
  const activeScoreLatestUnresolvedContribution = activeScoreLabel
    ? getLatestScoreTransparencyContribution(
        activeScoreRelatedSlices,
        liveContributions,
        (contribution) =>
          contribution.status === "pending" ||
          contribution.status === "needs review",
      )
    : null;
  const activeScoreItem = activeScoreLabel
    ? card.scorecard.find((item) => item.label === activeScoreLabel) ?? null
    : null;
  const activeScoreLatestVisibleInterpretation = activeScoreLatestVisibleContribution
    ? getScorePressureInterpretation(
        activeScoreLatestVisibleContribution.contribution,
      )
    : null;
  const activeHeldIntakeRelationship =
    topicIntakeMatchesCard && topicIntakeEntry
      ? topicIntakeEntry.routing.routeKind === "room-topic-draft"
        ? "Held as a durable draft topic because the live card path still needs clearer public uptake."
        : topicIntakeEntry.routing.routeKind === "new-room-draft"
          ? "Held as a room candidate because the active map still does not absorb it cleanly enough."
          : "Still being read through a current intake route into the live room map."
      : null;
  const institutionalPilotCtaVariant =
    card.id === "topic-001"
      ? roomSlug === "institutional-trust"
        ? "trust"
        : roomSlug === "healthcare"
          ? "healthcare"
          : null
      : null;
  const showInstitutionalPilotCta = Boolean(institutionalPilotCtaVariant);
  const institutionalPilotSourceTopicHref = (() => {
    const baseHref = getRoomTopicHref(roomSlug, card.id);
    const params = new URLSearchParams();

    if (activeIntakeContextId) {
      params.set("intake", activeIntakeContextId);
    }

    if (activeScoreLabel) {
      params.set("scoreLabel", activeScoreLabel);
    }

    if (activeScoreSliceLabel) {
      params.set("scoreSlice", activeScoreSliceLabel);
    }

    const query = params.toString();
    const hash = activeScoreLabel
      ? `#${getScoreAnchorId(activeScoreLabel)}`
      : activeIntakeContextId
        ? `#${HOME_INTAKE_TOPIC_CARD_PRESSURE_SECTION_ID}`
        : "";

    return `${baseHref}${query ? `?${query}` : ""}${hash}`;
  })();
  const institutionalPilotInquiryHref = (() => {
    const params = new URLSearchParams({
      interest: "Institutional pilot",
      sourceTopic: card.title,
      sourceRoom: roomLabel,
      sourceTopicHref: institutionalPilotSourceTopicHref,
      sourceLiveRecord: String(liveContributions.length),
      sourcePendingReview: String(
        contributionStatusCounts.pending + contributionStatusCounts.needsReview,
      ),
      sourceChangedCard: String(changedCardContributions.length),
      sourceAiOrigin: String(assistedRecordContributions.length),
      sourceDocumentBacked: String(documentBackedContributions.length),
      sourceRecordMode: contributionStoreMetadata.mode,
    });

    if (activeScoreItem) {
      params.set("sourceScoreLabel", activeScoreItem.label);
      params.set("sourceScoreValue", String(activeScoreItem.value));
    }

    if (activeScoreSliceLabel) {
      params.set("sourceScoreSlice", activeScoreSliceLabel);
    }

    if (activeScoreLabel) {
      params.set(
        "sourceScoreOpenPressure",
        activeScoreLatestUnresolvedContribution
          ? "Still unresolved public pressure"
          : "No unresolved public pressure currently linked",
      );
    }

    if (activeScoreLatestVisibleContribution) {
      params.set(
        "sourceExactRecordTitle",
        activeScoreLatestVisibleContribution.contribution.title,
      );
      params.set(
        "sourceExactRecordSlice",
        activeScoreLatestVisibleContribution.slice.label,
      );
      params.set(
        "sourceExactRecordTarget",
        getContributionAttachmentSummary(
          activeScoreLatestVisibleContribution.contribution,
        ),
      );
      params.set(
        "sourceExactRecordHref",
        `${getRoomTopicHref(roomSlug, card.id)}${getExactContributionLedgerHref(
          activeScoreLatestVisibleContribution.contribution,
          undefined,
          activeScoreItem?.label,
          activeScoreLatestVisibleContribution.slice.label,
          activeIntakeContextId,
        )}`,
      );

      if (activeScoreLatestVisibleInterpretation) {
        params.set(
          "sourceExactRecordRead",
          activeScoreLatestVisibleInterpretation.label,
        );
      }
    } else if (activeScoreLabel) {
      params.set(
        "sourceExactRecordState",
        "No visible public-record entry is currently linked to this focused score.",
      );
    }

    if (topicIntakeMatchesCard && topicContributionIntakeContext) {
      params.set(
        "sourceIntakeArtifactTitle",
        topicContributionIntakeContext.artifactTitle,
      );
      params.set(
        "sourceIntakePromptCount",
        String(topicContributionIntakeContext.promptCount),
      );
      params.set(
        "sourceIntakeHeldQuestionCount",
        String(topicContributionIntakeContext.heldQuestionCount),
      );
      params.set(
        "sourceIntakeRelationship",
        activeHeldIntakeRelationship ??
          "Still being read through held intake pressure.",
      );
      params.set(
        "sourceIntakeExactArtifactHref",
        topicContributionIntakeContext.exactArtifactHref,
      );
      params.set(
        "sourceIntakeArtifactHref",
        topicContributionIntakeContext.intakeArtifactHref,
      );
      params.set("sourceIntakeRoutingHref", topicContributionIntakeContext.routingHref);

      if (topicContributionIntakeContext.promptHistoryHref) {
        params.set(
          "sourceIntakePromptHistoryHref",
          topicContributionIntakeContext.promptHistoryHref,
        );
      }
    }

    return `/?${params.toString()}#contact`;
  })();
  const summaryFocusLedgerHref = getSummaryFocusLedgerHref(searchParams);
  const scoreFocusHref = getScoreFocusHref(searchParams);
  const summaryFocusedContribution =
    activeSummaryRecordId
      ? liveContributions.find((item) => item.id === activeSummaryRecordId) ?? null
      : null;
  const summaryFocusedReferences =
    activeSummaryRecordId ? contributionSummaryReferences[activeSummaryRecordId] ?? [] : [];
  const summaryFocusedScoreReferences =
    activeSummaryRecordId ? contributionScoreReferences[activeSummaryRecordId] ?? [] : [];
  const summaryFocusNoticeProps = {
    activeSummaryLabel,
    activeSummaryRecordId,
    activeIntakeId: activeIntakeContextId,
    activeScoreLabel,
    activeScoreSliceLabel,
    activeScoreLatestVisibleContribution,
    activeScoreLatestUnresolvedContribution,
    contribution: summaryFocusedContribution,
    intakeContext: topicContributionIntakeContext,
    ledgerHref: summaryFocusLedgerHref,
    scoreReturnHref: scoreFocusHref,
    scoreReferences: summaryFocusedScoreReferences,
    searchParams,
    summaryReferences: summaryFocusedReferences,
  };

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
        {topicIntakeMatchesCard && topicIntakeEntry ? (
          <section
            className={`${styles.panel} ${styles.intakePressurePanel}`}
            id={HOME_INTAKE_TOPIC_CARD_PRESSURE_SECTION_ID}
          >
            <span className={styles.eyebrow}>Intake pressure</span>
            <h2>
              {topicIntakeEntry.routing.routeKind === "room-topic-draft"
                ? "This live card is currently the closest current map path for a draft topic still being held separately in this room."
                : topicIntakeEntry.routing.routeKind === "new-room-draft"
                  ? "This live card is currently the closest current map path for a room candidate still being held outside the active map."
                  : "This live card was opened from a homepage intake route into the current room map."}
            </h2>
            <p>
              {topicIntakeClosestMapPath?.detail ??
                topicIntakeEntry.routing.fitSummary ??
                "The intake layer currently treats this live card as the strongest active-map path for the held issue."}
            </p>
            <div className={styles.scoreFocusNotice}>
              <p>
                <strong>Held artifact:</strong>{" "}
                {topicIntakeEntry.routing.suggestedTopicTitle ??
                  topicIntakeEntry.routing.suggestedCentralQuestion ??
                  topicIntakeEntry.prompt}
              </p>
              <p>
                <strong>Current relationship:</strong>{" "}
                {topicIntakeEntry.routing.routeKind === "room-topic-draft"
                  ? "Still held as a durable draft topic because the live card path remains under-modeled."
                  : topicIntakeEntry.routing.routeKind === "new-room-draft"
                    ? "Still held as a room candidate because the active room map does not absorb it cleanly enough yet."
                    : "Routed into the current room map through the homepage intake flow."}
              </p>
            </div>
            {topicIntakeHeldQuestions.length ? (
              <div className={styles.intakePressureDetail}>
                <div className={styles.intakePressureDetailMeta}>
                  <span>Questions held here</span>
                  <strong>Next inquiry</strong>
                </div>
                <ul className={styles.intakePressureQuestionList}>
                  {topicIntakeHeldQuestions.map((question) => (
                    <li
                      className={styles.intakePressureQuestionItem}
                      key={question.question}
                    >
                      <p>{question.question}</p>
                      <span>{question.provenanceLabel}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {topicIntakeLatestPrompt ? (
              <div className={styles.intakePressureDetail}>
                <div className={styles.intakePressureDetailMeta}>
                  <span>
                    {topicIntakePromptCount > 1
                      ? "Latest attached prompt"
                      : "Current seed prompt"}
                  </span>
                  {topicIntakeLatestPromptDate ? (
                    <strong>{topicIntakeLatestPromptDate}</strong>
                  ) : null}
                </div>
                <p>{topicIntakeLatestPrompt.prompt}</p>
              </div>
            ) : null}
            {topicIntakePromptEvolution ? (
              <div className={styles.intakePressureEvolution}>
                <div className={styles.intakePressureEvolutionItem}>
                  <span>Started with</span>
                  <p>{topicIntakePromptEvolution.earliest.prompt}</p>
                </div>
                <div className={styles.intakePressureEvolutionItem}>
                  <span>Latest pressure</span>
                  <p>{topicIntakePromptEvolution.latest.prompt}</p>
                </div>
              </div>
            ) : null}

            <div className={styles.roomActions}>
              {topicIntakeArtifactHref ? (
                <Link className={styles.roomActionPrimary} href={topicIntakeArtifactHref}>
                  {topicIntakeEntry.routing.routeKind === "room-topic-draft"
                    ? "Open exact draft topic"
                    : topicIntakeEntry.routing.routeKind === "new-room-draft"
                      ? "Open exact room candidate"
                      : "Return to room intake context"}
                </Link>
              ) : null}
              <Link
                className={styles.roomActionSecondary}
                href={`/intake/${topicIntakeEntry.id}`}
              >
                Return to intake artifact
              </Link>
              <Link
                className={styles.roomActionSecondary}
                href={`/intake/${topicIntakeEntry.id}#routing-ais`}
              >
                Open routing AIs
              </Link>
              {topicIntakePromptHistoryHref ? (
                <Link
                  className={styles.roomActionSecondary}
                  href={topicIntakePromptHistoryHref}
                >
                  Open prompt history
                </Link>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className={styles.gridSection}>
          <article className={styles.panel}>
            <span className={styles.eyebrow}>Current read</span>
            <h2>Why this topic card matters even before it is proven</h2>
            <p>{card.currentRead}</p>

            <div className={styles.copyBlock} id="assumption-layer">
              <h3>The problem it is trying to solve</h3>
              <SummaryFocusNotice {...summaryFocusNoticeProps} summaryLabel="Assumption layer" />
              <p>{card.problemStatement}</p>
            </div>

            <div className={styles.copyBlock} id="objection-layer">
              <h3>The proposed move</h3>
              <SummaryFocusNotice {...summaryFocusNoticeProps} summaryLabel="Objection layer" />
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
              {card.scorecard.map((item) => {
                const isScoreFocused = activeScoreLabel === item.label;
                const relatedSlices = getScoreTransparencySlices(
                  item.label,
                  liveContributions,
                );
                const latestScoreContribution =
                  getLatestScoreTransparencyContribution(
                    relatedSlices,
                    liveContributions,
                  );
                const latestUnresolvedScoreContribution =
                  getLatestScoreTransparencyContribution(
                    relatedSlices,
                    liveContributions,
                    (contribution) =>
                      contribution.status === "pending" ||
                      contribution.status === "needs review",
                  );
                const latestScoreReferences = latestScoreContribution
                  ? (contributionScoreReferences[
                      latestScoreContribution.contribution.id
                    ] ?? [])
                  : [];
                const latestScoreSummaryReferences = latestScoreContribution
                  ? (contributionSummaryReferences[
                      latestScoreContribution.contribution.id
                    ] ?? [])
                  : [];
                const latestScoreInterpretation = latestScoreContribution
                  ? getScorePressureInterpretation(
                      latestScoreContribution.contribution,
                    )
                  : null;
                const latestUnresolvedMatchesLatest =
                  latestUnresolvedScoreContribution?.contribution.id ===
                  latestScoreContribution?.contribution.id;

                return (
                  <div
                    className={
                      isScoreFocused
                        ? `${styles.scoreItem} ${styles.scoreItemFocused}`
                        : styles.scoreItem
                    }
                    id={getScoreAnchorId(item.label)}
                    key={item.label}
                  >
                    <div className={styles.scoreTop}>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                    <div className={styles.scoreTrack}>
                      <span style={{ width: `${item.value}%` }} />
                    </div>
                    <details className={styles.scoreDetails} open={isScoreFocused}>
                      <summary>How this was scored</summary>
                      {isScoreFocused ? (
                        <div className={styles.scoreFocusNotice}>
                          <span className={styles.scoreTransparencyLabel}>
                            Returned from public record
                          </span>
                          <p>
                            This score was reopened through the slice{" "}
                            <strong>
                              {activeScoreSliceLabel ?? "linked public record"}
                            </strong>
                            . Use the related record below to challenge or refine the
                            score, or return to that exact ledger view.
                          </p>
                          <div className={styles.scoreSliceList}>
                            <Link
                              className={styles.scoreSliceLink}
                              href={summaryFocusLedgerHref}
                            >
                              Return to{" "}
                              {activeScoreSliceLabel ?? "current ledger slice"}
                            </Link>
                          </div>
                        </div>
                      ) : null}
                      <p>
                        {item.basis ??
                          "Provisional founder estimate pending a public scoring rubric and challenge workflow."}
                      </p>
                      {relatedSlices.length ? (
                        <div className={styles.scoreTransparency}>
                          <span className={styles.scoreTransparencyLabel}>
                            Inspect related public record slices
                          </span>
                          <div className={styles.scoreSliceList}>
                            {relatedSlices.map((slice) => (
                              <Link
                                key={`${item.label}-${slice.label}`}
                                className={styles.scoreSliceLink}
                                href={getContributionLedgerHref({
                                  recordView: slice.recordView,
                                  attachment: slice.attachment,
                                  reviewStatus: slice.reviewStatus,
                                  origin: slice.origin,
                                  lane: slice.lane,
                                  sourceScoreLabel: item.label,
                                  sourceScoreSliceLabel: slice.label,
                                  sourceIntakeId: activeIntakeContextId,
                                })}
                              >
                                {slice.label} · {slice.count}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {latestScoreContribution ? (
                        <div className={styles.scoreLatestRecord}>
                          <span className={styles.scoreTransparencyLabel}>
                            Latest visible pressure
                          </span>
                          <p>
                            The freshest visible record touching this score is{" "}
                            <strong>
                              <Link
                                className={styles.sourceLink}
                                href={getExactContributionLedgerHref(
                                  latestScoreContribution.contribution,
                                  undefined,
                                  item.label,
                                  latestScoreContribution.slice.label,
                                  activeIntakeContextId,
                                )}
                              >
                                {latestScoreContribution.contribution.title}
                              </Link>
                            </strong>
                            {" "}through{" "}
                            <strong>{latestScoreContribution.slice.label}</strong>.
                          </p>
                          <ContributionRecordContext
                            contribution={latestScoreContribution.contribution}
                            recordView={getContributionRecordView(
                              latestScoreContribution.contribution,
                            )}
                            showReviewStatus
                          />
                          <ContributionAiOriginContext
                            contribution={latestScoreContribution.contribution}
                            sourceScoreLabel={item.label}
                            sourceScoreSliceLabel={
                              latestScoreContribution.slice.label
                            }
                            sourceIntakeId={activeIntakeContextId}
                          />
                          {latestScoreInterpretation ? (
                            <div className={styles.scoreTransparency}>
                              <span className={styles.scoreTransparencyLabel}>
                                {latestScoreInterpretation.label}
                              </span>
                              <p>{latestScoreInterpretation.note}</p>
                            </div>
                          ) : null}
                          {latestScoreContribution ? (
                            <div className={styles.scoreTransparency}>
                              <span className={styles.scoreTransparencyLabel}>
                                Open review pressure
                              </span>
                              {latestUnresolvedScoreContribution ? (
                                latestUnresolvedMatchesLatest ? (
                                  <p>
                                    The freshest visible record touching this score
                                    is still unresolved and could still move the
                                    score after human review.
                                  </p>
                                ) : (
                                  <>
                                    <p>
                                      The newest unresolved record that could still
                                      move this score is{" "}
                                      <strong>
                                        <Link
                                          className={styles.sourceLink}
                                          href={getExactContributionLedgerHref(
                                            latestUnresolvedScoreContribution.contribution,
                                            undefined,
                                            item.label,
                                            latestUnresolvedScoreContribution.slice.label,
                                            activeIntakeContextId,
                                          )}
                                        >
                                          {latestUnresolvedScoreContribution.contribution.title}
                                        </Link>
                                      </strong>
                                      {" "}through{" "}
                                      <strong>
                                        {latestUnresolvedScoreContribution.slice.label}
                                      </strong>
                                      .
                                    </p>
                                    <ContributionRecordContext
                                      contribution={latestUnresolvedScoreContribution.contribution}
                                      recordView={getContributionRecordView(
                                        latestUnresolvedScoreContribution.contribution,
                                      )}
                                      showReviewStatus
                                    />
                                    <ContributionAiOriginContext
                                      contribution={latestUnresolvedScoreContribution.contribution}
                                      sourceScoreLabel={item.label}
                                      sourceScoreSliceLabel={
                                        latestUnresolvedScoreContribution.slice.label
                                      }
                                      sourceIntakeId={activeIntakeContextId}
                                    />
                                  </>
                                )
                              ) : (
                                <p>
                                  No unresolved public pressure is currently linked
                                  to this score.
                                </p>
                              )}
                            </div>
                          ) : null}
                          {latestScoreReferences.length ? (
                            <div className={styles.scoreTransparency}>
                              <span className={styles.scoreTransparencyLabel}>
                                Scorecard use of this record
                              </span>
                              <p>
                                This exact record is currently participating in the
                                scorecard through the following score slices.
                              </p>
                              <div className={styles.scoreSliceList}>
                                {latestScoreReferences.map((reference) => (
                                  <Link
                                    className={styles.scoreSliceLink}
                                    href={getScoreItemHref(
                                      reference.scoreLabel,
                                      reference.scoreSliceLabel,
                                      searchParams,
                                    )}
                                    key={`${item.label}-${reference.scoreLabel}-${reference.scoreSliceLabel}`}
                                  >
                                    {reference.scoreLabel} · {reference.scoreSliceLabel}
                                    {reference.scoreLabel === item.label &&
                                    reference.scoreSliceLabel ===
                                      latestScoreContribution.slice.label
                                      ? " · current"
                                      : ""}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ) : null}
                          {latestScoreSummaryReferences.length ? (
                            <div className={styles.scoreTransparency}>
                              <span className={styles.scoreTransparencyLabel}>
                                Surfacing in this card
                              </span>
                              <p>
                                This same exact record is currently being used in
                                the following summary layers on the topic card.
                              </p>
                              <div className={styles.scoreSliceList}>
                                {latestScoreSummaryReferences.map((reference) => (
                                  <Link
                                    className={styles.scoreSliceLink}
                                    href={getScoreAwareSummaryHref(
                                      reference.href,
                                      item.label,
                                      latestScoreContribution.slice.label,
                                      activeIntakeContextId,
                                    )}
                                    key={`${item.label}-${latestScoreContribution.contribution.id}-${reference.label}`}
                                  >
                                    {reference.label}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </details>
                  </div>
                );
              })}
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

            <div className={styles.copyBlock} id="evidence-layer">
              <h3>Expected upside</h3>
              <SummaryFocusNotice {...summaryFocusNoticeProps} summaryLabel="Evidence layer" />
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

            <div className={styles.copyBlock} id="document-evidence-record">
              <h3>Stakeholders already in the blast radius</h3>
              <SummaryFocusNotice
                {...summaryFocusNoticeProps}
                summaryLabel="Visible evidence record"
              />
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
                      <ContributionRecordContext contribution={item} recordView="changed-card" />
                      <ContributionAiOriginContext
                        contribution={item}
                        sourceIntakeId={activeIntakeContextId}
                      />
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

        <section className={styles.gridSection} id="review-driven-record">
          <article className={styles.panel}>
            <span className={styles.eyebrow}>Stress test</span>
            <h2>Where the topic could fail or misfire</h2>
            <SummaryFocusNotice
              {...summaryFocusNoticeProps}
              summaryLabel="Review-driven record"
            />
            <ul className={styles.bulletList}>
              {card.risks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className={styles.copyBlock} id="open-question-layer">
              <h3>Anticipated objection</h3>
              <SummaryFocusNotice
                {...summaryFocusNoticeProps}
                summaryLabel="Open-question layer"
              />
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
                  <ContributionRecordContext
                    contribution={contributorObjectionThatChangedCard}
                    recordView="changed-card"
                  />
                  <ContributionAiOriginContext
                    contribution={contributorObjectionThatChangedCard}
                    sourceIntakeId={activeIntakeContextId}
                  />
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
                  <ContributionRecordContext
                    contribution={strongestLiveContributorObjection}
                    recordView={getContributionRecordView(strongestLiveContributorObjection)}
                    targetLabel="Current record target"
                  />
                  <ContributionAiOriginContext
                    contribution={strongestLiveContributorObjection}
                    sourceIntakeId={activeIntakeContextId}
                  />
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
                      <ContributionRecordContext contribution={item} recordView="changed-card" />
                      <ContributionAiOriginContext
                        contribution={item}
                        sourceIntakeId={activeIntakeContextId}
                      />
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
                          <ContributionRecordContext
                            contribution={item}
                            recordView="document-backed"
                          />
                          <ContributionAiOriginContext
                            contribution={item}
                            sourceIntakeId={activeIntakeContextId}
                          />
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

        <section className={styles.gridSection} id="open-pressure">
          <article className={styles.panel}>
            <span className={styles.eyebrow}>Review-driven record</span>
            <h2>Human review should change the visible object, not just the queue.</h2>
            <SummaryFocusNotice {...summaryFocusNoticeProps} summaryLabel="Open pressure" />
            <p>
              These are the reviewed outside contributions that have already been
              marked as changing the card&apos;s public reasoning record.
            </p>

            <div className={styles.copyBlock} id="pressure-by-lane">
              <h3>Assumptions now under live pressure</h3>
              <SummaryFocusNotice {...summaryFocusNoticeProps} summaryLabel="Pressure by lane" />
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
                      <ContributionRecordContext contribution={item} recordView="changed-card" />
                      <ContributionAiOriginContext
                        contribution={item}
                        sourceIntakeId={activeIntakeContextId}
                      />
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
                        <ContributionRecordContext contribution={item} recordView="changed-card" />
                        <ContributionAiOriginContext
                          contribution={item}
                          sourceIntakeId={activeIntakeContextId}
                        />
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
                    <ContributionRecordContext
                      contribution={item}
                      recordView="needs-review"
                      targetLabel="Current record target"
                    />
                    <ContributionAiOriginContext
                      contribution={item}
                      sourceIntakeId={activeIntakeContextId}
                    />
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
                      <ContributionRecordContext contribution={item} recordView="changed-card" />
                      <ContributionAiOriginContext
                        contribution={item}
                        sourceIntakeId={activeIntakeContextId}
                      />
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
            <h2>
              {institutionalPilotCtaVariant === "healthcare"
                ? "Use this healthcare card as a Public Review Stake style pilot object."
                : "Request an institutional review pilot."}
            </h2>
            <p>
              {institutionalPilotCtaVariant === "healthcare"
                ? "This live healthcare card already behaves like the kind of review object a pilot would need: visible contributions, pending review, AI-assisted sorting, uploaded evidence, and a revisable public record. A pilot here would fund reviewer time, evidence work, synthesis labor, and public memory without buying conclusions."
                : "Civic Logos can use a room like this to structure a hard public or institutional question into a living review object. Paying for the pilot funds review capacity, evidence work, synthesis labor, and public memory. It does not buy favorable conclusions."}
            </p>

            {institutionalPilotCtaVariant === "healthcare" ? (
              <div className={styles.scoreFocusNotice}>
                <span className={styles.scoreTransparencyLabel}>
                  Why this card is pilot-ready
                </span>
                <p>
                  The current live object shows{" "}
                  <strong>{liveContributions.length}</strong> visible record
                  entr{liveContributions.length === 1 ? "y" : "ies"},{" "}
                  <strong>
                    {contributionStatusCounts.pending +
                      contributionStatusCounts.needsReview}
                  </strong>{" "}
                  still waiting on human review,{" "}
                  <strong>{assistedRecordContributions.length}</strong> AI-origin
                  contribution
                  {assistedRecordContributions.length === 1 ? "" : "s"}, and{" "}
                  <strong>{documentBackedContributions.length}</strong>{" "}
                  document-backed contribution
                  {documentBackedContributions.length === 1 ? "" : "s"}.
                </p>
              </div>
            ) : null}

            <div className={styles.copyBlock}>
              <h3>
                {institutionalPilotCtaVariant === "healthcare"
                  ? "Public Review Stake firewall"
                  : "Revenue firewall"}
              </h3>
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
                href={institutionalPilotInquiryHref}
              >
                Request an institutional review pilot
              </Link>
              <Link
                className={styles.roomActionSecondary}
                href="/rooms/institutional-trust"
              >
                {institutionalPilotCtaVariant === "healthcare"
                  ? "Open Public Review Stake model"
                  : "Return to trust room"}
              </Link>
            </div>
          </section>
        ) : null}

        <section className={styles.gridSection} id="manual-cycle">
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
              {topicIntakeMatchesCard && topicIntakeEntry ? (
                <article className={styles.snapshotCard}>
                  <span className={styles.snapshotLabel}>Held intake pressure</span>
                  <strong>{topicIntakePromptCount}</strong>
                  <p>
                    {topicIntakeEntry.routing.routeKind === "room-topic-draft"
                      ? `${topicIntakePromptCount} prompt${topicIntakePromptCount === 1 ? "" : "s"} and ${topicIntakeHeldQuestions.length} held question${topicIntakeHeldQuestions.length === 1 ? "" : "s"} are still pressing on this card from a durable draft topic outside the live record.`
                      : topicIntakeEntry.routing.routeKind === "new-room-draft"
                        ? `${topicIntakePromptCount} prompt${topicIntakePromptCount === 1 ? "" : "s"} and ${topicIntakeHeldQuestions.length} held question${topicIntakeHeldQuestions.length === 1 ? "" : "s"} are still pressing on this card from a room candidate the active map has not absorbed yet.`
                        : "This live card is still being read through a current room-intake route."}
                  </p>
                  <Link
                    className={styles.roomActionSecondary}
                    href={`#${HOME_INTAKE_TOPIC_CARD_PRESSURE_SECTION_ID}`}
                  >
                    Open intake pressure notice
                  </Link>
                  {topicIntakePromptHistoryHref ? (
                    <Link
                      className={styles.roomActionSecondary}
                      href={topicIntakePromptHistoryHref}
                    >
                      Open prompt history
                    </Link>
                  ) : null}
                </article>
              ) : null}
            </div>

            <div className={styles.copyBlock} id="ai-assisted-record-activity">
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

            <div className={styles.copyBlock} id="recent-human-review-decisions">
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
                          <ContributionRecordContext
                            contribution={item.latestUnresolved}
                            recordView="needs-review"
                            targetLabel="Current record target"
                            showReviewStatus
                          />
                          <ContributionAiOriginContext
                            contribution={item.latestUnresolved}
                            sourceIntakeId={activeIntakeContextId}
                          />
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
                  <SummaryFocusNotice
                    {...summaryFocusNoticeProps}
                    summaryLabel="Manual cycle - Changed card"
                  />
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
                        <ContributionRecordContext contribution={item} recordView="changed-card" />
                        <ContributionAiOriginContext
                          contribution={item}
                          sourceIntakeId={activeIntakeContextId}
                        />
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
              <SummaryFocusNotice
                {...summaryFocusNoticeProps}
                summaryLabel="Manual cycle - Needs attention"
              />
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
                        <ContributionRecordContext
                          contribution={item}
                          recordView="needs-review"
                          targetLabel="Current record target"
                        />
                        <ContributionAiOriginContext
                          contribution={item}
                          sourceIntakeId={activeIntakeContextId}
                        />
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
              <SummaryFocusNotice
                {...summaryFocusNoticeProps}
                summaryLabel="AI-assisted record activity"
              />
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
                        <ContributionRecordContext
                          contribution={item}
                          recordView="ai-assisted"
                          showReviewStatus
                        />
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
                                href={getTopicChatMessageHref(
                                  item.draftSource.messageId,
                                  item,
                                  "AI-assisted record activity",
                                  undefined,
                                  undefined,
                                  activeIntakeContextId,
                                )}
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
              <SummaryFocusNotice
                {...summaryFocusNoticeProps}
                summaryLabel="Recent human review decisions"
              />
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
                      <ContributionRecordContext
                        contribution={item}
                        recordView={getContributionRecordView(item)}
                        showReviewStatus
                      />
                      <p className={styles.metaParagraph}>
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
                      <ContributionAiOriginContext
                        contribution={item}
                        sourceIntakeId={activeIntakeContextId}
                      />
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
          intakeContext={topicContributionIntakeContext}
          roomSlug={roomSlug}
          scorePressureContexts={scorePressureContexts}
          scoreReferences={contributionScoreReferences}
          topicId={card.id}
          topicTitle={card.title}
        />

        <TopicContributionLoop
          debatePrompts={card.debatePrompts}
          initialContributions={liveContributions}
          initialStoreMode={contributionStoreMetadata.mode}
          initialStoreNote={contributionStoreMetadata.note}
          intakeContext={topicContributionIntakeContext}
          openQuestions={card.openQuestions}
          roomSlug={roomSlug}
          scoreReferences={contributionScoreReferences}
          summaryReferences={contributionSummaryReferences}
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

          <div className={styles.copyBlock} id="contribution-driven-trace">
            <h3>Contribution-driven trace</h3>
            <SummaryFocusNotice
              {...summaryFocusNoticeProps}
              summaryLabel="Contribution-driven trace"
            />
            {changedCardContributions.length ? (
              <div className={styles.historyList}>
                {changedCardContributions.slice(0, 4).map((item) => (
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
                    <ContributionRecordContext contribution={item} recordView="changed-card" />
                    <ContributionAiOriginContext
                      contribution={item}
                      sourceIntakeId={activeIntakeContextId}
                    />
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
