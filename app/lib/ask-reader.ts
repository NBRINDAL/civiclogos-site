import {
  getContributionCountSummary,
  type ContributionCountSummary,
} from "./contribution-counts";
import { listPublicContributions } from "./contribution-store";
import type { PublicContribution } from "./contribution-types";
import { getRoomTopicCard, type IssueRoomSlug } from "./civic-logos";
import {
  type AskIntent,
  type AskReadOnlyResult,
  type AskRecordReference,
} from "./ask-types";
import { buildHealthcareTopic001ProtocolExport } from "./reasoning-ledger-export";

const readOnlyAnswerNote = "This answer is read-only. No candidate was created.";

type HealthcareLedgerExport = Awaited<
  ReturnType<typeof buildHealthcareTopic001ProtocolExport>
>;

type AskReadOnlyAnswer = AskReadOnlyResult & {
  answer: string;
};

function normalizeQuestion(question: string) {
  return ` ${question.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim()} `;
}

function includesAny(normalizedQuestion: string, patterns: readonly string[]) {
  return patterns.some((pattern) => normalizedQuestion.includes(` ${pattern} `));
}

function asRecordReference(
  kind: AskRecordReference["kind"],
  label: string,
  id?: string,
): AskRecordReference {
  return {
    kind,
    id,
    label,
  };
}

function dedupeReferences(references: AskRecordReference[]) {
  const unique = new Map<string, AskRecordReference>();

  for (const reference of references) {
    const key = `${reference.kind}:${reference.id ?? reference.label}`;

    if (!unique.has(key)) {
      unique.set(key, reference);
    }
  }

  return [...unique.values()].slice(0, 8);
}

function formatContributionLabel(contribution: Pick<PublicContribution, "id" | "title">) {
  return `${contribution.title} (${contribution.id})`;
}

function getCurrentSnapshot(ledger: HealthcareLedgerExport) {
  return (
    ledger.synthesis_snapshots.find(
      (snapshot) => snapshot.snapshot_id === ledger.topic_record.current_synthesis_snapshot_id,
    ) ?? ledger.synthesis_snapshots[ledger.synthesis_snapshots.length - 1]
  );
}

function getLatestRevision(ledger: HealthcareLedgerExport) {
  return ledger.revision_events[ledger.revision_events.length - 1] ?? null;
}

function getContributionById(
  contributions: readonly PublicContribution[],
  id: string | null | undefined,
) {
  if (!id) {
    return null;
  }

  return contributions.find((item) => item.id === id) ?? null;
}

function answerWhatChanged(args: {
  contributions: readonly PublicContribution[];
  ledger: HealthcareLedgerExport;
}) {
  const latestRevision = getLatestRevision(args.ledger);
  const currentSnapshot = getCurrentSnapshot(args.ledger);

  if (!latestRevision || !currentSnapshot) {
    return {
      answer:
        "This card has not recorded a public revision event yet. The visible synthesis is still the seed public record.",
      recordsUsed: dedupeReferences([
        asRecordReference(
          "ClaimRecord",
          "Current healthcare claim record",
          args.ledger.claim_record.claim_id,
        ),
      ]),
    };
  }

  const triggeringContribution = getContributionById(
    args.contributions,
    latestRevision.triggering_record_id,
  );

  return {
    answer: [
      `This card currently has ${args.ledger.revision_events.length} public revision event${
        args.ledger.revision_events.length === 1 ? "" : "s"
      }.`,
      triggeringContribution
        ? `The latest visible change was triggered by "${triggeringContribution.title}".`
        : "The latest visible change came through the existing public review path.",
      `The current synthesis now reads: ${args.ledger.claim_record.claim_text}`,
      `Recorded reason: ${latestRevision.reason_for_change}`,
    ].join("\n\n"),
    recordsUsed: dedupeReferences([
      asRecordReference(
        "RevisionEvent",
        "Latest public revision event",
        latestRevision.revision_id,
      ),
      asRecordReference(
        "SynthesisSnapshot",
        currentSnapshot.version_label,
        currentSnapshot.snapshot_id,
      ),
      triggeringContribution
        ? asRecordReference(
            "ContributionRecord",
            formatContributionLabel(triggeringContribution),
            triggeringContribution.id,
          )
        : asRecordReference(
            "ClaimRecord",
            "Current healthcare claim record",
            args.ledger.claim_record.claim_id,
          ),
      asRecordReference(
        "HumanReviewDecision",
        "Latest human review decision",
        latestRevision.review_decision_id,
      ),
    ]),
  };
}

