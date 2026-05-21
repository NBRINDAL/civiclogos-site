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

export type AssistedDraftSource = {
  provider: AiProvider;
  providerLabel: string;
  model: string;
  question: string;
  generatedAt: string;
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
  assignedToKind?: ReviewTargetKind;
  assignedToLabel?: string;
  changedSynthesis?: boolean | null;
  publicRecordNote?: string;
  decisionReason?: string;
  reviewerNote?: string;
  reviewedAt?: string;
};

export type Contribution = TopicCardReference & {
  id: string;
  lane: DebateLane;
  title: string;
  body: string;
  evidenceSource?: EvidenceSource | null;
  evidenceDocument?: EvidenceDocument | null;
  author: ContributionAuthor;
  draftSource?: AssistedDraftSource;
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
  evidenceDocument?: EvidenceDocument | null;
  author: ContributionAuthor;
  draftSource?: AssistedDraftSource;
};

export type ReviewContributionInput = {
  status: ReviewStatus;
  assignedToKind?: ReviewTargetKind;
  assignedToLabel?: string;
  changedSynthesis?: boolean | null;
  publicRecordNote?: string;
  decisionReason?: string;
  reviewerNote?: string;
};

export type PublicContribution = Omit<Contribution, "author"> & {
  author: Omit<ContributionAuthor, "email">;
};

export type ContributionStoreDocument = {
  prototype: true;
  note: string;
  updatedAt: string;
  contributions: Contribution[];
};
