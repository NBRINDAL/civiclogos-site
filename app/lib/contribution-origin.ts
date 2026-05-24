import type { ContributionAuthor } from "./contribution-types";

type ContributionOriginInput = {
  author: Omit<ContributionAuthor, "email">;
  draftSource?: unknown;
  isSeedExample?: boolean;
};

export type ContributionOrigin =
  | "human-submitted"
  | "founder-maintainer"
  | "founder-submitted"
  | "ai-origin"
  | "seed-example";

export function isFounderMaintainerContribution(
  contribution: ContributionOriginInput,
) {
  if (contribution.isSeedExample || contribution.draftSource) {
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
    isFounderMaintainerContribution(contribution)
  ) {
    return false;
  }

  const authorName = contribution.author.name?.toLowerCase() ?? "";
  const authorExpertise = contribution.author.expertise?.toLowerCase() ?? "";

  return (
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
    case "seed-example":
      return "Prototype example";
    case "human-submitted":
    default:
      return "Public submission";
  }
}

export function isOutsidePublicContribution(
  contribution: ContributionOriginInput,
) {
  return getContributionOrigin(contribution) === "human-submitted";
}