function answerStrongestObjections(args: {
  ledger: HealthcareLedgerExport;
}) {
  const topObjections = args.ledger.objection_records.slice(0, 3);

  return {
    answer: topObjections.length
      ? [
          "The strongest objections currently kept in the public record are:",
          ...topObjections.map((objection) =>
            `- ${objection.objection_text}${
              objection.status ? ` (${objection.status})` : ""
            }`,
          ),
        ].join("\n")
      : "No objection records are visible on this card yet.",
    recordsUsed: dedupeReferences(
      topObjections.map((objection) =>
        asRecordReference(
          "ObjectionRecord",
          objection.objection_text,
          objection.objection_id,
        ),
      ),
    ),
  };
}

function answerUnresolvedQuestions(args: {
  ledger: HealthcareLedgerExport;
}) {
  const currentSnapshot = getCurrentSnapshot(args.ledger);
  const unresolvedItems =
    currentSnapshot?.unresolved_items?.length
      ? currentSnapshot.unresolved_items
      : args.ledger.open_question_records.map((item) => item.question);

  return {
    answer: unresolvedItems.length
      ? [
          currentSnapshot
            ? `These questions remain unresolved in ${currentSnapshot.version_label}:`
            : "These questions remain unresolved:",
          ...unresolvedItems.map((item) => `- ${item}`),
        ].join("\n")
      : "The current public snapshot does not list unresolved questions.",
    recordsUsed: dedupeReferences([
      ...(currentSnapshot
        ? [
            asRecordReference(
              "SynthesisSnapshot",
              currentSnapshot.version_label,
              currentSnapshot.snapshot_id,
            ),
          ]
        : []),
      ...args.ledger.open_question_records.map((item) =>
        asRecordReference("OpenQuestionRecord", item.question, item.open_question_id),
      ),
    ]),
  };
}

function answerEvidenceSummary(args: {
  card: NonNullable<ReturnType<typeof getRoomTopicCard>>;
  ledger: HealthcareLedgerExport;
}) {
  const attachedEvidence = args.ledger.evidence_objects.slice(0, 4);
  const cardEvidence = args.card.evidence.slice(0, 4);
  const evidenceLines = attachedEvidence.length
    ? attachedEvidence.map((item) => `- ${item.title} (${item.evidence_id})`)
    : ["- No public contribution has attached a separate EvidenceObject yet."];
  const cardEvidenceLines = cardEvidence.map(
    (item) => `- ${item.title} [${item.status}]`,
  );

  return {
    answer: [
      "Attached public evidence records:",
      ...evidenceLines,
      "",
      "Visible card evidence layer:",
      ...cardEvidenceLines,
    ].join("\n"),
    recordsUsed: dedupeReferences([
      ...attachedEvidence.map((item) =>
        asRecordReference("EvidenceObject", item.title, item.evidence_id),
      ),
      ...cardEvidence.map((item) =>
        asRecordReference(
          "CardEvidence",
          `${item.title} [${item.status}]`,
        ),
      ),
    ]),
  };
}

