import type { IssueRoomSlug } from "./civic-logos";
import type {
  Contribution,
  PublicContribution,
} from "./contribution-types";
import { toPublicContributionRecord } from "./contribution-types";
import type { DebateLane } from "./reasoning-types";

type ListContributionFilters = {
  roomSlug?: IssueRoomSlug;
  topicId?: string;
  limit?: number;
  status?: string;
  lane?: DebateLane;
};

const healthcarePreviousSynthesis =
  "The United States can reduce healthcare cost and access friction by standardizing administrative flows, using AI-assisted intake and triage for low-risk routing, and reinvesting verified savings into primary and preventive care.";

const healthcareNarrowedSynthesis =
  "Administrative simplification and AI-assisted triage remain plausible healthcare reform levers, but the card should not treat net savings, access gains, or clinician-time recovery as established until administrative-cost baselines, transition costs, savings-capture rules, human-escalation thresholds, and provider-time impacts are attached to evidence.";

const healthcareFounderMaintainerRevision: Contribution = {
  id: "contribution:healthcare-topic-001:founder-synthesis-narrowing",
  roomSlug: "healthcare",
  topicId: "topic-001",
  topicTitle: "Administrative Simplification and AI-Assisted Triage",
  lane: "correction",
  title: "Founder synthesis narrowed around verified savings and implementation burden",
  body: "The visible synthesis should be narrowed so the card does not treat net savings, access gains, or clinician-time recovery as established before administrative-cost baselines, transition costs, savings-capture rules, human-escalation thresholds, and provider-time impacts are attached to evidence.",
  author: {
    name: "Civic Logos founder-maintainer",
    expertise: "Founder-maintainer synthesis revision",
  },
  status: "incorporated",
  createdAt: "2026-05-24T00:02:00.000Z",
  updatedAt: "2026-05-24T00:10:00.000Z",
  aiIntake: {
    state: "completed",
    summary:
      "AI readers treated the maintainer revision as a claim-structure correction: the card should preserve administrative simplification and AI-assisted triage as plausible levers while making cost, access, escalation, savings-capture, and provider-time evidence burdens explicit.",
    suggestedAssignmentKind: "claim",
    suggestedAssignmentLabel: "Visible healthcare topic synthesis",
    laneFit: "correction",
    changedSynthesisLikely: true,
    reviewerNote:
      "AI output is advisory. Human review decides whether the narrowed synthesis moves the public record.",
    providers: [
      {
        provider: "openai",
        state: "completed",
        model: "configured OpenAI reasoning model",
        summary:
          "The proposed narrowing is structurally better because it changes the claim from an established savings assertion to a bounded hypothesis requiring baselines, transition costs, savings-capture rules, escalation thresholds, and provider-time evidence.",
        suggestedAssignmentKind: "claim",
        suggestedAssignmentLabel: "Visible healthcare topic synthesis",
        laneFit: "correction",
        changedSynthesisLikely: true,
        reviewerNote:
          "The revision should be incorporated only as a narrower public synthesis, not as evidence that the reform levers are proven.",
      },
      {
        provider: "anthropic",
        state: "completed",
        model: "configured Claude reasoning model",
        summary:
          "The revision reduces overclaiming, but the ledger should keep unresolved pressure visible: baseline costs, transition costs, safety thresholds, provider-time effects, and the distribution of savings remain open.",
        suggestedAssignmentKind: "claim",
        suggestedAssignmentLabel: "Visible healthcare topic synthesis",
        laneFit: "correction",
        changedSynthesisLikely: true,
        reviewerNote:
          "The public record should show the unresolved evidence burdens that remain after the revision.",
      },
    ],
  },
  review: {
    reviewerLabel: "Prototype human reviewer",
    reviewerDisclosureNote:
      "Internal prototype reviewer used to demonstrate the review path before external reviewer governance is formalized.",
    reviewerConflictNote:
      "Reviewer is part of the Civic Logos prototype fixture and has project-level alignment; this is not an independent external review.",
    assignedToKind: "claim",
    assignedToLabel: "Visible healthcare topic synthesis",
    changedSynthesis: true,
    publicRecordNote:
      "This is a founder-maintainer revision, not an outside public submission. It narrows the visible synthesis after AI-assisted review and human incorporation.",
    decisionReason:
      "Incorporated because the revision makes the topic more falsifiable and prevents overclaiming savings, access gains, or clinician-time recovery before evidence is attached.",
    reviewerNote:
      "This revision narrows the card to avoid overclaiming. It keeps the topic alive while making the evidence burden and implementation risk more explicit.",
    revisionSummary:
      "Narrowed the healthcare synthesis from a plausible savings/access reform claim to a conditional claim that requires evidence on administrative-cost baselines, transition costs, savings-capture rules, human-escalation thresholds, and provider-time impacts.",
    synthesisUpdate: healthcareNarrowedSynthesis,
    reviewedAt: "2026-05-24T00:09:00.000Z",
    publicRecordSnapshot: {
      previousSynthesis: healthcarePreviousSynthesis,
      newSynthesis: healthcareNarrowedSynthesis,
      timestamp: "2026-05-24T00:10:00.000Z",
      origin: "founder-maintainer",
      creatorLabel:
        "Civic Logos founder-maintainer - Founder-maintainer synthesis revision",
      reviewerLabel: "Prototype human reviewer",
      reviewerDisclosureNote:
        "Internal prototype reviewer used to demonstrate the review path before external reviewer governance is formalized.",
      reviewerConflictNote:
        "Reviewer is part of the Civic Logos prototype fixture and has project-level alignment; this is not an independent external review.",
      status: "incorporated",
      actualCardChange: true,
      attachmentTargets: [
        "claim - Visible healthcare topic synthesis",
        "assumption - Savings capture must be evidenced before net savings are treated as established",
        "open-question - What evidence would establish net savings after transition costs?",
      ],
      reviewerNote:
        "This revision narrows the card to avoid overclaiming. It keeps the topic alive while making the evidence burden and implementation risk more explicit.",
      decisionReason:
        "Incorporated because the revision makes the topic more falsifiable and prevents overclaiming savings, access gains, or clinician-time recovery before evidence is attached.",
      publicRecordNote:
        "This is a founder-maintainer revision, not an outside public submission. It narrows the visible synthesis after AI-assisted review and human incorporation.",
      revisionSummary:
        "Narrowed the healthcare synthesis from a plausible savings/access reform claim to a conditional claim that requires evidence on administrative-cost baselines, transition costs, savings-capture rules, human-escalation thresholds, and provider-time impacts.",
      aiReaderStatus: "OpenAI: completed; Claude: completed",
      versionLabel: "v0.2",
      linkedRecordId: "contribution:healthcare-topic-001:founder-synthesis-narrowing",
      affectedVisibleLayers: [
        "Recent Contributions / Ledger",
        "Review Cycle",
        "Changed-card records",
        "Revision Trace",
        "Current visible synthesis",
        "Synthesis layer",
      ],
      revisionEventId: "revision:healthcare-topic-001:founder-narrowing-v0-2",
      humanReviewDecisionId: "review:healthcare-topic-001:founder-narrowing",
      previousSynthesisSnapshotId: "snapshot:healthcare-topic-001:v0.1",
      newSynthesisSnapshotId: "snapshot:healthcare-topic-001:v0.2",
      unresolvedAfterRevision: [
        "Administrative-cost baselines are still not attached to evidence.",
        "Transition costs remain unresolved.",
        "Savings-capture rules remain unresolved.",
        "Human escalation thresholds for AI-assisted triage remain unresolved.",
        "Provider-time impacts remain unresolved.",
      ],
    },
  },
};

