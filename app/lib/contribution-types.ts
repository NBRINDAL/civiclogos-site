import type { IssueRoomSlug } from "./civic-logos";
import type {
  DebateLane,
  EvidenceSource,
  ReviewStatus,
  ReviewTargetKind,
} from "./reasoning-types";

export type TopicCardReference = {
  roomSlug: IssueRoomSlug;
  topicId: string;
  topicTitle: string;
};

export type AiProvider = "openai" | "anthropic";

export type ContributionAuthor = {
  name?: string;
  email?: string;
  expertise?: string;
};

export const contributionReferralSources = [
  "Redacted",
  "Tucker Carlson Network",
  "YouTube",
  "X / Twitter",
  "Substack",
  "Friend",
  "Other",
] as const;

export type ContributionReferralSource = (typeof contributionReferralSources)[number];

export function normalizeContributionReferralSource(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return contributionReferralSources.find((item) => item === trimmed);
}

export type AssistedDraftSource = {
  messageId?: string;
  provider: AiProvider;
  providerLabel: string;
  model: string;
  question: string;
  generatedAt: string;
};

export type ReviewChallengeSource = {
  contributionId: string;
  source: "review-decision";
  sourceTitle?: string;
  createdAt: string;
};

export type EvidenceExtraction = {
  status: "completed" | "unavailable" | "error";
  excerpt?: string;
  wordCount?: number;
  pageCount?: number;
  note?: string;
};

export type EvidenceDocument = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  downloadHref: string;
  extraction: EvidenceExtraction;
};

export type ProviderContributionAiIntake = {
  provider: AiProvider;
  state: "completed" | "unavailable" | "error";
  model?: string;
  summary?: string;
  suggestedAssignmentKind?: ReviewTargetKind;
  suggestedAssignmentLabel?: string;
  laneFit?: DebateLane;
  changedSynthesisLikely?: boolean | null;
  reviewerNote?: string;
  errorMessage?: string;
};

export type ContributionAiIntake = {
  state: "completed" | "partial" | "unavailable" | "error";
  summary?: string;
  suggestedAssignmentKind?: ReviewTargetKind;
  suggestedAssignmentLabel?: string;
  laneFit?: DebateLane;
  changedSynthesisLikely?: boolean | null;
  reviewerNote?: string;
  providers: ProviderContributionAiIntake[];
};

export type ContributionReview = {
  reviewerLabel?: string;
  reviewerDisclosureNote?: string;
  reviewerConflictNote?: string;
  assignedToKind?: ReviewTargetKind;
  assignedToLabel?: string;
  changedSynthesis?: boolean | null;
  publicRecordNote?: string;
  decisionReason?: string;
  reviewerNote?: string;
  revisionSummary?: string;
  synthesisUpdate?: string;
  publicRecordSnapshot?: PublicRecordSnapshot;
  reviewedAt?: string;
};

export type PublicRecordSnapshot = {
  previousSynthesis: string;
  newSynthesis: string;
  timestamp: string;
  origin: string;
  creatorLabel: string;
  reviewerLabel?: string;
  reviewerDisclosureNote?: string;
  reviewerConflictNote?: string;
  status: ReviewStatus;
  actualCardChange: boolean;
  attachmentTargets: string[];
  reviewerNote?: string;
  decisionReason?: string;
  publicRecordNote?: string;
  revisionSummary?: string;
  aiReaderStatus: string;
  versionLabel: string;
  linkedRecordId: string;
  affectedVisibleLayers: string[];
  revisionEventId?: string;
  humanReviewDecisionId?: string;
  previousSynthesisSnapshotId?: string;
  newSynthesisSnapshotId?: string;
  unresolvedAfterRevision?: string[];
};

export type Contribution = TopicCardReference & {
  id: string;
  lane: DebateLane;
  title: string;
  body: string;
  evidenceSource?: EvidenceSource | null;
  evidenceExcerpt?: string;
  evidenceDocument?: EvidenceDocument | null;
  author: ContributionAuthor;
  referralSource?: ContributionReferralSource;
  draftSource?: AssistedDraftSource;
  reviewChallengeSource?: ReviewChallengeSource;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  isSeedExample?: boolean;
  aiIntake?: ContributionAiIntake;
  review?: ContributionReview;
};

export type CreateContributionInput = TopicCardReference & {
  lane: DebateLane;
  title: string;
  body: string;
  evidenceSource?: EvidenceSource | null;
  evidenceExcerpt?: string;
  evidenceDocument?: EvidenceDocument | null;
  author: ContributionAuthor;
  referralSource?: ContributionReferralSource;
  draftSource?: AssistedDraftSource;
  reviewChallengeSource?: ReviewChallengeSource;
};

export type ReviewContributionInput = {
  status: ReviewStatus;
  reviewerLabel?: string;
  reviewerDisclosureNote?: string;
  reviewerConflictNote?: string;
  assignedToKind?: ReviewTargetKind;
  assignedToLabel?: string;
  changedSynthesis?: boolean | null;
  publicRecordNote?: string;
  decisionReason?: string;
  reviewerNote?: string;
  revisionSummary?: string;
  synthesisUpdate?: string;
  publicRecordSnapshot?: PublicRecordSnapshot;
};

export type PublicContribution = Omit<Contribution, "author" | "referralSource"> & {
  author: Omit<ContributionAuthor, "email">;
};

export function toPublicContributionRecord(item: Contribution): PublicContribution {
  return {
    id: item.id,
    roomSlug: item.roomSlug,
    topicId: item.topicId,
    topicTitle: item.topicTitle,
    lane: item.lane,
    title: item.title,
    body: item.body,
    evidenceSource: item.evidenceSource,
    evidenceExcerpt: item.evidenceExcerpt,
    evidenceDocument: item.evidenceDocument,
    author: {
      name: item.author.name,
      expertise: item.author.expertise,
    },
    draftSource: item.draftSource,
    reviewChallengeSource: item.reviewChallengeSource,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    isSeedExample: item.isSeedExample,
    aiIntake: item.aiIntake,
    review: item.review,
  };
}

export type ContributionStoreDocument = {
  prototype: true;
  note: string;
  updatedAt: string;
  contributions: Contribution[];
};