function answerRevisionTrace(args: {
  contributions: readonly PublicContribution[];
  ledger: HealthcareLedgerExport;
}) {
  const snapshotLines = args.ledger.synthesis_snapshots.map(
    (snapshot) => `- ${snapshot.version_label} (${snapshot.snapshot_id})`,
  );
  const revisionLines = args.ledger.revision_events.length
    ? args.ledger.revision_events.map((revision) => {
        const contribution = getContributionById(
          args.contributions,
          revision.triggering_record_id,
        );

        return `- ${revision.revision_id} via ${
          contribution?.title ?? revision.triggering_record_id
        }`;
      })
    : ["- No public revision event has been recorded yet."];

  return {
    answer: [
      `The public revision trace currently has ${args.ledger.revision_events.length} revision event${
        args.ledger.revision_events.length === 1 ? "" : "s"
      }.`,
      "",
      "Synthesis snapshots:",
      ...snapshotLines,
      "",
      "Revision events:",
      ...revisionLines,
    ].join("\n"),
    recordsUsed: dedupeReferences([
      ...args.ledger.synthesis_snapshots.map((snapshot) =>
        asRecordReference(
          "SynthesisSnapshot",
          snapshot.version_label,
          snapshot.snapshot_id,
        ),
      ),
      ...args.ledger.revision_events.map((revision) =>
        asRecordReference(
          "RevisionEvent",
          `Revision event ${revision.revision_id}`,
          revision.revision_id,
        ),
      ),
    ]),
  };
}

function answerCurrentSynthesis(args: {
  ledger: HealthcareLedgerExport;
}) {
  const currentSnapshot = getCurrentSnapshot(args.ledger);

  return {
    answer: [
      "The current public synthesis for healthcare/topic-001 is:",
      "",
      args.ledger.claim_record.claim_text,
    ].join("\n"),
    recordsUsed: dedupeReferences([
      asRecordReference(
        "ClaimRecord",
        "Current healthcare claim record",
        args.ledger.claim_record.claim_id,
      ),
      ...(currentSnapshot
        ? [
            asRecordReference(
              "SynthesisSnapshot",
              currentSnapshot.version_label,
              currentSnapshot.snapshot_id,
            ),
          ]
        : []),
    ]),
  };
}

function answerContributionStatus(args: {
  contributions: readonly PublicContribution[];
  countSummary: ContributionCountSummary;
}) {
  const pendingTitles = args.contributions
    .filter((item) => item.status === "pending" || item.status === "needs review")
    .slice(0, 4);
  const referencedContributions = pendingTitles.length
    ? pendingTitles
    : args.contributions.slice(0, 3);

  return {
    answer: [
      `healthcare/topic-001 currently has ${args.countSummary.visibleRecords} visible contribution record${
        args.countSummary.visibleRecords === 1 ? "" : "s"
      }.`,
      `${args.countSummary.pending} pending, ${args.countSummary.needsReview} needs review, ${args.countSummary.accepted} accepted, ${args.countSummary.incorporated} incorporated, and ${args.countSummary.rejected} rejected.`,
      pendingTitles.length
        ? `Still awaiting final review: ${pendingTitles
            .map((item) => `"${item.title}"`)
            .join(", ")}.`
        : "No public contribution is currently waiting in the pending or needs-review state.",
    ].join("\n\n"),
    recordsUsed: dedupeReferences(
      referencedContributions.map((item) =>
        asRecordReference(
          "ContributionRecord",
          formatContributionLabel(item),
          item.id,
        ),
      ),
    ),
  };
}

function answerWhatWouldMoveThisCard(args: {
  card: NonNullable<ReturnType<typeof getRoomTopicCard>>;
  ledger: HealthcareLedgerExport;
}) {
  const currentSnapshot = getCurrentSnapshot(args.ledger);

  return {
    answer: [
      "The card says it would move forward with:",
      ...args.card.whatWouldStrengthen.map((item) => `- ${item}`),
      "",
      "The current unresolved questions still blocking movement are:",
      ...args.card.openQuestions.map((item) => `- ${item}`),
    ].join("\n"),
    recordsUsed: dedupeReferences([
      ...(currentSnapshot
        ? [
            asRecordReference(
              "SynthesisSnapshot",
              currentSnapshot.version_label,
              currentSnapshot.snapshot_id,
            ),
          ]
        : []),
      ...args.card.whatWouldStrengthen.map((item) =>
        asRecordReference("StrengtheningPath", item),
      ),
      ...args.ledger.open_question_records.map((item) =>
        asRecordReference("OpenQuestionRecord", item.question, item.open_question_id),
      ),
    ]),
  };
}

