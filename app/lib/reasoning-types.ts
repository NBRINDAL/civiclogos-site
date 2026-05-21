export const debateLaneOptions = [
  "support",
  "objection",
  "evidence",
  "correction",
  "nuance",
  "implementation-concern",
  "economic-assumption-challenge",
  "alternate-topic",
  "personal-perspective",
] as const;

export type DebateLane = (typeof debateLaneOptions)[number];

export const reviewStatusOptions = [
  "pending",
  "accepted",
  "needs review",
  "incorporated",
  "rejected",
] as const;

export type ReviewStatus = (typeof reviewStatusOptions)[number];

export const reviewTargetKindOptions = [
  "claim",
  "objection",
  "evidence",
  "assumption",
  "open-question",
  "unclear",
] as const;

export type ReviewTargetKind = (typeof reviewTargetKindOptions)[number];

export type EvidenceSource = {
  label?: string;
  url: string;
};

export const debateLaneLabels: Record<DebateLane, string> = {
  support: "Support",
  objection: "Objection",
  evidence: "Evidence",
  correction: "Correction",
  nuance: "Nuance",
  "implementation-concern": "Implementation concern",
  "economic-assumption-challenge": "Economic assumption challenge",
  "alternate-topic": "Alternate topic",
  "personal-perspective": "Personal perspective",
};

const debateLaneAliases: Record<string, DebateLane> = {
  support: "support",
  objection: "objection",
  evidence: "evidence",
  correction: "correction",
  nuance: "nuance",
  "implementation concern": "implementation-concern",
  "economic assumption challenge": "economic-assumption-challenge",
  "alternate topic": "alternate-topic",
  "personal perspective": "personal-perspective",
};

export function normalizeDebateLane(value: string): DebateLane | null {
  const trimmed = value.trim().toLowerCase();

  if (!trimmed) {
    return null;
  }

  const directMatch = debateLaneOptions.find((item) => item === trimmed);
  if (directMatch) {
    return directMatch;
  }

  return debateLaneAliases[trimmed] ?? null;
}

export function getDebateLaneLabel(value: DebateLane) {
  return debateLaneLabels[value];
}

export function normalizeReviewStatus(value: string): ReviewStatus | null {
  const trimmed = value.trim().toLowerCase();
  return reviewStatusOptions.find((item) => item === trimmed) ?? null;
}

export function normalizeReviewTargetKind(value: string): ReviewTargetKind | null {
  const trimmed = value.trim().toLowerCase();
  return reviewTargetKindOptions.find((item) => item === trimmed) ?? null;
}
