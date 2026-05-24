import { createHash } from "node:crypto";
import {
  getRoomTopicCard,
  issueRooms,
  type IssueRoomSlug,
  type TopicCardData,
} from "./civic-logos";
import { getContributionCountSummary } from "./contribution-counts";
import { isActualCardChange } from "./contribution-impact";
import { getContributionOrigin } from "./contribution-origin";
import {
  getContributionStoreMetadata,
  listPublicContributions,
} from "./contribution-store";
import type {
  EvidenceDocument,
  PublicContribution,
  ProviderContributionAiIntake,
} from "./contribution-types";
import type {
  DebateLane,
  EvidenceSource,
  ReviewStatus,
  ReviewTargetKind,
} from "./reasoning-types";

type ProtocolAttachmentTargetType =
  | "claim"
  | "evidence"
  | "objection"
  | "assumption"
  | "open_question"
  | "synthesis"
  | "scorecard"
  | "metric"
  | "stakeholder_map"
  | "revision_history"
  | "none";

type ProtocolContributionState =
  | "draft"
  | "submitted"
  | "classified"
  | "ai_reviewed"
  | "needs_human_review"
  | "accepted"
  | "incorporated"
  | "rejected"
  | "archived"
  | "superseded";

const healthcareRoomSlug = "healthcare" satisfies IssueRoomSlug;
const healthcareTopicId = "topic-001";
const exportGeneratedBy = "civic-logos-reasoning-ledger-exporter-v0.1";
const baseCreatedAt = "2026-05-01T00:00:00.000Z";
const systemActorId = "actor:civic-logos-system";
const founderMaintainerActorId = "actor:civic-logos-founder-maintainer";

