export type AskMode = "candidate" | "read-only";

export type AskReadOnlyIntent =
  | "what_changed"
  | "strongest_objections"
  | "unresolved_questions"
  | "evidence_summary"
  | "revision_trace"
  | "current_synthesis"
  | "contribution_status"
  | "what_would_move_this_card";

export type AskIntent = AskReadOnlyIntent | "candidate_intake";

export type AskRecordReferenceKind =
  | "TopicCard"
  | "ClaimRecord"
  | "ContributionRecord"
  | "RevisionEvent"
  | "SynthesisSnapshot"
  | "HumanReviewDecision"
  | "EvidenceObject"
  | "ObjectionRecord"
  | "OpenQuestionRecord"
  | "StrengtheningPath"
  | "CardEvidence";

export type AskRecordReference = {
  kind: AskRecordReferenceKind;
  id?: string;
  label: string;
};

export type AskReadOnlyResult = {
  intent: AskReadOnlyIntent;
  note: string;
  recordsUsed: AskRecordReference[];
};

export function getAskReadOnlyIntentLabel(intent: AskReadOnlyIntent) {
  switch (intent) {
    case "what_changed":
      return "What changed";
    case "strongest_objections":
      return "Strongest objections";
    case "unresolved_questions":
      return "Unresolved questions";
    case "evidence_summary":
      return "Evidence summary";
    case "revision_trace":
      return "Revision trace";
    case "current_synthesis":
      return "Current synthesis";
    case "contribution_status":
      return "Contribution status";
    case "what_would_move_this_card":
      return "What would move this card";
    default:
      return "Read-only answer";
  }
}
