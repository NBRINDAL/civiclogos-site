"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { DebatePrompt, IssueRoomSlug } from "../lib/civic-logos";
import { topicCardVisibleContributionLimit } from "../lib/contribution-constants";
import type {
  AiProvider,
  ProviderContributionAiIntake,
  PublicContribution,
} from "../lib/contribution-types";
import {
  debateLaneLabels,
  getDebateLaneLabel,
  normalizeDebateLane,
  normalizeReviewTargetKind,
  type DebateLane,
  type ReviewTargetKind,
  type ReviewStatus,
} from "../lib/reasoning-types";
import {
  topicAiDraftEventName,
  type TopicAiDraftDetail,
} from "../lib/topic-ai-draft";
import styles from "./topic-contribution-loop.module.css";

type TopicContributionLoopProps = {
  roomSlug: IssueRoomSlug;
  topicId: string;
  topicTitle: string;
  debatePrompts: readonly DebatePrompt[];
  openQuestions: readonly string[];
  whatWouldStrengthen: readonly string[];
  initialContributions: PublicContribution[];
  initialStoreMode: "prototype" | "database" | "fallback";
  initialStoreNote: string;
  intakeContext?: {
    routeKind: "existing-room" | "room-topic-draft" | "new-room-draft";
    artifactTitle: string;
    promptCount: number;
    heldQuestionCount: number;
    pressureNoticeHref: string;
    exactArtifactHref: string;
    intakeArtifactHref: string;
    routingHref: string;
  } | null;
  pilotInquiryContext?: {
    returnHref: string;
    sectionHref: string;
  } | null;
  scoreReferences?: Record<
    string,
    Array<{ scoreLabel: string; scoreSliceLabel: string }>
  >;
  summaryReferences?: Record<string, Array<{ label: string; href: string }>>;
};

type SubmissionState = {
  kind: "idle" | "success" | "error";
  message?: string;
};

type DraftState = {
  messageId: string;
  provider: AiProvider;
  providerLabel: string;
  model: string;
  generatedAt: string;
  question: string;
  suggestedLane: FormLane;
} | null;

type ContributionResponse = {
  prototype: boolean;
  mode: "prototype" | "database" | "fallback";
  note: string;
  contributions: PublicContribution[];
};

type FormLane = DebateLane | "";

type ContributionFilter =
  | "all"
  | "needs-review"
  | "changed-card"
  | "ai-assisted"
  | "document-backed";

type ContributionOriginFilter =
  | "all-origins"
  | "human-submitted"
  | "ai-origin"
  | "seed-example";

type ContributionStatusFilter =
  | "all-statuses"
  | "pending"
  | "needs-review"
  | "accepted"
  | "incorporated"
  | "rejected";

type ContributionLaneFilter = "all-lanes" | DebateLane;

type ContributionAttachmentFilter =
  | "all-targets"
  | Exclude<ReviewTargetKind, "unclear">
  | "none-yet";

type ScoreContributionSlice = {
  label: string;
  count: number;
  recordView?: ContributionFilter;
  attachment?: ContributionAttachmentFilter;
  origin?: ContributionOriginFilter;
  lane?: DebateLane;
};

type FormState = {
  lane: FormLane;
  title: string;
  body: string;
  evidenceLabel: string;
  evidenceUrl: string;
  name: string;
  email: string;
  expertise: string;
  evidenceFile: File | null;
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
  evidenceFile: null,
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
const prototypeFallbackNote =
  "Prototype contribution record is active while persistent storage is being finalized.";

const contributionFilterLabels: Record<ContributionFilter, string> = {
  all: "All",
  "needs-review": "Needs review",
  "changed-card": "Changed card",
  "ai-assisted": "AI-assisted",
  "document-backed": "Document-backed",
};

const contributionAttachmentFilterLabels: Record<ContributionAttachmentFilter, string> = {
  "all-targets": "All targets",
  claim: "Synthesis",
  objection: "Objection",
  evidence: "Evidence",
  assumption: "Assumption",
  "open-question": "Open question",
  "none-yet": "None yet",
};

const contributionOriginFilterLabels: Record<ContributionOriginFilter, string> = {
  "all-origins": "All origins",
  "human-submitted": "Public submission",
  "ai-origin": "AI-origin",
  "seed-example": "Prototype example",
};

const contributionStatusFilterLabels: Record<ContributionStatusFilter, string> = {
  "all-statuses": "All statuses",
  pending: "Pending",
  "needs-review": "Needs review",
  accepted: "Accepted",
  incorporated: "Incorporated",
  rejected: "Rejected",
};

function normalizeContributionFilter(value: string | null | undefined): ContributionFilter {
  if (
    value === "all" ||
    value === "needs-review" ||
    value === "changed-card" ||
    value === "ai-assisted" ||
    value === "document-backed"
  ) {
    return value;
  }

  return "all";
}

function normalizeContributionAttachmentFilter(
  value: string | null | undefined,
): ContributionAttachmentFilter {
  if (
    value === "all-targets" ||
    value === "claim" ||
    value === "objection" ||
    value === "evidence" ||
    value === "assumption" ||
    value === "open-question" ||
    value === "none-yet"
  ) {
    return value;
  }

  return "all-targets";
}

function normalizeContributionOriginFilter(
  value: string | null | undefined,
): ContributionOriginFilter {
  if (
    value === "all-origins" ||
    value === "human-submitted" ||
    value === "ai-origin" ||
    value === "seed-example"
  ) {
    return value;
  }

  return "all-origins";
}

function normalizeContributionStatusFilter(
  value: string | null | undefined,
): ContributionStatusFilter {
  if (
    value === "all-statuses" ||
    value === "pending" ||
    value === "needs-review" ||
    value === "accepted" ||
    value === "incorporated" ||
    value === "rejected"
  ) {
    return value;
  }

  return "all-statuses";
}

function normalizeContributionLaneFilter(
  value: string | null | undefined,
): ContributionLaneFilter {
  if (!value) {
    return "all-lanes";
  }

  const normalizedLane = normalizeDebateLane(value);

  if (normalizedLane) {
    return normalizedLane;
  }

  return "all-lanes";
}

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

  const normalizedKind = kind === "claim" ? "synthesis" : kind.replaceAll("-", " ");

  if (!label) {
    return normalizedKind;
  }

  return `${normalizedKind} — ${label}`;
}

