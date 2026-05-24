import { isActualCardChange } from "./contribution-impact";
import type {
  PublicContribution,
  PublicRecordSnapshot,
  ReviewContributionInput,
} from "./contribution-types";
import { getContributionOrigin } from "./contribution-origin";
import type { TopicCardData } from "./civic-logos";

export const publicRecordConfirmationPhrase =
  "I understand this will change the visible public reasoning record.";

function getRevisionTimestamp(contribution: PublicContribution) {
  return (
    contribution.review?.publicRecordSnapshot?.timestamp ??
    contribution.review?.reviewedAt ??
    contribution.updatedAt ??
    contribution.createdAt
  );
}

export function getCurrentVisibleSynthesis({
  baseSynthesis,
  contributions,
  excludeRecordId,
}: {
  baseSynthesis: string;
  contributions: readonly PublicContribution[];
  excludeRecordId?: string;
}) {
  const latestRevision = [...contributions]
    .filter(
      (item) =>
        item.id !== excludeRecordId &&
        isActualCardChange(item) &&
        item.review?.synthesisUpdate,
    )
    .sort(
      (left, right) =>
        new Date(getRevisionTimestamp(right)).getTime() -
        new Date(getRevisionTimestamp(left)).getTime(),
    )[0];

  return latestRevision?.review?.synthesisUpdate ?? baseSynthesis;
}

export function getNextPublicRecordVersionLabel({
  card,
  contributions,
}: {
  card: TopicCardData;
  contributions: readonly PublicContribution[];
}) {
  const priorSnapshotCount = contributions.filter(
    (item) => item.review?.publicRecordSnapshot,
  ).length;

  return `v0.${card.revisionHistory.length + priorSnapshotCount + 1}`;
}

export function getAiReaderStatus(contribution: PublicContribution) {
  const providers = contribution.aiIntake?.providers ?? [];

  if (!providers.length) {
    return "No AI reader output attached";
  }

  return providers
    .map((provider) => {
      const label = provider.provider === "openai" ? "OpenAI" : "Claude";
      return `${label}: ${provider.state}`;
    })
    .join("; ");
}

export function getAttachmentTargets(input: {
  assignedToKind?: string | null;
  assignedToLabel?: string | null;
}) {
  const target = [input.assignedToKind, input.assignedToLabel]
    .filter(Boolean)
    .join(" - ");

  return target ? [target] : ["Not assigned yet"];
}

export function getAffectedVisibleLayers(input: {
  assignedToKind?: string | null;
  changedSynthesis?: boolean | null;
  hasSynthesisUpdate?: boolean;
}) {
  const layers = ["Recent Contributions / Ledger", "Review Cycle"];

  if (input.changedSynthesis === true) {
    layers.push("Changed-card records", "Revision Trace");
  }

  if (input.hasSynthesisUpdate) {
    layers.push("Current visible synthesis");
  }

  if (input.assignedToKind === "evidence") {
    layers.push("Evidence layer");
  } else if (input.assignedToKind === "assumption") {
    layers.push("Assumption layer");
  } else if (input.assignedToKind === "objection") {
    layers.push("Objection layer");
  } else if (input.assignedToKind === "open-question") {
    layers.push("Open-question layer");
  }

  return [...new Set(layers)];
}

export function buildPublicRecordSnapshot({
  contribution,
  input,
  previousSynthesis,
  timestamp,
  versionLabel,
}: {
  contribution: PublicContribution;
  input: ReviewContributionInput;
  previousSynthesis: string;
  timestamp: string;
  versionLabel: string;
}): PublicRecordSnapshot {
  const newSynthesis = input.synthesisUpdate || previousSynthesis;
  const creatorLabel = [contribution.author.name, contribution.author.expertise]
    .filter(Boolean)
    .join(" - ");

  return {
    previousSynthesis,
    newSynthesis,
    timestamp,
    origin: getContributionOrigin(contribution),
    creatorLabel: creatorLabel || "Unknown contributor",
    reviewerLabel: input.reviewerLabel,
    reviewerDisclosureNote: input.reviewerDisclosureNote,
    reviewerConflictNote: input.reviewerConflictNote,
    status: input.status,
    actualCardChange: input.changedSynthesis === true,
    attachmentTargets: getAttachmentTargets(input),
    reviewerNote: input.reviewerNote,
    decisionReason: input.decisionReason,
    publicRecordNote: input.publicRecordNote,
    revisionSummary: input.revisionSummary,
    aiReaderStatus: getAiReaderStatus(contribution),
    versionLabel,
    linkedRecordId: contribution.id,
    affectedVisibleLayers: getAffectedVisibleLayers({
      assignedToKind: input.assignedToKind,
      changedSynthesis: input.changedSynthesis,
      hasSynthesisUpdate: Boolean(input.synthesisUpdate),
    }),
  };
}
