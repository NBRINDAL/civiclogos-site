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

function isQuestionLike(question: string) {
  const normalizedQuestion = normalizeQuestion(question);

  return (
    question.includes("?") ||
    includesAny(normalizedQuestion, [
      "what",
      "why",
      "how",
      "does",
      "do",
      "is",
      "are",
      "can",
      "should",
      "explain",
      "summarize",
      "tell me",
    ])
  );
}

function looksLikePhysicsContributionStatement(question: string) {
  const normalizedQuestion = normalizeQuestion(question);

  if (question.includes("?")) {
    return false;
  }

  const hasPhysicsSignal = includesAny(normalizedQuestion, [
    "planck",
    "quantum",
    "gravity",
    "general relativity",
    "physical structure",
    "symbolic sequence",
    "foundational physics",
    "collapse",
  ]);
  const hasContributionClaim = includesAny(normalizedQuestion, [
    "may reveal",
    "might reveal",
    "may show",
    "might show",
    "should be treated",
    "could imply",
    "could indicate",
    "not just definitions",
    "not merely definitions",
    "can still be overread",
    "overread",
    "may only be",
    "only be a reformulation",
    "be a reformulation",
    "proves",
    "reveals",
  ]);

  return hasPhysicsSignal && hasContributionClaim;
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

function physicsTopicReference(card: NonNullable<ReturnType<typeof getRoomTopicCard>>) {
  return asRecordReference(
    "TopicCard",
    `physics-foundations/${card.id} - ${card.title}`,
    `physics-foundations/${card.id}`,
  );
}

function answerPhysicsCurrentSynthesis(args: {
  card: NonNullable<ReturnType<typeof getRoomTopicCard>>;
}) {
  return {
    answer: [
      "The current public synthesis for physics-foundations/topic-001 is:",
      "",
      args.card.currentRead,
      "",
      "Conservative framing: standard quantum theory and general relativity remain highly successful in their tested domains, while their unification remains unresolved.",
    ].join("\n"),
    recordsUsed: dedupeReferences([
      physicsTopicReference(args.card),
      asRecordReference("ClaimRecord", args.card.thesis, `claim:physics-foundations:${args.card.id}:primary`),
    ]),
  };
}

function answerPhysicsStandardBaselines(args: {
  card: NonNullable<ReturnType<typeof getRoomTopicCard>>;
}) {
  const evidenceReferences = args.card.evidence.slice(0, 3);

  return {
    answer: [
      "The physics card treats the standard baseline as deliberately conservative:",
      "- Quantum theory, quantum field theory, and general relativity are highly successful in their tested domains.",
      "- Quantum theory and general relativity are not yet unified into a settled quantum-gravity framework.",
      "- Planck units are useful dimensional scales built from constants such as c, hbar, and G.",
      "- Planck-unit relationships should be separated from claims about physical microstructure, discreteness, collapse, or new empirical physics.",
      "",
      "A proposed reformulation should say whether it changes notation, assumptions, predictions, or empirical commitments.",
    ].join("\n"),
    recordsUsed: dedupeReferences([
      physicsTopicReference(args.card),
      ...evidenceReferences.map((item) =>
        asRecordReference("CardEvidence", `${item.title} [${item.status}]`),
      ),
    ]),
  };
}

function answerPhysicsPlanckIdentityStatus(args: {
  card: NonNullable<ReturnType<typeof getRoomTopicCard>>;
}) {
  const planckEvidence = args.card.evidence.find((item) =>
    item.title.toLowerCase().includes("planck"),
  );

  return {
    answer: [
      "The card treats Planck units and Planck-style identities as valid definitions or mathematical/dimensional relationships unless a separate argument is supplied.",
      "",
      "A Planck-unit identity does not by itself prove physical discreteness, a collapse structure, spacetime pixelation, or new empirical physics. It can be a useful formal anchor, but moving from definition to physical interpretation requires stated assumptions, predictions, and evidence burdens.",
      "",
      "Founder-submitted physics material can therefore be held as a scoped interpretation or proposed reformulation without becoming settled synthesis.",
    ].join("\n"),
    recordsUsed: dedupeReferences([
      physicsTopicReference(args.card),
      ...(planckEvidence
        ? [
            asRecordReference(
              "CardEvidence",
              `${planckEvidence.title} [${planckEvidence.status}]`,
            ),
          ]
        : []),
      asRecordReference("OpenQuestionRecord", args.card.openQuestions[0]),
    ]),
  };
}

function answerPhysicsStrongestObjections(args: {
  card: NonNullable<ReturnType<typeof getRoomTopicCard>>;
}) {
  const secondaryCaution = args.card.anticipatedObjection
    ? ["", "A second caution is:", `- ${args.card.anticipatedObjection}`]
    : [];

  return {
    answer: [
      "The strongest objection currently named by the physics card is:",
      `- ${args.card.strongestObjection}`,
      ...secondaryCaution,
      "",
      "The conservative reader note is that mathematical elegance, rewritten constants, or dimensional identities should not be treated as evidence unless the proposal identifies changed assumptions, predictions, or empirical commitments.",
    ].join("\n"),
    recordsUsed: dedupeReferences([
      physicsTopicReference(args.card),
      asRecordReference("ObjectionRecord", args.card.strongestObjection),
      ...(args.card.anticipatedObjection
        ? [asRecordReference("ObjectionRecord", args.card.anticipatedObjection)]
        : []),
    ]),
  };
}

function answerPhysicsUnresolvedQuestions(args: {
  card: NonNullable<ReturnType<typeof getRoomTopicCard>>;
}) {
  return {
    answer: [
      "The Physics Foundations card keeps these questions unresolved:",
      ...args.card.openQuestions.map((item) => `- ${item}`),
      "",
      "The unresolved center is not whether standard theories work in tested domains; it is how to separate definitions, empirical success, unresolved unification problems, and proposed reformulations without overclaiming.",
    ].join("\n"),
    recordsUsed: dedupeReferences([
      physicsTopicReference(args.card),
      ...args.card.openQuestions.map((item) =>
        asRecordReference("OpenQuestionRecord", item),
      ),
    ]),
  };
}

function answerPhysicsWhatWouldMoveThisCard(args: {
  card: NonNullable<ReturnType<typeof getRoomTopicCard>>;
}) {
  return {
    answer: [
      "The card would move forward with:",
      ...args.card.whatWouldStrengthen.map((item) => `- ${item}`),
      "",
      "For a reformulation, the key review step is to say whether it changes notation, assumptions, predictions, or empirical commitments, then attach evidence or a falsifiable constraint accordingly.",
    ].join("\n"),
    recordsUsed: dedupeReferences([
      physicsTopicReference(args.card),
      ...args.card.whatWouldStrengthen.map((item) =>
        asRecordReference("StrengtheningPath", item),
      ),
    ]),
  };
}

function answerPhysicsDefinitionVsInterpretation(args: {
  card: NonNullable<ReturnType<typeof getRoomTopicCard>>;
}) {
  return {
    answer: [
      "The card separates definition from interpretation this way:",
      "- Definitions and dimensional relationships can be valid without proving a new physical ontology.",
      "- Planck units can mark useful scales, but they do not alone establish discreteness, collapse structure, or a new empirical mechanism.",
      "- Physical interpretation requires extra assumptions, and a synthesis-changing claim needs either empirical support or a clear testable commitment.",
      "",
      "So yes: the card can hold founder-submitted Planck material as a scoped interpretation or proposed reformulation, but not as settled proof.",
    ].join("\n"),
    recordsUsed: dedupeReferences([
      physicsTopicReference(args.card),
      asRecordReference("CardEvidence", "Planck-unit definitions [Established definition]"),
      asRecordReference("OpenQuestionRecord", args.card.openQuestions[0]),
    ]),
  };
}

function answerPhysicsEvidenceBurden(args: {
  card: NonNullable<ReturnType<typeof getRoomTopicCard>>;
}) {
  const evidenceLines = args.card.evidence.map(
    (item) => `- ${item.title} [${item.status}]: ${item.note}`,
  );

  return {
    answer: [
      "The evidence burden is high because the topic is distinguishing standard definitions from synthesis-changing physics claims.",
      "",
      "Visible evidence/status layer:",
      ...evidenceLines,
      "",
      "A Planck-unit identity or symbolic chain would need more than dimensional validity to move the card. It should identify what changes, what stays equivalent to standard notation, what prediction or empirical commitment follows, and what observation or argument would count against it.",
    ].join("\n"),
    recordsUsed: dedupeReferences([
      physicsTopicReference(args.card),
      ...args.card.evidence.map((item) =>
        asRecordReference("CardEvidence", `${item.title} [${item.status}]`),
      ),
      ...args.card.whatWouldStrengthen.map((item) =>
        asRecordReference("StrengtheningPath", item),
      ),
    ]),
  };
}

function answerPhysicsReadOnlyAsk(args: {
  card: NonNullable<ReturnType<typeof getRoomTopicCard>>;
  intent: AskIntent;
}) {
  switch (args.intent) {
    case "current_synthesis":
      return answerPhysicsCurrentSynthesis({ card: args.card });
    case "standard_baselines":
      return answerPhysicsStandardBaselines({ card: args.card });
    case "planck_identity_status":
      return answerPhysicsPlanckIdentityStatus({ card: args.card });
    case "strongest_objections":
      return answerPhysicsStrongestObjections({ card: args.card });
    case "unresolved_questions":
      return answerPhysicsUnresolvedQuestions({ card: args.card });
    case "what_would_move_this_card":
      return answerPhysicsWhatWouldMoveThisCard({ card: args.card });
    case "definition_vs_interpretation":
      return answerPhysicsDefinitionVsInterpretation({ card: args.card });
    case "evidence_burden":
    case "evidence_summary":
      return answerPhysicsEvidenceBurden({ card: args.card });
    default:
      return null;
  }
}

export function detectAskIntent(question: string): AskIntent {
  const normalizedQuestion = normalizeQuestion(question);
  const questionLike = isQuestionLike(question);

  if (looksLikePhysicsContributionStatement(question)) {
    return "candidate_intake";
  }

  if (
    questionLike &&
    includesAny(normalizedQuestion, [
      "standard baselines",
      "standard baseline",
      "what are the baselines",
      "what are the standard baselines",
    ])
  ) {
    return "standard_baselines";
  }

  if (
    questionLike &&
    includesAny(normalizedQuestion, [
      "definition or interpretation",
      "definitions or interpretation",
      "definition vs interpretation",
      "definitions vs interpretation",
      "definition versus interpretation",
      "definitions versus interpretation",
      "definitions or physical proof",
      "definition or physical proof",
      "not just definitions",
      "as definitions or physical proof",
    ])
  ) {
    return "definition_vs_interpretation";
  }

  if (
    questionLike &&
    includesAny(normalizedQuestion, [
      "planck identities",
      "planck identity",
      "planck units",
      "what does it say about planck",
      "what does the card say about planck",
    ])
  ) {
    return "planck_identity_status";
  }

  if (
    questionLike &&
    includesAny(normalizedQuestion, [
      "evidence burden",
      "burden of evidence",
      "what evidence burden",
      "what would count as evidence",
      "what evidence would be needed",
      "what proof would be needed",
    ])
  ) {
    return "evidence_burden";
  }

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
      "what does the physics card currently say",
      "what does the physics card say",
      "what does this physics card say",
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

  const card = getRoomTopicCard(input.roomSlug, input.topicId);

  if (!card) {
    return null;
  }

  if (input.roomSlug === "physics-foundations" && input.topicId === "topic-001") {
    const resolved = answerPhysicsReadOnlyAsk({
      card,
      intent,
    });

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

  if (input.roomSlug !== "healthcare" || input.topicId !== "topic-001") {
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