function getVisibleAttachmentFilter(contribution: PublicContribution): ContributionAttachmentFilter {
  const kind =
    contribution.review?.assignedToKind ?? contribution.aiIntake?.suggestedAssignmentKind;
  const normalizedKind = kind ? normalizeReviewTargetKind(kind) : null;

  if (!normalizedKind || normalizedKind === "unclear") {
    return "none-yet";
  }

  return normalizedKind;
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

function getQuickStartNotice(source: string | undefined, lane: DebateLane | null) {
  const laneLabel = lane ? getDebateLaneLabel(lane) : "selected lane";

  if (source === "reader") {
    return {
      title: "Quick start from Reader View",
      body: `You opened the contribution form through the ${laneLabel} lane. One useful move is enough here; you do not need to resolve the whole topic before contributing.`,
    };
  }

  if (source === "first-card") {
    return {
      title: "First-card pressure test",
      body: `You came through the first real contribution campaign. Start with one narrow ${laneLabel.toLowerCase()}: a strong objection, evidence source, or correction that could improve the Administrative Simplification card.`,
    };
  }

  if (source === "demo") {
    return {
      title: "Turn the demo into a real record",
      body: `You came from the guided demo. The useful next step is one real ${laneLabel.toLowerCase()} that can enter human review and, if it survives, visibly improve the card.`,
    };
  }

  if (lane) {
    return {
      title: `${laneLabel} lane selected`,
      body: "The lane is already selected. Add one concrete contribution that can be reviewed, attached, and inspected in the public record.",
    };
  }

  return null;
}

function getContributionBodyPlaceholder(lane: DebateLane | "") {
  switch (lane) {
    case "objection":
      return "State the strongest reason this card might be wrong or overclaiming. Name the specific claim it pressures.";
    case "evidence":
      return "Add the source, what it shows, and whether it supports or challenges the current synthesis.";
    case "correction":
      return "Identify the exact factual, numeric, definitional, or citation problem and what should replace it.";
    case "implementation-concern":
      return "Describe the practical barrier between the proposal and real-world execution.";
    case "economic-assumption-challenge":
      return "Challenge a savings, cost, incentive, or transition assumption and explain what evidence would settle it.";
    case "nuance":
      return "Add a missing condition or tradeoff that would make the card more accurate without rejecting it entirely.";
    case "personal-perspective":
      return "Share lived or professional experience that reveals a blind spot in the current synthesis.";
    default:
      return "Add the strongest objection, evidence, correction, or nuance you can.";
  }
}

function getSubmissionRecordType(contribution: PublicContribution) {
  const origin = getContributionOrigin(contribution);
  const type =
    origin === "seed-example"
      ? "Prototype example"
      : origin === "ai-origin"
        ? "AI-origin contribution"
        : "Public submission";

  if (contribution.evidenceDocument) {
    return `${type} - Document-backed submission`;
  }

  return type;
}

function getAdminReviewNote(contribution: PublicContribution) {
  const origin = getContributionOrigin(contribution);

  if (origin === "seed-example") {
    return "Prototype example used to show the review mechanics; it is not presented as public usage.";
  }

  if (origin === "ai-origin") {
    return "AI-origin draft. It can help form a contribution, but human review decides whether it attaches or changes the card.";
  }

  if (contribution.evidenceDocument) {
    return "Public submission with an uploaded document. The document stays attached while human review decides placement and synthesis impact.";
  }

  return "Public submission. It enters human review before it can change the visible synthesis, attachment record, or score pressure.";
}

function getContributionStatusFilter(status: ReviewStatus): ContributionStatusFilter {
  return status === "needs review" ? "needs-review" : status;
}

function getContributionRecordView(
  contribution: PublicContribution,
): ContributionFilter | undefined {
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

function getContributionLaneFilterLabel(filter: ContributionLaneFilter) {
  if (filter === "all-lanes") {
    return "All lanes";
  }

  return getDebateLaneLabel(filter);
}

function getAiReaderLabel(provider: AiProvider) {
  return provider === "openai" ? "Structurer AI" : "Critic AI";
}

function getAiReaderProviderLabel(provider: AiProvider) {
  return provider === "openai" ? "OpenAI model" : "Claude model";
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

function getContributionInterpretation(contribution: PublicContribution) {
  if (contribution.review?.reviewedAt) {
    return {
      label: "Human review read",
      note:
        contribution.review.publicRecordNote ??
        contribution.review.decisionReason ??
        "Human review resolved this contribution without a public note yet.",
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

function getScoreTransparencySliceDefinitions(
  scoreLabel: string,
): Array<Omit<ScoreContributionSlice, "count">> {
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

function matchesScoreContributionSlice(
  contribution: PublicContribution,
  slice: Omit<ScoreContributionSlice, "count">,
) {
  if (
    slice.recordView &&
    getContributionRecordView(contribution) !== slice.recordView
  ) {
    return false;
  }

  if (
    slice.attachment &&
    getVisibleAttachmentFilter(contribution) !== slice.attachment
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

function getScoreTransparencySlices(
  scoreLabel: string,
  contributions: readonly PublicContribution[],
): ScoreContributionSlice[] {
  return getScoreTransparencySliceDefinitions(scoreLabel).map((slice) => ({
    ...slice,
    count: contributions.filter((contribution) =>
      matchesScoreContributionSlice(contribution, slice),
    ).length,
  }));
}

function getLatestScoreTransparencyContribution(
  slices: readonly ScoreContributionSlice[],
  contributions: readonly PublicContribution[],
  matches: (contribution: PublicContribution) => boolean = () => true,
) {
  let bestMatch:
    | {
        slice: ScoreContributionSlice;
        contribution: PublicContribution;
      }
    | null = null;

  for (const slice of slices) {
    const candidate = contributions
      .filter(
        (contribution) =>
          matchesScoreContributionSlice(contribution, slice) &&
          matches(contribution),
      )
      .sort(
        (left, right) =>
          Date.parse(right.updatedAt || right.createdAt) -
          Date.parse(left.updatedAt || left.createdAt),
      )[0];

    if (!candidate) {
      continue;
    }

    if (
      !bestMatch ||
      Date.parse(candidate.updatedAt || candidate.createdAt) >
        Date.parse(
          bestMatch.contribution.updatedAt || bestMatch.contribution.createdAt,
        )
    ) {
      bestMatch = {
        slice,
        contribution: candidate,
      };
    }
  }

  return bestMatch;
}

function getSourceAiTurnHref(
  pathname: string,
  searchParams: { toString(): string },
  messageId: string,
) {
  const nextSearchParams = new URLSearchParams(searchParams.toString());
  nextSearchParams.set("chatMessage", messageId);

  return `${pathname}?${nextSearchParams.toString()}#topic-chat-message-${messageId}`;
}

function getExactContributionLedgerHref(
  pathname: string,
  searchParams: { toString(): string },
  contribution: PublicContribution,
) {
  const nextSearchParams = new URLSearchParams(searchParams.toString());
  const recordView = getContributionRecordView(contribution);
  const statusFilter = getContributionStatusFilter(contribution.status);
  const attachmentFilter = getVisibleAttachmentFilter(contribution);
  const originFilter = getContributionOrigin(contribution);

  if (recordView && recordView !== "all") {
    nextSearchParams.set("recordView", recordView);
  } else {
    nextSearchParams.delete("recordView");
  }

  if (statusFilter !== "all-statuses") {
    nextSearchParams.set("reviewStatus", statusFilter);
  } else {
    nextSearchParams.delete("reviewStatus");
  }

  if (attachmentFilter !== "all-targets") {
    nextSearchParams.set("attachment", attachmentFilter);
  } else {
    nextSearchParams.delete("attachment");
  }

  if (originFilter !== "all-origins") {
    nextSearchParams.set("origin", originFilter);
  } else {
    nextSearchParams.delete("origin");
  }

  nextSearchParams.set("lane", contribution.lane);

  return `${pathname}?${nextSearchParams.toString()}#contribution-${contribution.id}`;
}

function getSummaryReferenceHref(
  href: string,
  scoreLabel?: string,
  scoreSliceLabel?: string,
  intakeId?: string,
  pilotInquiry?: boolean,
) {
  if (!scoreLabel && !scoreSliceLabel && !intakeId && !pilotInquiry) {
    return href;
  }

  const [pathAndQuery, hashFragment] = href.split("#");
  const [path, query = ""] = pathAndQuery.split("?");
  const nextSearchParams = new URLSearchParams(query);

  if (scoreLabel) {
    nextSearchParams.set("scoreLabel", scoreLabel);
  }

  if (scoreSliceLabel) {
    nextSearchParams.set("scoreSlice", scoreSliceLabel);
  }

  if (intakeId) {
    nextSearchParams.set("intake", intakeId);
  }

  if (pilotInquiry) {
    nextSearchParams.set("pilotInquiry", "1");
  }

  const nextQuery = nextSearchParams.toString();
  const nextHash = hashFragment ? `#${hashFragment}` : "";

  return `${path}${nextQuery ? `?${nextQuery}` : ""}${nextHash}`;
}

function getScoreReferenceHref(
  pathname: string,
  searchParams: { toString(): string },
  scoreLabel: string,
  scoreSliceLabel?: string,
) {
  const nextSearchParams = new URLSearchParams(searchParams.toString());
  nextSearchParams.set("scoreLabel", scoreLabel);

  if (scoreSliceLabel) {
    nextSearchParams.set("scoreSlice", scoreSliceLabel);
  } else {
    nextSearchParams.delete("scoreSlice");
  }

  return `${pathname}?${nextSearchParams.toString()}#${getScoreAnchorId(scoreLabel)}`;
}

function getHighlightedContributionId(hash: string) {
  if (!hash.startsWith("#contribution-") || hash === "#contribution-record") {
    return "";
  }

  return decodeURIComponent(hash.slice("#contribution-".length));
}

function getScoreAnchorId(label: string) {
  return `score-${label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}

function formatBytes(value: number) {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TopicContributionLoop({
  roomSlug,
  topicId,
  topicTitle,
  debatePrompts,
  openQuestions,
  whatWouldStrengthen,
  initialContributions,
  initialStoreMode,
  initialStoreNote,
  intakeContext = null,
  pilotInquiryContext = null,
  scoreReferences = {},
  summaryReferences = {},
}: TopicContributionLoopProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    kind: "idle",
  });
  const [draftState, setDraftState] = useState<DraftState>(null);
  const [contributions, setContributions] = useState<PublicContribution[]>(initialContributions);
  const [storeMode, setStoreMode] = useState(initialStoreMode);
  const [storeNote, setStoreNote] = useState(initialStoreNote);
  const [currentHash, setCurrentHash] = useState("");
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
  const recentContributionNote =
    storeMode !== "database"
      ? hasPrototypeExamples
        ? `${prototypeFallbackNote} ${prototypeExamplesNote}`
        : prototypeFallbackNote
      : hasPrototypeExamples
        ? prototypeExamplesNote
        : storeNote ||
          "Recent public contributions, assisted reading, and human review decisions stay visible here.";
  const filterCounts = useMemo(
    () => ({
      all: contributions.length,
      "needs-review": contributions.filter(
        (item) => item.status === "pending" || item.status === "needs review",
      ).length,
      "changed-card": contributions.filter(
        (item) => item.review?.changedSynthesis === true,
      ).length,
      "ai-assisted": contributions.filter((item) => item.draftSource).length,
      "document-backed": contributions.filter((item) => item.evidenceDocument).length,
    }),
    [contributions],
  );
  const activeFilter = useMemo(
    () => normalizeContributionFilter(searchParams.get("recordView")),
    [searchParams],
  );
  const activeAttachmentFilter = useMemo(
    () => normalizeContributionAttachmentFilter(searchParams.get("attachment")),
    [searchParams],
  );
  const activeOriginFilter = useMemo(
    () => normalizeContributionOriginFilter(searchParams.get("origin")),
    [searchParams],
  );
  const activeStatusFilter = useMemo(
    () => normalizeContributionStatusFilter(searchParams.get("reviewStatus")),
    [searchParams],
  );
  const activeLaneFilter = useMemo(
    () => normalizeContributionLaneFilter(searchParams.get("lane")),
    [searchParams],
  );
  const highlightedContributionId = useMemo(
    () => getHighlightedContributionId(currentHash),
    [currentHash],
  );
  const recordFilteredContributions = useMemo(
    () =>
      (() => {
      switch (activeFilter) {
        case "needs-review":
          return contributions.filter(
            (item) => item.status === "pending" || item.status === "needs review",
          );
        case "changed-card":
          return contributions.filter((item) => item.review?.changedSynthesis === true);
        case "ai-assisted":
          return contributions.filter((item) => item.draftSource);
        case "document-backed":
          return contributions.filter((item) => item.evidenceDocument);
        case "all":
        default:
          return contributions;
      }
      })(),
    [activeFilter, contributions],
  );
  const statusFilteredContributions = useMemo(() => {
    if (activeStatusFilter === "all-statuses") {
      return recordFilteredContributions;
    }

    return recordFilteredContributions.filter(
      (item) => getContributionStatusFilter(item.status) === activeStatusFilter,
    );
  }, [activeStatusFilter, recordFilteredContributions]);
  const attachmentFilteredContributions = useMemo(() => {
    if (activeAttachmentFilter === "all-targets") {
      return statusFilteredContributions;
    }

    return statusFilteredContributions.filter(
      (item) => getVisibleAttachmentFilter(item) === activeAttachmentFilter,
    );
  }, [activeAttachmentFilter, statusFilteredContributions]);
  const attachmentFilterCounts = useMemo(
    () => ({
      "all-targets": statusFilteredContributions.length,
      claim: statusFilteredContributions.filter(
        (item) => getVisibleAttachmentFilter(item) === "claim",
      ).length,
      objection: statusFilteredContributions.filter(
        (item) => getVisibleAttachmentFilter(item) === "objection",
      ).length,
      evidence: statusFilteredContributions.filter(
        (item) => getVisibleAttachmentFilter(item) === "evidence",
      ).length,
      assumption: statusFilteredContributions.filter(
        (item) => getVisibleAttachmentFilter(item) === "assumption",
      ).length,
      "open-question": statusFilteredContributions.filter(
        (item) => getVisibleAttachmentFilter(item) === "open-question",
      ).length,
      "none-yet": statusFilteredContributions.filter(
        (item) => getVisibleAttachmentFilter(item) === "none-yet",
      ).length,
    }),
    [statusFilteredContributions],
  );
  const statusFilterCounts = useMemo(
    () => ({
      "all-statuses": recordFilteredContributions.length,
      pending: recordFilteredContributions.filter((item) => item.status === "pending").length,
      "needs-review": recordFilteredContributions.filter(
        (item) => item.status === "needs review",
      ).length,
      accepted: recordFilteredContributions.filter((item) => item.status === "accepted").length,
      incorporated: recordFilteredContributions.filter(
        (item) => item.status === "incorporated",
      ).length,
      rejected: recordFilteredContributions.filter((item) => item.status === "rejected").length,
    }),
    [recordFilteredContributions],
  );
  const originFilterCounts = useMemo(
    () => ({
      "all-origins": attachmentFilteredContributions.length,
      "human-submitted": attachmentFilteredContributions.filter(
        (item) => getContributionOrigin(item) === "human-submitted",
      ).length,
      "ai-origin": attachmentFilteredContributions.filter(
        (item) => getContributionOrigin(item) === "ai-origin",
      ).length,
      "seed-example": attachmentFilteredContributions.filter(
        (item) => getContributionOrigin(item) === "seed-example",
      ).length,
    }),
    [attachmentFilteredContributions],
  );
  const originFilteredContributions = useMemo(() => {
    if (activeOriginFilter === "all-origins") {
      return attachmentFilteredContributions;
    }

    return attachmentFilteredContributions.filter(
      (item) => getContributionOrigin(item) === activeOriginFilter,
    );
  }, [activeOriginFilter, attachmentFilteredContributions]);
  const laneFilterCounts = useMemo(
    () => {
      const counts = {
        "all-lanes": originFilteredContributions.length,
      } as Record<ContributionLaneFilter, number>;

      for (const lane of Object.keys(debateLaneLabels) as DebateLane[]) {
        counts[lane] = originFilteredContributions.filter((item) => item.lane === lane).length;
      }

      return counts;
    },
    [originFilteredContributions],
  );
  const filteredContributions = useMemo(() => {
    if (activeLaneFilter === "all-lanes") {
      return originFilteredContributions;
    }

    return originFilteredContributions.filter(
      (item) => item.lane === activeLaneFilter,
    );
  }, [activeLaneFilter, originFilteredContributions]);
  const hasActiveLedgerFilters =
    activeFilter !== "all" ||
    activeStatusFilter !== "all-statuses" ||
    activeAttachmentFilter !== "all-targets" ||
    activeOriginFilter !== "all-origins" ||
    activeLaneFilter !== "all-lanes";
  const activeLedgerSliceLabel = useMemo(() => {
    const labels = [];

    if (activeFilter !== "all") {
      labels.push(contributionFilterLabels[activeFilter]);
    }

    if (activeAttachmentFilter !== "all-targets") {
      labels.push(contributionAttachmentFilterLabels[activeAttachmentFilter]);
    }

    if (activeStatusFilter !== "all-statuses") {
      labels.push(contributionStatusFilterLabels[activeStatusFilter]);
    }

    if (activeOriginFilter !== "all-origins") {
      labels.push(contributionOriginFilterLabels[activeOriginFilter]);
    }

    if (activeLaneFilter !== "all-lanes") {
      labels.push(getContributionLaneFilterLabel(activeLaneFilter));
    }

    if (!labels.length) {
      return "All visible contributions";
    }

    return labels.join(" · ");
  }, [
    activeAttachmentFilter,
    activeFilter,
    activeLaneFilter,
    activeOriginFilter,
    activeStatusFilter,
  ]);
  const highlightedContribution = useMemo(
    () =>
      highlightedContributionId
        ? contributions.find((item) => item.id === highlightedContributionId) ?? null
        : null,
    [contributions, highlightedContributionId],
  );
  const highlightedVisibleContribution = useMemo(
    () =>
      highlightedContributionId
        ? filteredContributions.find((item) => item.id === highlightedContributionId) ?? null
        : null,
    [filteredContributions, highlightedContributionId],
  );
  const highlightedSummaryReferences = useMemo(() => {
    if (highlightedVisibleContribution) {
      return summaryReferences[highlightedVisibleContribution.id] ?? [];
    }

    if (highlightedContribution) {
      return summaryReferences[highlightedContribution.id] ?? [];
    }

    return [];
  }, [highlightedContribution, highlightedVisibleContribution, summaryReferences]);
  const highlightedScoreReferences = useMemo(() => {
    if (highlightedVisibleContribution) {
      return scoreReferences[highlightedVisibleContribution.id] ?? [];
    }

    if (highlightedContribution) {
      return scoreReferences[highlightedContribution.id] ?? [];
    }

    return [];
  }, [highlightedContribution, highlightedVisibleContribution, scoreReferences]);
  const activeSourceSummaryLabel = useMemo(
    () => searchParams.get("sourceSummary")?.trim() || undefined,
    [searchParams],
  );
  const activeScoreLabel = useMemo(
    () => searchParams.get("scoreLabel")?.trim() || undefined,
    [searchParams],
  );
  const quickStartLane = useMemo(
    () => normalizeDebateLane(searchParams.get("contributeLane") ?? ""),
    [searchParams],
  );
  const quickStartSource = useMemo(
    () => searchParams.get("contributeFrom")?.trim() || undefined,
    [searchParams],
  );
  const selectedContributionLane = formState.lane || quickStartLane || "";
  const quickStartNotice = useMemo(
    () => getQuickStartNotice(quickStartSource, quickStartLane),
    [quickStartLane, quickStartSource],
  );
  const contributionBodyPlaceholder = useMemo(
    () => getContributionBodyPlaceholder(selectedContributionLane),
    [selectedContributionLane],
  );
  const activeScoreSliceLabel = useMemo(
    () => searchParams.get("scoreSlice")?.trim() || undefined,
    [searchParams],
  );
  const activeIntakeId = useMemo(
    () => searchParams.get("intake")?.trim() || undefined,
    [searchParams],
  );
  const activePilotInquiry = useMemo(
    () => searchParams.get("pilotInquiry")?.trim() === "1",
    [searchParams],
  );
  const activeScoreRelatedSlices = useMemo(
    () =>
      activeScoreLabel
        ? getScoreTransparencySlices(activeScoreLabel, contributions)
        : [],
    [activeScoreLabel, contributions],
  );
  const activeScoreLatestVisibleContribution = useMemo(
    () =>
      activeScoreLabel
        ? getLatestScoreTransparencyContribution(
            activeScoreRelatedSlices,
            contributions,
          )
        : null,
    [activeScoreLabel, activeScoreRelatedSlices, contributions],
  );
  const activeScoreLatestUnresolvedContribution = useMemo(
    () =>
      activeScoreLabel
        ? getLatestScoreTransparencyContribution(
            activeScoreRelatedSlices,
            contributions,
            (contribution) =>
              contribution.status === "pending" ||
              contribution.status === "needs review",
          )
        : null,
    [activeScoreLabel, activeScoreRelatedSlices, contributions],
  );
  const highlightedSourceSummaryReference = useMemo(() => {
    if (!activeSourceSummaryLabel) {
      return null;
    }

    return (
      highlightedSummaryReferences.find(
        (reference) => reference.label === activeSourceSummaryLabel,
      ) ?? null
    );
  }, [activeSourceSummaryLabel, highlightedSummaryReferences]);
  const alternateHighlightedSummaryReferences = useMemo(
    () =>
      highlightedSourceSummaryReference
        ? highlightedSummaryReferences.filter(
            (reference) => reference.label !== highlightedSourceSummaryReference.label,
          )
        : highlightedSummaryReferences,
    [highlightedSourceSummaryReference, highlightedSummaryReferences],
  );
  const alternateHighlightedScoreReferences = useMemo(
    () =>
      highlightedScoreReferences.filter(
        (reference) =>
          !(
            activeScoreLabel === reference.scoreLabel &&
            activeScoreSliceLabel === reference.scoreSliceLabel
          ),
      ),
    [activeScoreLabel, activeScoreSliceLabel, highlightedScoreReferences],
  );
  const highlightedContributionInterpretation = useMemo(() => {
    if (highlightedVisibleContribution) {
      return getContributionInterpretation(highlightedVisibleContribution);
    }

    if (highlightedContribution) {
      return getContributionInterpretation(highlightedContribution);
    }

    return null;
  }, [highlightedContribution, highlightedVisibleContribution]);
  const scoreReturnHref = useMemo(() => {
    if (!activeScoreLabel) {
      return "";
    }

    const nextQuery = searchParams.toString();

    return `${pathname}${nextQuery ? `?${nextQuery}` : ""}#${getScoreAnchorId(activeScoreLabel)}`;
  }, [activeScoreLabel, pathname, searchParams]);
  const activeScoreUnresolvedMatchesLatestVisible = Boolean(
    activeScoreLatestUnresolvedContribution &&
      activeScoreLatestVisibleContribution &&
      activeScoreLatestUnresolvedContribution.contribution.id ===
        activeScoreLatestVisibleContribution.contribution.id,
  );

  function handleFilterPick(filter: ContributionFilter) {
    const nextSearchParams = new URLSearchParams(searchParams.toString());

    if (filter === "all") {
      nextSearchParams.delete("recordView");
    } else {
      nextSearchParams.set("recordView", filter);
    }

    const nextQuery = nextSearchParams.toString();
    router.replace(
      `${pathname}${nextQuery ? `?${nextQuery}` : ""}#contribution-record`,
      {
        scroll: false,
      },
    );
  }

  function resetLedgerFilters() {
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete("recordView");
    nextSearchParams.delete("reviewStatus");
    nextSearchParams.delete("attachment");
    nextSearchParams.delete("origin");
    nextSearchParams.delete("lane");

    const nextQuery = nextSearchParams.toString();
    router.replace(
      `${pathname}${nextQuery ? `?${nextQuery}` : ""}#contribution-record`,
      {
        scroll: false,
      },
    );
  }

  function handleAttachmentFilterPick(filter: ContributionAttachmentFilter) {
    const nextSearchParams = new URLSearchParams(searchParams.toString());

    if (filter === "all-targets") {
      nextSearchParams.delete("attachment");
    } else {
      nextSearchParams.set("attachment", filter);
    }

    const nextQuery = nextSearchParams.toString();
    router.replace(
      `${pathname}${nextQuery ? `?${nextQuery}` : ""}#contribution-record`,
      {
        scroll: false,
      },
    );
  }

  function handleStatusFilterPick(filter: ContributionStatusFilter) {
    const nextSearchParams = new URLSearchParams(searchParams.toString());

    if (filter === "all-statuses") {
      nextSearchParams.delete("reviewStatus");
    } else {
      nextSearchParams.set("reviewStatus", filter);
    }

    const nextQuery = nextSearchParams.toString();
    router.replace(
      `${pathname}${nextQuery ? `?${nextQuery}` : ""}#contribution-record`,
      {
        scroll: false,
      },
    );
  }

  function handleOriginFilterPick(filter: ContributionOriginFilter) {
    const nextSearchParams = new URLSearchParams(searchParams.toString());

    if (filter === "all-origins") {
      nextSearchParams.delete("origin");
    } else {
      nextSearchParams.set("origin", filter);
    }

    const nextQuery = nextSearchParams.toString();
    router.replace(
      `${pathname}${nextQuery ? `?${nextQuery}` : ""}#contribution-record`,
      {
        scroll: false,
      },
    );
  }

  function handleLaneFilterPick(filter: ContributionLaneFilter) {
    const nextSearchParams = new URLSearchParams(searchParams.toString());

    if (filter === "all-lanes") {
      nextSearchParams.delete("lane");
    } else {
      nextSearchParams.set("lane", filter);
    }

    const nextQuery = nextSearchParams.toString();
    router.replace(
      `${pathname}${nextQuery ? `?${nextQuery}` : ""}#contribution-record`,
      {
        scroll: false,
      },
    );
  }

  function revealExactContribution(contribution: PublicContribution) {
    router.replace(getExactContributionLedgerHref(pathname, searchParams, contribution), {
      scroll: false,
    });
  }

  useEffect(() => {
    function syncHashFromWindow() {
      setCurrentHash(window.location.hash);
    }

    syncHashFromWindow();
    window.addEventListener("hashchange", syncHashFromWindow);

    return () => {
      window.removeEventListener("hashchange", syncHashFromWindow);
    };
  }, []);

  useEffect(() => {
    if (!highlightedContributionId) {
      return;
    }

    const targetId = highlightedVisibleContribution
      ? `contribution-${highlightedVisibleContribution.id}`
      : "contribution-record";
    let timeoutId = 0;

    timeoutId = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({
        block: "start",
        behavior: "smooth",
      });
    }, 140);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [highlightedContributionId, highlightedVisibleContribution]);

  useEffect(() => {
    let isCancelled = false;

    async function loadContributions() {
      try {
        const response = await fetch(
          `/api/contributions?roomSlug=${encodeURIComponent(roomSlug)}&topicId=${encodeURIComponent(topicId)}&limit=${topicCardVisibleContributionLimit}`,
        );
        const payload = (await response.json()) as ContributionResponse;

        if (!response.ok) {
          throw new Error("Unable to load contributions.");
        }

        if (!isCancelled) {
          setContributions(payload.contributions);
          setStoreMode(payload.mode);
          setStoreNote(payload.note);
        }
      } catch (error) {
        console.error(error);

        if (!isCancelled && !initialContributions.length) {
          setSubmissionState({
            kind: "error",
            message:
              "The contribution record could not be loaded right now. You can still try again in a moment.",
          });
        }
      }
    }

    void loadContributions();

    return () => {
      isCancelled = true;
    };
  }, [roomSlug, topicId, initialContributions.length]);

  useEffect(() => {
    if (currentHash !== "#debate" || !quickStartLane) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      titleRef.current?.focus();
    }, 150);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [currentHash, quickStartLane]);

  useEffect(() => {
    function handleAiDraft(event: Event) {
      const customEvent = event as CustomEvent<TopicAiDraftDetail>;
      const detail = customEvent.detail;

      if (!detail || detail.roomSlug !== roomSlug || detail.topicId !== topicId) {
        return;
      }

      const trimmedQuestion = detail.question.trim();
      const nextTitle =
        trimmedQuestion.length > 110
          ? `${trimmedQuestion.slice(0, 107).trimEnd()}...`
          : trimmedQuestion;
      const nextBody = [
        "Question raised through the AI layer:",
        trimmedQuestion,
        "",
        `Working note from ${detail.providerLabel} (${detail.model}):`,
        detail.response,
      ].join("\n");

      setFormState((current) => ({
        ...current,
        lane: detail.suggestedLane ?? "",
        title: nextTitle,
        body: nextBody,
      }));
      setDraftState({
        messageId: detail.messageId,
        provider: detail.provider,
        providerLabel: detail.providerLabel,
        model: detail.model,
        generatedAt: detail.generatedAt,
        question: trimmedQuestion,
        suggestedLane: detail.suggestedLane ?? "",
      });
      setSubmissionState({ kind: "idle" });

      requestAnimationFrame(() => {
        titleRef.current?.focus();
        titleRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }

    window.addEventListener(topicAiDraftEventName, handleAiDraft as EventListener);

    return () => {
      window.removeEventListener(topicAiDraftEventName, handleAiDraft as EventListener);
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
      evidenceFile: null,
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

    if (!selectedContributionLane) {
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
          body: (() => {
            const formData = new FormData();
            formData.set("roomSlug", roomSlug);
            formData.set("topicId", topicId);
            formData.set("lane", selectedContributionLane);
            formData.set("title", formState.title);
            formData.set("body", formState.body);
            formData.set("evidenceLabel", formState.evidenceLabel);
            formData.set("evidenceUrl", formState.evidenceUrl);
            formData.set("name", formState.name);
            formData.set("email", formState.email);
            formData.set("expertise", formState.expertise);
            formData.set("website", website);

            if (draftState) {
              formData.set(
                "draftSource",
                JSON.stringify({
                  messageId: draftState.messageId,
                  provider: draftState.provider,
                  providerLabel: draftState.providerLabel,
                  model: draftState.model,
                  question: draftState.question,
                  generatedAt: draftState.generatedAt,
                }),
              );
            }

            if (formState.evidenceFile) {
              formData.set("evidenceFile", formState.evidenceFile);
            }

            return formData;
          })(),
        });

        const payload = (await response.json()) as {
          error?: string;
          message?: string;
          contribution?: PublicContribution;
        };

        if (!response.ok || !payload.contribution || !payload.message) {
          throw new Error(payload.error ?? "Contribution could not be submitted.");
        }

        setContributions((current) =>
          [payload.contribution!, ...current].slice(0, topicCardVisibleContributionLimit),
        );
        resetContributionFields();
        setDraftState(null);
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
            {quickStartNotice ? (
              <div className={styles.quickStartNotice}>
                <strong>{quickStartNotice.title}</strong>
                <p>{quickStartNotice.body}</p>
              </div>
            ) : null}
            {prompts.map((item) => {
              const isActive = selectedContributionLane === item.lane;

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

            {draftState ? (
              <div className={styles.draftState}>
                <strong>Draft loaded from the AI layer</strong>
                <p>
                  {draftState.providerLabel} ({draftState.model}) helped draft this
                  contribution from the question:
                </p>
                <p className={styles.draftQuestion}>{draftState.question}</p>
                <p>
                  AI output was generated on{" "}
                  <strong>{formatTimestamp(draftState.generatedAt)}</strong>.
                </p>
                {draftState.suggestedLane ? (
                  <p>
                    Suggested lane:{" "}
                    <strong>{getDebateLaneLabel(draftState.suggestedLane)}</strong>.
                    Change it if another lane fits the public record better.
                  </p>
                ) : null}
                <p>
                  Choose the lane deliberately, revise the text in your own voice,
                  and submit it only if it improves the public record.
                </p>
              </div>
            ) : null}

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
                  value={selectedContributionLane}
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
                placeholder={contributionBodyPlaceholder}
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

            <label className={styles.field}>
              <span>Upload supporting paper or document</span>
              <input
                accept=".pdf,.txt,.md,.markdown,.json,.csv,.xml,.html,.htm,.docx"
                onChange={(event) =>
                  handleFieldChange("evidenceFile", event.target.files?.[0] ?? null)
                }
                type="file"
              />
              <small className={styles.fieldHelp}>
                Optional. Best for PDFs or plain-text documents under 8 MB. Civic Logos will
                store the file, extract text when possible, and surface it for review.
              </small>
              {formState.evidenceFile ? (
                <small className={styles.fieldHelp}>
                  Selected: {formState.evidenceFile.name} ({formatBytes(formState.evidenceFile.size)})
                </small>
              ) : null}
            </label>

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

      <section className={styles.panel} id="contribution-record">
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.eyebrow}>Recent contributions</span>
            <h2>Contribution, assisted reading, review, and synthesis impact.</h2>
          </div>
          <p className={styles.metaNote}>{recentContributionNote}</p>
        </div>

        <div className={styles.filterBlock}>
          {activePilotInquiry && pilotInquiryContext ? (
            <div className={styles.focusNotice}>
              <div>
                <span className={styles.sectionLabel}>
                  Viewed under institutional inquiry
                </span>
                <p>
                  This ledger is being read as part of the active institutional
                  pilot snapshot for <strong>{topicTitle}</strong>, so the exact
                  public-record entry below remains tied to that live inquiry
                  handoff rather than acting like an isolated record.
                </p>
              </div>
              <div className={styles.focusReferenceBlock}>
                <span className={styles.sectionLabel}>Return path</span>
                <div className={styles.summaryReferenceList}>
                  <a
                    className={styles.summaryReferenceLink}
                    href={pilotInquiryContext.returnHref}
                  >
                    Return to institutional inquiry snapshot
                  </a>
                  <a
                    className={styles.summaryReferenceLink}
                    href={pilotInquiryContext.sectionHref}
                  >
                    Return to pilot-ready topic section
                  </a>
                </div>
              </div>
            </div>
          ) : null}
          {intakeContext ? (
            <div className={styles.focusNotice}>
              <div>
                <span className={styles.sectionLabel}>
                  Viewed under held intake pressure
                </span>
                <p>
                  This ledger is being read while{" "}
                  <strong>{intakeContext.artifactTitle}</strong>{" "}
                  {intakeContext.routeKind === "room-topic-draft"
                    ? `is still held as a durable draft topic outside the live record, with ${intakeContext.promptCount} prompt${intakeContext.promptCount === 1 ? "" : "s"} and ${intakeContext.heldQuestionCount} held question${intakeContext.heldQuestionCount === 1 ? "" : "s"} still pressing on this card.`
                    : intakeContext.routeKind === "new-room-draft"
                      ? `is still held as a room candidate outside the active map, with ${intakeContext.promptCount} prompt${intakeContext.promptCount === 1 ? "" : "s"} and ${intakeContext.heldQuestionCount} held question${intakeContext.heldQuestionCount === 1 ? "" : "s"} still pressing on this card.`
                      : "is still being read through the current room-intake route."}
                </p>
              </div>
              <div className={styles.focusReferenceBlock}>
                <span className={styles.sectionLabel}>Return path</span>
                <div className={styles.summaryReferenceList}>
                  <a
                    className={styles.summaryReferenceLink}
                    href={intakeContext.pressureNoticeHref}
                  >
                    Return to intake pressure notice
                  </a>
                  <a
                    className={styles.summaryReferenceLink}
                    href={intakeContext.exactArtifactHref}
                  >
                    {intakeContext.routeKind === "room-topic-draft"
                      ? "Open exact draft topic"
                      : intakeContext.routeKind === "new-room-draft"
                        ? "Open exact room candidate"
                        : "Return to room intake context"}
                  </a>
                  <a
                    className={styles.summaryReferenceLink}
                    href={intakeContext.intakeArtifactHref}
                  >
                    Return to intake artifact
                  </a>
                  <a
                    className={styles.summaryReferenceLink}
                    href={intakeContext.routingHref}
                  >
                    Open routing AIs
                  </a>
                </div>
              </div>
            </div>
          ) : null}
          {activeScoreLabel ? (
            <div className={styles.focusNotice}>
              <div>
                <span className={styles.sectionLabel}>Returned from scorecard</span>
                <p>
                  This ledger view was opened from the healthcare score{" "}
                  <strong>{activeScoreLabel}</strong>
                  {activeScoreSliceLabel ? (
                    <>
                      {" "}
                      through the slice <strong>{activeScoreSliceLabel}</strong>
                    </>
                  ) : null}
                  . Use the visible record below to challenge or refine that score.
                </p>
              </div>
              <div className={styles.focusReferenceBlock}>
                <span className={styles.sectionLabel}>Return path</span>
                <div className={styles.summaryReferenceList}>
                  <a className={styles.summaryReferenceLink} href={scoreReturnHref}>
                    Return to {activeScoreLabel}
                  </a>
                </div>
              </div>
              <div className={styles.focusReferenceBlock}>
                <span className={styles.sectionLabel}>Open review pressure</span>
                {activeScoreLatestUnresolvedContribution ? (
                  activeScoreUnresolvedMatchesLatestVisible ? (
                    <p>
                      The freshest visible record touching this score is still
                      unresolved and could still move <strong>{activeScoreLabel}</strong>{" "}
                      after human review.
                    </p>
                  ) : (
                    <p>
                      The newest unresolved public pressure that could still move{" "}
                      <strong>{activeScoreLabel}</strong> is{" "}
                      <a
                        className={styles.summaryReferenceLink}
                        href={getExactContributionLedgerHref(
                          pathname,
                          searchParams,
                          activeScoreLatestUnresolvedContribution.contribution,
                        )}
                      >
                        {activeScoreLatestUnresolvedContribution.contribution.title}
                      </a>
                      {" "}through{" "}
                      <strong>
                        {activeScoreLatestUnresolvedContribution.slice.label}
                      </strong>
                      .
                    </p>
                  )
                ) : (
                  <p>
                    No unresolved public pressure is currently linked to{" "}
                    <strong>{activeScoreLabel}</strong>.
                  </p>
                )}
              </div>
            </div>
          ) : null}
          {highlightedVisibleContribution ? (
            <div className={styles.focusNotice}>
              <div>
                <span className={styles.sectionLabel}>Exact record focus</span>
                <p>
                  Showing the exact contribution entry linked from{" "}
                  <strong>
                    {highlightedSourceSummaryReference?.label ?? "this card's summary layers"}
                  </strong>
                  : <strong>{highlightedVisibleContribution.title}</strong>.
                </p>
              </div>
              <p className={styles.focusMeta}>
                {contributionOriginFilterLabels[
                  getContributionOrigin(highlightedVisibleContribution)
                ]}{" "}
                · {statusLabels[highlightedVisibleContribution.status]} ·{" "}
                {getDebateLaneLabel(highlightedVisibleContribution.lane)}
              </p>
              {highlightedContributionInterpretation ? (
                <div className={styles.focusReferenceBlock}>
                  <span className={styles.sectionLabel}>
                    {highlightedContributionInterpretation.label}
                  </span>
                  <p>{highlightedContributionInterpretation.note}</p>
                </div>
              ) : null}
              {highlightedSourceSummaryReference || alternateHighlightedSummaryReferences.length ? (
                <div className={styles.focusReferenceBlock}>
                  {highlightedSourceSummaryReference ? (
                    <>
                      <span className={styles.sectionLabel}>Returned from summary</span>
                      <div className={styles.summaryReferenceList}>
                        <a
                          className={styles.summaryReferenceLink}
                          href={getSummaryReferenceHref(
                            highlightedSourceSummaryReference.href,
                            activeScoreLabel,
                            activeScoreSliceLabel,
                            activeIntakeId,
                            activePilotInquiry,
                          )}
                        >
                          {highlightedSourceSummaryReference.label}
                        </a>
                      </div>
                    </>
                  ) : null}
                  {alternateHighlightedSummaryReferences.length ? (
                    <>
                      <span className={styles.sectionLabel}>Card summaries using this record</span>
                      <div className={styles.summaryReferenceList}>
                        {alternateHighlightedSummaryReferences.map((reference) => (
                          <a
                            className={styles.summaryReferenceLink}
                            href={getSummaryReferenceHref(
                              reference.href,
                              activeScoreLabel,
                              activeScoreSliceLabel,
                              activeIntakeId,
                              activePilotInquiry,
                            )}
                            key={`focus-${highlightedVisibleContribution.id}-${reference.href}-${reference.label}`}
                          >
                            {reference.label}
                          </a>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
              ) : null}
              {alternateHighlightedScoreReferences.length ? (
                <div className={styles.focusReferenceBlock}>
                  <span className={styles.sectionLabel}>
                    {activeScoreLabel
                      ? "Also used by scorecard"
                      : "Scorecard items using this record"}
                  </span>
                  <div className={styles.summaryReferenceList}>
                    {alternateHighlightedScoreReferences.map((reference) => (
                      <a
                        className={styles.summaryReferenceLink}
                        href={getScoreReferenceHref(
                          pathname,
                          searchParams,
                          reference.scoreLabel,
                          reference.scoreSliceLabel,
                        )}
                        key={`focus-score-${highlightedVisibleContribution.id}-${reference.scoreLabel}-${reference.scoreSliceLabel}`}
                      >
                        {reference.scoreLabel} · {reference.scoreSliceLabel}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : highlightedContribution ? (
            <div className={`${styles.focusNotice} ${styles.focusMissing}`}>
              <div>
                <span className={styles.sectionLabel}>Exact record outside current slice</span>
                <p>
                  This page was opened for the exact contribution{" "}
                  <strong>{highlightedContribution.title}</strong>, but the active
                  ledger filters are hiding it right now.
                </p>
              </div>
              <div className={styles.focusActions}>
                <button
                  className={styles.filterReset}
                  onClick={() => revealExactContribution(highlightedContribution)}
                  type="button"
                >
                  Show exact record entry
                </button>
              </div>
              {highlightedContributionInterpretation ? (
                <div className={styles.focusReferenceBlock}>
                  <span className={styles.sectionLabel}>
                    {highlightedContributionInterpretation.label}
                  </span>
                  <p>{highlightedContributionInterpretation.note}</p>
                </div>
              ) : null}
              {highlightedSourceSummaryReference || alternateHighlightedSummaryReferences.length ? (
                <div className={styles.focusReferenceBlock}>
                  {highlightedSourceSummaryReference ? (
                    <>
                      <span className={styles.sectionLabel}>Returned from summary</span>
                      <div className={styles.summaryReferenceList}>
                        <a
                          className={styles.summaryReferenceLink}
                          href={getSummaryReferenceHref(
                            highlightedSourceSummaryReference.href,
                            activeScoreLabel,
                            activeScoreSliceLabel,
                            activeIntakeId,
                            activePilotInquiry,
                          )}
                        >
                          {highlightedSourceSummaryReference.label}
                        </a>
                      </div>
                    </>
                  ) : null}
                  {alternateHighlightedSummaryReferences.length ? (
                    <>
                      <span className={styles.sectionLabel}>Card summaries using this record</span>
                      <div className={styles.summaryReferenceList}>
                        {alternateHighlightedSummaryReferences.map((reference) => (
                          <a
                            className={styles.summaryReferenceLink}
                            href={getSummaryReferenceHref(
                              reference.href,
                              activeScoreLabel,
                              activeScoreSliceLabel,
                              activeIntakeId,
                              activePilotInquiry,
                            )}
                            key={`hidden-focus-${highlightedContribution.id}-${reference.href}-${reference.label}`}
                          >
                            {reference.label}
                          </a>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
              ) : null}
              {alternateHighlightedScoreReferences.length ? (
                <div className={styles.focusReferenceBlock}>
                  <span className={styles.sectionLabel}>
                    {activeScoreLabel
                      ? "Also used by scorecard"
                      : "Scorecard items using this record"}
                  </span>
                  <div className={styles.summaryReferenceList}>
                    {alternateHighlightedScoreReferences.map((reference) => (
                      <a
                        className={styles.summaryReferenceLink}
                        href={getScoreReferenceHref(
                          pathname,
                          searchParams,
                          reference.scoreLabel,
                          reference.scoreSliceLabel,
                        )}
                        key={`hidden-focus-score-${highlightedContribution.id}-${reference.scoreLabel}-${reference.scoreSliceLabel}`}
                      >
                        {reference.scoreLabel} · {reference.scoreSliceLabel}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : highlightedContributionId ? (
            <div className={`${styles.focusNotice} ${styles.focusMissing}`}>
              <div>
                <span className={styles.sectionLabel}>Exact record unavailable</span>
                <p>
                  This public-record link points to a contribution that is not in the
                  current visible ledger right now. The surrounding slice is still
                  shown below.
                </p>
              </div>
            </div>
          ) : null}
          <div className={styles.filterSection}>
            <span className={styles.sectionLabel}>Record view</span>
            <div className={styles.filterList}>
              {(Object.keys(contributionFilterLabels) as ContributionFilter[]).map((filter) => (
                <button
                  className={
                    activeFilter === filter ? styles.activeFilterChip : styles.filterChip
                  }
                  key={filter}
                  onClick={() => handleFilterPick(filter)}
                  type="button"
                >
                  {contributionFilterLabels[filter]} {filterCounts[filter]}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.filterSection}>
            <span className={styles.sectionLabel}>Attachment target</span>
            <div className={styles.filterList}>
              {(
                Object.keys(
                  contributionAttachmentFilterLabels,
                ) as ContributionAttachmentFilter[]
              ).map((filter) => (
                <button
                  className={
                    activeAttachmentFilter === filter
                      ? styles.activeFilterChip
                      : styles.filterChip
                  }
                  key={filter}
                  onClick={() => handleAttachmentFilterPick(filter)}
                  type="button"
                >
                  {contributionAttachmentFilterLabels[filter]}{" "}
                  {attachmentFilterCounts[filter]}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.filterSection}>
            <span className={styles.sectionLabel}>Review status</span>
            <div className={styles.filterList}>
              {(Object.keys(contributionStatusFilterLabels) as ContributionStatusFilter[]).map(
                (filter) => (
                  <button
                    className={
                      activeStatusFilter === filter
                        ? styles.activeFilterChip
                        : styles.filterChip
                    }
                    key={filter}
                    onClick={() => handleStatusFilterPick(filter)}
                    type="button"
                  >
                    {contributionStatusFilterLabels[filter]} {statusFilterCounts[filter]}
                  </button>
                ),
              )}
            </div>
          </div>
          <div className={styles.filterSection}>
            <span className={styles.sectionLabel}>Contribution origin</span>
            <div className={styles.filterList}>
              {(Object.keys(contributionOriginFilterLabels) as ContributionOriginFilter[]).map(
                (filter) => (
                  <button
                    className={
                      activeOriginFilter === filter
                        ? styles.activeFilterChip
                        : styles.filterChip
                    }
                    key={filter}
                    onClick={() => handleOriginFilterPick(filter)}
                    type="button"
                  >
                    {contributionOriginFilterLabels[filter]} {originFilterCounts[filter]}
                  </button>
                ),
              )}
            </div>
          </div>
          <div className={styles.filterSection}>
            <span className={styles.sectionLabel}>Debate lane</span>
            <div className={styles.filterList}>
              {(["all-lanes", ...(Object.keys(debateLaneLabels) as DebateLane[])] as ContributionLaneFilter[]).map(
                (filter) => (
                  <button
                    className={
                      activeLaneFilter === filter
                        ? styles.activeFilterChip
                        : styles.filterChip
                    }
                    key={filter}
                    onClick={() => handleLaneFilterPick(filter)}
                    type="button"
                  >
                    {getContributionLaneFilterLabel(filter)} {laneFilterCounts[filter]}
                  </button>
                ),
              )}
            </div>
          </div>
          <p className={styles.filterNote}>
            Showing {filteredContributions.length} of {originFilteredContributions.length} visible
            contribution{originFilteredContributions.length === 1 ? "" : "s"} in the current
            record scope.
          </p>
          <div className={styles.filterSummaryRow}>
            <p className={styles.filterSummary}>
              Viewing slice: <strong>{activeLedgerSliceLabel}</strong>
            </p>
            {hasActiveLedgerFilters ? (
              <button
                className={styles.filterReset}
                onClick={resetLedgerFilters}
                type="button"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        </div>

        {filteredContributions.length ? (
          <div className={styles.contributionList}>
            {filteredContributions.map((item) => {
              const statusClassName = `status${getStatusClassName(item.status)}`;
              const proposedAttachmentPoint = formatAttachmentPoint(
                item.aiIntake?.suggestedAssignmentKind,
                item.aiIntake?.suggestedAssignmentLabel,
              );
              const reviewedAttachmentPoint = formatAttachmentPoint(
                item.review?.assignedToKind,
                item.review?.assignedToLabel,
              );
              const visibleAttachmentPoint =
                reviewedAttachmentPoint ?? proposedAttachmentPoint ?? "None yet";
              const structurerRead = getCompletedReader(item, "openai");
              const criticRead = getCompletedReader(item, "anthropic");
              const changedCardValue =
                item.review?.changedSynthesis ?? item.aiIntake?.changedSynthesisLikely;
              const summaryReferencesForItem = summaryReferences[item.id] ?? [];
              const scoreReferencesForItem = scoreReferences[item.id] ?? [];

              return (
                <article
                  className={styles.contributionCard}
                  id={`contribution-${item.id}`}
                  key={item.id}
                >
                  <div className={styles.contributionMeta}>
                    {item.isSeedExample ? (
                      <span className={styles.seedLabel}>Prototype example</span>
                    ) : (
                      <span className={styles.originLabel}>
                        {contributionOriginFilterLabels[getContributionOrigin(item)]}
                      </span>
                    )}
                    <span className={styles.laneLabel}>
                      {getDebateLaneLabel(item.lane)}
                    </span>
                    <span className={styles[statusClassName]}>
                      {statusLabels[item.status]}
                    </span>
                  </div>

                  <h3>{item.title}</h3>
                  {item.draftSource ? (
                    <div className={styles.recordSection}>
                      <span className={styles.sectionLabel}>AI provenance</span>
                      <dl className={styles.recordGrid}>
                        <div className={styles.recordRow}>
                          <dt>Source AI</dt>
                          <dd>
                            {item.draftSource.providerLabel} ({item.draftSource.model})
                          </dd>
                        </div>
                        <div className={styles.recordRow}>
                          <dt>Generated</dt>
                          <dd>{formatTimestamp(item.draftSource.generatedAt)}</dd>
                        </div>
                        {item.draftSource.messageId ? (
                          <div className={styles.recordRow}>
                            <dt>Source AI turn</dt>
                            <dd>
                              <a
                                className={styles.sourceLink}
                                href={getSourceAiTurnHref(
                                  pathname,
                                  searchParams,
                                  item.draftSource.messageId,
                                )}
                              >
                                Open source AI turn
                              </a>
                            </dd>
                          </div>
                        ) : null}
                        {item.draftSource.question ? (
                          <div className={styles.recordRow}>
                            <dt>Originating prompt</dt>
                            <dd>{item.draftSource.question}</dd>
                          </div>
                        ) : null}
                      </dl>
                    </div>
                  ) : null}
                  <p className={styles.contributionBody}>{item.body}</p>

                  <div className={styles.recordSection}>
                    <span className={styles.sectionLabel}>Contribution record</span>
                    <dl className={styles.recordGrid}>
                      <div className={styles.recordRow}>
                        <dt>Recorded</dt>
                        <dd>{formatTimestamp(item.createdAt)}</dd>
                      </div>
                      <div className={styles.recordRow}>
                        <dt>Contribution origin</dt>
                        <dd>{contributionOriginFilterLabels[getContributionOrigin(item)]}</dd>
                      </div>
                      <div className={styles.recordRow}>
                        <dt>Submission type</dt>
                        <dd>{getSubmissionRecordType(item)}</dd>
                      </div>
                      <div className={styles.recordRow}>
                        <dt>Admin / review note</dt>
                        <dd>{getAdminReviewNote(item)}</dd>
                      </div>
                      <div className={styles.recordRow}>
                        <dt>Attachment target</dt>
                        <dd>{visibleAttachmentPoint}</dd>
                      </div>
                      <div className={styles.recordRow}>
                        <dt>Whether it changed the card</dt>
                        <dd>{getChangedCardLabel(changedCardValue)}</dd>
                      </div>
                    </dl>
                  </div>

                  {summaryReferencesForItem.length ? (
                    <div className={styles.recordSection}>
                      <span className={styles.sectionLabel}>Card summaries using this record</span>
                      <div className={styles.summaryReferenceList}>
                        {summaryReferencesForItem.map((reference) => (
                          <a
                            className={styles.summaryReferenceLink}
                            href={getSummaryReferenceHref(
                              reference.href,
                              activeScoreLabel,
                              activeScoreSliceLabel,
                              activeIntakeId,
                              activePilotInquiry,
                            )}
                            key={`${item.id}-${reference.href}-${reference.label}`}
                          >
                            {reference.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {scoreReferencesForItem.length ? (
                    <div className={styles.recordSection}>
                      <span className={styles.sectionLabel}>Scorecard items using this record</span>
                      <div className={styles.summaryReferenceList}>
                        {scoreReferencesForItem.map((reference) => (
                          <a
                            className={styles.summaryReferenceLink}
                            href={getScoreReferenceHref(
                              pathname,
                              searchParams,
                              reference.scoreLabel,
                              reference.scoreSliceLabel,
                            )}
                            key={`${item.id}-${reference.scoreLabel}-${reference.scoreSliceLabel}`}
                          >
                            {reference.scoreLabel} · {reference.scoreSliceLabel}
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}

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

                  {item.evidenceDocument ? (
                    <div className={styles.recordSection}>
                      <span className={styles.sectionLabel}>Uploaded document</span>
                      <a
                        className={styles.sourceLink}
                        href={item.evidenceDocument.downloadHref}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {item.evidenceDocument.fileName}
                      </a>
                      <p className={styles.metaNote}>
                        {item.evidenceDocument.mimeType} · {formatBytes(item.evidenceDocument.sizeBytes)}
                      </p>
                      <p className={styles.metaNote}>
                        Extraction status: {item.evidenceDocument.extraction.status}
                        {item.evidenceDocument.extraction.pageCount
                          ? ` · ${item.evidenceDocument.extraction.pageCount} pages`
                          : ""}
                        {item.evidenceDocument.extraction.wordCount
                          ? ` · ${item.evidenceDocument.extraction.wordCount} words`
                          : ""}
                      </p>
                      {item.evidenceDocument.extraction.note ? (
                        <p className={styles.metaNote}>{item.evidenceDocument.extraction.note}</p>
                      ) : null}
                      {item.evidenceDocument.extraction.excerpt ? (
                        <p className={styles.contributionBody}>
                          {item.evidenceDocument.extraction.excerpt}
                        </p>
                      ) : null}
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
                        <div className={styles.recordRow}>
                          <dt>Proposed attachment point</dt>
                          <dd>{proposedAttachmentPoint ?? "None yet"}</dd>
                        </div>
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

                      {item.review.publicRecordNote ? (
                        <div className={styles.reviewCopy}>
                          <span className={styles.sectionLabel}>Public record note</span>
                          <p>{item.review.publicRecordNote}</p>
                        </div>
                      ) : null}

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
        ) : contributions.length ? (
          <p className={styles.loadingNote}>
            No visible contributions match the <strong>{contributionFilterLabels[activeFilter]}</strong>{" "}
            record view
            {activeAttachmentFilter !== "all-targets" ? (
              <>
                {" "}for the{" "}
                <strong>{contributionAttachmentFilterLabels[activeAttachmentFilter]}</strong>{" "}
                attachment target
              </>
            ) : null}
            . Try another ledger slice to inspect a different part of the
            topic&apos;s public reasoning trace.
          </p>
        ) : (
          <p className={styles.loadingNote}>
            No contributions are visible on this topic card yet. The first strong
            objection, evidence item, correction, or nuance here will become part
            of the public review record rather than disappearing into a feed.
          </p>
        )}
      </section>
    </>
  );
}