const canonicalContributions = [healthcareFounderMaintainerRevision] as const;
const canonicalPublicContributions = canonicalContributions.map(
  toPublicContributionRecord,
);

function matchesFilters(
  contribution: Pick<Contribution, "roomSlug" | "topicId" | "status" | "lane">,
  filters: ListContributionFilters,
) {
  if (filters.roomSlug && contribution.roomSlug !== filters.roomSlug) {
    return false;
  }

  if (filters.topicId && contribution.topicId !== filters.topicId) {
    return false;
  }

  if (filters.status && contribution.status !== filters.status) {
    return false;
  }

  if (filters.lane && contribution.lane !== filters.lane) {
    return false;
  }

  return true;
}

function sortNewestFirst<T extends { createdAt: string }>(items: readonly T[]) {
  return [...items].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

export function getCanonicalContributionById(id: string) {
  return canonicalContributions.find((item) => item.id === id) ?? null;
}

export function mergeCanonicalAllContributions(
  contributions: readonly Contribution[],
  filters: ListContributionFilters = {},
) {
  const merged = new Map<string, Contribution>();

  for (const contribution of contributions) {
    if (matchesFilters(contribution, filters)) {
      merged.set(contribution.id, contribution);
    }
  }

  for (const contribution of canonicalContributions) {
    if (matchesFilters(contribution, filters)) {
      merged.set(contribution.id, contribution);
    }
  }

  const sorted = sortNewestFirst([...merged.values()]);

  return typeof filters.limit === "number" ? sorted.slice(0, filters.limit) : sorted;
}

export function mergeCanonicalPublicContributions(
  contributions: readonly PublicContribution[],
  filters: ListContributionFilters = {},
) {
  const merged = new Map<string, PublicContribution>();

  for (const contribution of contributions) {
    if (matchesFilters(contribution, filters)) {
      merged.set(contribution.id, contribution);
    }
  }

  for (const contribution of canonicalPublicContributions) {
    if (matchesFilters(contribution, filters)) {
      merged.set(contribution.id, contribution);
    }
  }

  return sortNewestFirst([...merged.values()]).slice(0, filters.limit ?? 12);
}