function protocolId(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function hashRecord(value: unknown) {
  return `sha256:${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`;
}

function mapLane(lane: DebateLane) {
  return lane.replaceAll("-", "_");
}

function mapStatus(status: ReviewStatus, contribution: PublicContribution): ProtocolContributionState {
  switch (status) {
    case "accepted":
      return "accepted";
    case "incorporated":
      return "incorporated";
    case "rejected":
      return "rejected";
    case "needs review":
      return "needs_human_review";
    case "pending":
    default:
      return contribution.aiIntake?.providers?.length ? "needs_human_review" : "submitted";
  }
}

function mapOrigin(contribution: PublicContribution) {
  const origin = getContributionOrigin(contribution);

  switch (origin) {
    case "human-submitted":
      return "outside_public_submission";
    case "founder-maintainer":
      return "founder_maintainer";
    case "founder-submitted":
      return "founder_submitted";
    case "ai-origin":
      return "ai_origin";
    case "seed-example":
    default:
      return "prototype_fixture";
  }
}

function contributionActorId(contribution: PublicContribution) {
  return `actor:${mapOrigin(contribution)}:${contribution.id}`;
}

function reviewActorId(contribution: PublicContribution) {
  return `actor:reviewer:${contribution.id}`;
}

function actorTypeForContribution(contribution: PublicContribution) {
  switch (mapOrigin(contribution)) {
    case "outside_public_submission":
      return "outside_public_contributor";
    case "founder_maintainer":
      return "founder_maintainer";
    case "founder_submitted":
      return "founder";
    case "ai_origin":
      return "ai_assisted_source";
    case "prototype_fixture":
    default:
      return "prototype_fixture";
  }
}

function mapTargetKind(kind?: ReviewTargetKind | null): ProtocolAttachmentTargetType {
  switch (kind) {
    case "claim":
    case "objection":
    case "evidence":
    case "assumption":
      return kind;
    case "open-question":
      return "open_question";
    case "unclear":
    default:
      return "none";
  }
}

function targetForContribution(
  contribution: PublicContribution,
  overrides: {
    kind?: ReviewTargetKind | null;
    label?: string | null;
    createdAt?: string;
  } = {},
) {
  const targetType = mapTargetKind(overrides.kind ?? contribution.review?.assignedToKind);
  const targetLabel =
    overrides.label ||
    contribution.review?.assignedToLabel ||
    contribution.aiIntake?.suggestedAssignmentLabel ||
    (targetType === "none" ? "No attachment target assigned yet" : contribution.title);
  const createdAt = overrides.createdAt ?? contribution.review?.reviewedAt ?? contribution.updatedAt;

  return {
    target_id: `target:${contribution.roomSlug}:${contribution.topicId}:${targetType}:${protocolId(targetLabel) || contribution.id}`,
    target_type: targetType,
    target_label: targetLabel,
    referenced_object_id: targetType === "none" ? null : contribution.id,
    created_at: createdAt,
  };
}

function synthesisTarget(card: TopicCardData) {
  return {
    target_id: `target:${healthcareRoomSlug}:${card.id}:synthesis`,
    target_type: "synthesis" as const,
    target_label: "Visible healthcare topic synthesis",
    referenced_object_id: `claim:${healthcareRoomSlug}:${card.id}:primary`,
    created_at: baseCreatedAt,
  };
}

function contributionTargets(contribution: PublicContribution, card: TopicCardData) {
  const targets = [targetForContribution(contribution)];

  if (isActualCardChange(contribution)) {
    targets.push({
      ...synthesisTarget(card),
      created_at: contribution.review?.reviewedAt ?? contribution.updatedAt,
    });
  }

  return [...new Map(targets.map((target) => [target.target_id, target])).values()];
}

function evidenceObjectsForContribution(contribution: PublicContribution) {
  const evidenceObjects = [];
  const source = contribution.evidenceSource;
  const document = contribution.evidenceDocument;

  if (source) {
    evidenceObjects.push(buildUrlEvidence(contribution, source));
  }

  if (document) {
    evidenceObjects.push(buildDocumentEvidence(contribution, document));
  }

  return evidenceObjects;
}

function buildUrlEvidence(contribution: PublicContribution, source: EvidenceSource) {
  return {
    evidence_id: `evidence:${contribution.id}:url`,
    title: source.label || contribution.title,
    source_type: "url",
    url: source.url,
    document_id: null,
    citation: source.label ?? null,
    summary: `Source link attached to contribution "${contribution.title}".`,
    submitted_by_actor_id: contributionActorId(contribution),
    public_access: "public",
    submitted_at: contribution.createdAt,
  };
}

function buildDocumentEvidence(
  contribution: PublicContribution,
  document: EvidenceDocument,
) {
  return {
    evidence_id: `evidence:${contribution.id}:document:${document.id}`,
    title: document.fileName,
    source_type: "document",
    url: document.downloadHref,
    document_id: document.id,
    citation: null,
    summary:
      document.extraction.excerpt ||
      document.extraction.note ||
      `Uploaded document attached to contribution "${contribution.title}".`,
    submitted_by_actor_id: contributionActorId(contribution),
    public_access: "public",
    submitted_at: document.uploadedAt,
  };
}

function aiReaderRole(provider: ProviderContributionAiIntake) {
  if (provider.provider === "openai") {
    return "structurer";
  }

  return "critic";
}

function aiReaderConfidence(provider: ProviderContributionAiIntake) {
  if (provider.state === "completed") {
    return 0.5;
  }

  if (provider.state === "unavailable") {
    return 0;
  }

  return 0.1;
}

function aiHumanDecisionStatus(contribution: PublicContribution) {
  if (!contribution.review) {
    return "not_reviewed";
  }

  if (contribution.status === "rejected") {
    return "rejected";
  }

  if (
    contribution.status === "accepted" ||
    contribution.status === "incorporated"
  ) {
    return "partially_accepted";
  }

  return "not_reviewed";
}

function aiReaderNotesForContribution(contribution: PublicContribution) {
  return (contribution.aiIntake?.providers ?? []).map((provider) => {
    const target = targetForContribution(contribution, {
      kind:
        provider.suggestedAssignmentKind ??
        contribution.aiIntake?.suggestedAssignmentKind,
      label:
        provider.suggestedAssignmentLabel ??
        contribution.aiIntake?.suggestedAssignmentLabel,
      createdAt: contribution.createdAt,
    });

    return {
      ai_reader_note_id: `ai-note:${contribution.id}:${provider.provider}`,
      model_provider: provider.provider === "openai" ? "OpenAI" : "Anthropic",
      model_name: provider.model ?? `${provider.provider} configured reader`,
      model_version_if_available: null,
      reader_role: aiReaderRole(provider),
      prompt_category: "classification",
      input_scope:
        "Public contribution title, body, lane, evidence link metadata if present, and current topic card context.",
      used_external_sources: false,
      source_list: [],
      output_summary:
        provider.summary ??
        provider.errorMessage ??
        contribution.aiIntake?.summary ??
        "No AI-reader summary was available for this provider.",
      proposed_lane: mapLane(provider.laneFit ?? contribution.lane),
      proposed_attachment_targets: [target],
      proposed_review_status: "needs_human_review",
      confidence: aiReaderConfidence(provider),
      limitations: [
        "Confidence is not calibrated; it is exported as a protocol placeholder until the reference implementation records calibrated confidence.",
        "The AI reader proposes structure only. It does not decide whether the public record changes.",
      ],
      human_decision_status: aiHumanDecisionStatus(contribution),
      created_at: contribution.createdAt,
    };
  });
}

function reviewDecisionForContribution(
  contribution: PublicContribution,
  revisionId: string | null,
) {
  const review = contribution.review;

  if (!review) {
    return null;
  }

  const actualCardChange = Boolean(revisionId);

  return {
    review_decision_id: `review:${contribution.id}`,
    reviewer_id: reviewActorId(contribution),
    reviewer_label: review.reviewerLabel ?? "Civic Logos maintainer review",
    reviewer_disclosure_note:
      review.reviewerDisclosureNote ??
      "Reviewer disclosure was not recorded in the legacy review object.",
    reviewer_conflict_note:
      review.reviewerConflictNote ??
      "No reviewer conflict note was recorded in the legacy review object.",
    decision_status: mapStatus(contribution.status, contribution),
    accepted_lane: mapLane(contribution.lane),
    accepted_attachment_targets: [
      targetForContribution(contribution, {
        kind: review.assignedToKind,
        label: review.assignedToLabel,
        createdAt: review.reviewedAt ?? contribution.updatedAt,
      }),
    ],
    actual_card_change: actualCardChange,
    public_record_note:
      review.publicRecordNote ??
      "Human review recorded without a public note in the legacy prototype store.",
    decision_reason:
      review.decisionReason ??
      review.reviewerNote ??
      "Human review recorded before decision-reason fields were required.",
    revision_event_id: revisionId,
    created_at: review.reviewedAt ?? contribution.updatedAt,
  };
}

function buildSnapshot({
  snapshotId,
  card,
  synthesisText,
  versionLabel,
  createdAt,
  createdByActorId,
  sourceRevisionEventId,
}: {
  snapshotId: string;
  card: TopicCardData;
  synthesisText: string;
  versionLabel: string;
  createdAt: string;
  createdByActorId: string;
  sourceRevisionEventId: string | null;
}) {
  return {
    snapshot_id: snapshotId,
    topic_id: card.id,
    claim_id: `claim:${healthcareRoomSlug}:${card.id}:primary`,
    synthesis_text: synthesisText,
    version_label: versionLabel,
    created_at: createdAt,
    created_by_actor_id: createdByActorId,
    source_revision_event_id: sourceRevisionEventId,
    content_hash: hashRecord({
      topic_id: card.id,
      synthesis_text: synthesisText,
      version_label: versionLabel,
      source_revision_event_id: sourceRevisionEventId,
    }),
    unresolved_items: [...card.openQuestions],
  };
}

function getReviewTimestamp(contribution: PublicContribution) {
  return (
    contribution.review?.publicRecordSnapshot?.timestamp ??
    contribution.review?.reviewedAt ??
    contribution.updatedAt
  );
}

function buildRevisionArtifacts(
  card: TopicCardData,
  contributions: readonly PublicContribution[],
) {
  const changedContributions = contributions
    .filter((item) => isActualCardChange(item))
    .sort(
      (left, right) =>
        new Date(getReviewTimestamp(left)).getTime() -
        new Date(getReviewTimestamp(right)).getTime(),
    );
  const synthesisSnapshots = [
    buildSnapshot({
      snapshotId: `snapshot:${healthcareRoomSlug}:${card.id}:v0.1-base`,
      card,
      synthesisText: card.thesis,
      versionLabel: "v0.1-base",
      createdAt: baseCreatedAt,
      createdByActorId: founderMaintainerActorId,
      sourceRevisionEventId: null,
    }),
  ];
  const revisionEvents: Array<{
    revision_id: string;
    topic_id: string;
    triggering_record_id: string;
    previous_synthesis_snapshot_id: string;
    new_synthesis_snapshot_id: string;
    changed_fields: string[];
    reason_for_change: string;
    reviewer_note: string;
    review_decision_id: string;
    origin: string;
    created_at: string;
    content_hash: string;
    unresolved_after_revision: string[];
  }> = [];
  const revisionIdByContributionId = new Map<string, string>();
  const exportWarnings: string[] = [];

  let previousSnapshot = synthesisSnapshots[0];

  changedContributions.forEach((contribution, index) => {
    const snapshot = contribution.review?.publicRecordSnapshot;
    const versionLabel =
      snapshot?.versionLabel ?? `export-v0.${index + 2}`;
    const revisionId = `revision:${contribution.id}`;
    const newSynthesis = snapshot?.newSynthesis ?? previousSnapshot.synthesis_text;
    const newSnapshotId = `snapshot:${healthcareRoomSlug}:${card.id}:${protocolId(versionLabel)}:${protocolId(contribution.id)}`;
    const createdAt = getReviewTimestamp(contribution);
    const changedFields = snapshot?.affectedVisibleLayers?.length
      ? snapshot.affectedVisibleLayers.map((layer) =>
          `topic.${protocolId(layer).replaceAll("-", "_")}`,
        )
      : [
          `topic.${mapTargetKind(contribution.review?.assignedToKind)}`,
          "topic.revision_history",
        ];

    if (!snapshot) {
      exportWarnings.push(
        `Contribution ${contribution.id} is a legacy changed-card record without a stored PublicRecordSnapshot. The export preserves it as a RevisionEvent with unchanged synthesis text and layer-level changed_fields.`,
      );
    }

    const nextSnapshot = buildSnapshot({
      snapshotId: newSnapshotId,
      card,
      synthesisText: newSynthesis,
      versionLabel,
      createdAt,
      createdByActorId: contributionActorId(contribution),
      sourceRevisionEventId: revisionId,
    });

    synthesisSnapshots.push(nextSnapshot);
    revisionEvents.push({
      revision_id: revisionId,
      topic_id: card.id,
      triggering_record_id: contribution.id,
      previous_synthesis_snapshot_id: previousSnapshot.snapshot_id,
      new_synthesis_snapshot_id: nextSnapshot.snapshot_id,
      changed_fields: [...new Set(changedFields)],
      reason_for_change:
        contribution.review?.decisionReason ??
        contribution.review?.publicRecordNote ??
        "Legacy review marked this contribution as changing the card.",
      reviewer_note:
        contribution.review?.reviewerNote ??
        contribution.review?.publicRecordNote ??
        "No reviewer note was recorded.",
      review_decision_id: `review:${contribution.id}`,
      origin: mapOrigin(contribution),
      created_at: createdAt,
      content_hash: hashRecord({
        contribution_id: contribution.id,
        previous_snapshot_id: previousSnapshot.snapshot_id,
        new_snapshot_id: nextSnapshot.snapshot_id,
        changed_fields: changedFields,
      }),
      unresolved_after_revision: [...card.openQuestions],
    });
    revisionIdByContributionId.set(contribution.id, revisionId);
    previousSnapshot = nextSnapshot;
  });

  return {
    synthesisSnapshots,
    revisionEvents,
    revisionIdByContributionId,
    exportWarnings,
    currentSynthesisSnapshotId: previousSnapshot.snapshot_id,
  };
}

function buildActorRecords(contributions: readonly PublicContribution[]) {
  const contributionActors = contributions.map((contribution) => ({
    actor_id: contributionActorId(contribution),
    actor_type: actorTypeForContribution(contribution),
    public_label:
      contribution.author.name ||
      contribution.author.expertise ||
      mapOrigin(contribution).replaceAll("_", " "),
    disclosure_note:
      contribution.author.expertise ||
      "Public contributor label exported without private contact metadata.",
    conflict_disclosures: contribution.isSeedExample
      ? ["Prototype fixture; not outside public uptake."]
      : contribution.draftSource
        ? ["AI-assisted source record; not a final AI judgment."]
        : [],
    created_at: contribution.createdAt,
  }));
  const reviewerActors = contributions
    .filter((contribution) => contribution.review)
    .map((contribution) => ({
      actor_id: reviewActorId(contribution),
      actor_type: "reviewer",
      public_label:
        contribution.review?.reviewerLabel ?? "Civic Logos maintainer review",
      disclosure_note:
        contribution.review?.reviewerDisclosureNote ??
        "Reviewer disclosure was not recorded in the legacy review object.",
      conflict_disclosures: [
        contribution.review?.reviewerConflictNote ??
          "No reviewer conflict note was recorded in the legacy review object.",
      ],
      created_at:
        contribution.review?.reviewedAt ?? contribution.updatedAt ?? contribution.createdAt,
    }));

  return [
    {
      actor_id: systemActorId,
      actor_type: "system",
      public_label: "Civic Logos protocol exporter",
      disclosure_note:
        "System actor that generated the public protocol-shaped ledger export.",
      conflict_disclosures: [],
      created_at: baseCreatedAt,
    },
    {
      actor_id: founderMaintainerActorId,
      actor_type: "founder_maintainer",
      public_label: "Civic Logos founder-maintainer",
      disclosure_note:
        "Maintainer-origin actor for seed topic creation and protocol stewardship.",
      conflict_disclosures: [
        "Civic Logos maintainer has project-level authorship interest.",
      ],
      created_at: baseCreatedAt,
    },
    ...contributionActors,
    ...reviewerActors,
  ];
}

export async function buildHealthcareTopic001ProtocolExport() {
  const room = issueRooms[healthcareRoomSlug];
  const card = getRoomTopicCard(healthcareRoomSlug, healthcareTopicId);

  if (!card) {
    throw new Error("Healthcare topic-001 could not be found.");
  }

  const [contributions, storeMetadata] = await Promise.all([
    listPublicContributions({
      roomSlug: healthcareRoomSlug,
      topicId: healthcareTopicId,
      limit: 50,
    }),
    getContributionStoreMetadata(),
  ]);
  const countSummary = getContributionCountSummary(contributions);
  const {
    synthesisSnapshots,
    revisionEvents,
    revisionIdByContributionId,
    exportWarnings,
    currentSynthesisSnapshotId,
  } = buildRevisionArtifacts(card, contributions);
  const allTargets = [
    synthesisTarget(card),
    ...contributions.flatMap((contribution) => contributionTargets(contribution, card)),
  ];
  const uniqueTargets = [
    ...new Map(allTargets.map((target) => [target.target_id, target])).values(),
  ];
  const evidenceObjects = contributions.flatMap(evidenceObjectsForContribution);
  const aiReaderNotes = contributions.flatMap(aiReaderNotesForContribution);
  const humanReviewDecisions = contributions
    .map((contribution) =>
      reviewDecisionForContribution(
        contribution,
        revisionIdByContributionId.get(contribution.id) ?? null,
      ),
    )
    .filter(Boolean);
  const actorRecords = buildActorRecords(contributions);

  return {
    schema_version: "civic-logos-reasoning-ledger-v0.1",
    export_status: "live_protocol_shape_from_current_civic_logos_records",
    generated_at: new Date().toISOString(),
    generated_by: exportGeneratedBy,
    source: {
      product: "Civic Logos",
      room_slug: healthcareRoomSlug,
      topic_id: healthcareTopicId,
      contribution_store_mode: storeMetadata.mode,
      contribution_store_note: storeMetadata.note,
      public_private_boundary:
        "Contributor email, referral source, and private follow-up metadata are intentionally excluded from this public protocol export.",
    },
    export_warnings: exportWarnings,
    counts: countSummary,
    actor_records: actorRecords,
    room_record: {
      room_id: healthcareRoomSlug,
      title: room.title,
      description: room.whyItMatters,
      scope_note:
        "Protocol export is scoped to the Administrative Simplification and AI-Assisted Triage healthcare topic.",
      created_at: baseCreatedAt,
      status: "live",
    },
    topic_record: {
      topic_id: card.id,
      room_id: healthcareRoomSlug,
      title: card.title,
      current_synthesis_snapshot_id: currentSynthesisSnapshotId,
      claim_ids: [`claim:${healthcareRoomSlug}:${card.id}:primary`],
      status: "live",
      created_at: baseCreatedAt,
      updated_at: new Date(
        Math.max(
          ...contributions.map((item) => new Date(item.updatedAt).getTime()),
          Date.parse(baseCreatedAt),
        ),
      ).toISOString(),
    },
    claim_record: {
      claim_id: `claim:${healthcareRoomSlug}:${card.id}:primary`,
      topic_id: card.id,
      title: card.title,
      claim_text: card.thesis,
      status: "contested",
      current_synthesis_snapshot_id: currentSynthesisSnapshotId,
      attachment_target_ids: uniqueTargets.map((target) => target.target_id),
      created_at: baseCreatedAt,
      updated_at: new Date(
        Math.max(
          ...contributions.map((item) => new Date(item.updatedAt).getTime()),
          Date.parse(baseCreatedAt),
        ),
      ).toISOString(),
    },
    synthesis_snapshots: synthesisSnapshots,
    attachment_targets: uniqueTargets,
    contribution_records: contributions.map((contribution) => ({
      contribution_id: contribution.id,
      topic_id: contribution.topicId,
      origin: mapOrigin(contribution),
      lane: mapLane(contribution.lane),
      state: mapStatus(contribution.status, contribution),
      title: contribution.title,
      body: contribution.body,
      submitted_by_actor_id: contributionActorId(contribution),
      submitted_at: contribution.createdAt,
      evidence_object_ids: evidenceObjects
        .filter((evidence) => evidence.evidence_id.startsWith(`evidence:${contribution.id}:`))
        .map((evidence) => evidence.evidence_id),
      attachment_targets: contributionTargets(contribution, card),
      ai_reader_note_ids: aiReaderNotes
        .filter((note) => note.ai_reader_note_id.startsWith(`ai-note:${contribution.id}:`))
        .map((note) => note.ai_reader_note_id),
      human_review_decision_id: contribution.review ? `review:${contribution.id}` : null,
      revision_event_id: revisionIdByContributionId.get(contribution.id) ?? null,
    })),
    evidence_objects: evidenceObjects,
    ai_reader_notes: aiReaderNotes,
    human_review_decisions: humanReviewDecisions,
    revision_events: revisionEvents,
    audit_events: [
      {
        audit_event_id: `audit:${healthcareRoomSlug}:${healthcareTopicId}:export-generated`,
        event_type: "protocol_export_generated",
        actor_id: systemActorId,
        object_type: "TopicRecord",
        object_id: card.id,
        created_at: new Date().toISOString(),
        summary:
          "Generated a public protocol-shaped export of the healthcare reasoning ledger.",
      },
    ],
  };
}