export function detectAskIntent(question: string): AskIntent {
  const normalizedQuestion = normalizeQuestion(question);

  if (
    includesAny(normalizedQuestion, [
      "what changed in this card",
      "what changed in the card",
      "what changed on this card",
      "why did the synthesis change",
      "why did this card change",
      "why did the card change",
      "what changed here",
    ])
  ) {
    return "what_changed";
  }

  if (
    includesAny(normalizedQuestion, [
      "what are the strongest objections",
      "what are the main objections",
      "what are the biggest objections",
      "strongest objections",
      "main objections",
      "biggest objections",
    ])
  ) {
    return "strongest_objections";
  }

  if (
    includesAny(normalizedQuestion, [
      "what remains unresolved",
      "what is unresolved",
      "unresolved questions",
      "open questions",
      "what remains open",
    ])
  ) {
    return "unresolved_questions";
  }

  if (
    includesAny(normalizedQuestion, [
      "what evidence is attached",
      "what evidence is there",
      "what evidence is on this card",
      "evidence summary",
      "what sources are attached",
      "what evidence",
    ])
  ) {
    return "evidence_summary";
  }

  if (
    includesAny(normalizedQuestion, [
      "revision trace",
      "revision history",
      "show the revisions",
      "show the revision trace",
      "trace the revisions",
    ])
  ) {
    return "revision_trace";
  }

  if (
    includesAny(normalizedQuestion, [
      "current synthesis",
      "current read",
      "what does this card say now",
      "what does the card say now",
      "what is the current synthesis",
      "what is the current read",
    ])
  ) {
    return "current_synthesis";
  }

  if (
    includesAny(normalizedQuestion, [
      "contribution status",
      "status of contributions",
      "what contributions are pending",
      "what is pending",
      "review queue status",
      "what is the contribution status",
    ])
  ) {
    return "contribution_status";
  }

  if (
    includesAny(normalizedQuestion, [
      "what would move this card",
      "what would move the card",
      "what would move this card forward",
      "what would strengthen this card",
      "what would strengthen the card",
      "how could this card move",
    ])
  ) {
    return "what_would_move_this_card";
  }

  return "candidate_intake";
}

export async function answerReadOnlyAsk(input: {
  roomSlug: IssueRoomSlug;
  topicId: string;
  question: string;
}): Promise<AskReadOnlyAnswer | null> {
  const intent = detectAskIntent(input.question);

  if (intent === "candidate_intake") {
    return null;
  }

  if (input.roomSlug !== "healthcare" || input.topicId !== "topic-001") {
    return null;
  }

  const card = getRoomTopicCard(input.roomSlug, input.topicId);

  if (!card) {
    return null;
  }

  const [contributions, ledger] = await Promise.all([
    listPublicContributions({
      roomSlug: input.roomSlug,
      topicId: input.topicId,
      limit: 50,
    }),
    buildHealthcareTopic001ProtocolExport(),
  ]);
  const countSummary = getContributionCountSummary(contributions);

  const resolved = (() => {
    switch (intent) {
      case "what_changed":
        return answerWhatChanged({
          contributions,
          ledger,
        });
      case "strongest_objections":
        return answerStrongestObjections({
          ledger,
        });
      case "unresolved_questions":
        return answerUnresolvedQuestions({
          ledger,
        });
      case "evidence_summary":
        return answerEvidenceSummary({
          card,
          ledger,
        });
      case "revision_trace":
        return answerRevisionTrace({
          contributions,
          ledger,
        });
      case "current_synthesis":
        return answerCurrentSynthesis({
          ledger,
        });
      case "contribution_status":
        return answerContributionStatus({
          contributions,
          countSummary,
        });
      case "what_would_move_this_card":
        return answerWhatWouldMoveThisCard({
          card,
          ledger,
        });
      default:
        return null;
    }
  })();

  if (!resolved) {
    return null;
  }

  return {
    intent,
    answer: resolved.answer,
    note: readOnlyAnswerNote,
    recordsUsed: resolved.recordsUsed,
  };
}

export const askReadOnlyAnswerNote = readOnlyAnswerNote;
