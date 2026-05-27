import type { ContributionAuthor } from "./contribution-types";

type ContributionOriginInput = {
  author: Omit<ContributionAuthor, "email">;
  candidateSource?: unknown;
  draftSource?: unknown;
  isSeedExample?: boolean;
};

export type ContributionOrigin =
  | "human-submitted"
  | "maintainer-promoted-candidate"
  | "founder-maintainer"
  | "founder-submitted"
  | "ai-origin"
  | "seed-example";

export function isFounderMaintainerContribution(
  contribution: ContributionOriginInput,
) {
  if (contribution.isSeedExample || contribution.draftSource || contribution.candidateSource) {
    return false;
  }

  const authorName = contribution.author.name?.toLowerCase() ?? "";
  const authorExpertise = contribution.author.expertise?.toLowerCase() ?? "";

  return (
    authorName.includes("civic logos founder-maintainer") ||
    authorExpertise.includes("founder-maintainer")
  );
}

export function isFounderSubmittedContribution(contribution: ContributionOriginInput) {
  if (
    contribution.isSeedExample ||
    contribution.draftSource ||
    contribution.candidateSource ||
    isFounderMaintainerContribution(contribution)
  ) {
    return false;
  }

  const authorName = contribution.author.name?.toLowerCase() ?? "";
  const authorExpertise = contribution.author.expertise?.toLowerCase() ?? "";
  const normalizedAuthorName = authorName.replace(/\s+/g, " ").trim();

  return (
    normalizedAuthorName === "nick rindal" ||
    normalizedAuthorName === "nick b. rindal" ||
    authorName.includes("civic logos founder") ||
    authorExpertise.includes("founder-submitted")
  );
}

export function getContributionOrigin(
  contribution: ContributionOriginInput,
): ContributionOrigin {
  if (contribution.isSeedExample) {
    return "seed-example";
  }

  if (contribution.draftSource) {
    return "ai-origin";
  }

  if (contribution.candidateSource) {
    return "maintainer-promoted-candidate";
  }

  if (isFounderMaintainerContribution(contribution)) {
    return "founder-maintainer";
  }

  if (isFounderSubmittedContribution(contribution)) {
    return "founder-submitted";
  }

  return "human-submitted";
}

export function getContributionOriginLabel(origin: ContributionOrigin) {
  switch (origin) {
    case "ai-origin":
      return "AI-origin";
    case "founder-maintainer":
      return "Founder-maintainer";
    case "founder-submitted":
      return "Founder-submitted";
    case "maintainer-promoted-candidate":
      return "Maintainer-promoted V2 candidate";
    case "seed-example":
      return "Prototype example";
    case "human-submitted":
    default:
      return "Outside public submission";
  }
}

export function isOutsidePublicContribution(
  contribution: ContributionOriginInput,
) {
  return getContributionOrigin(contribution) === "human-submitted";
}
