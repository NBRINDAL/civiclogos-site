import { isActualCardChange } from "./contribution-impact";
import type { PublicContribution } from "./contribution-types";
import {
  getContributionOrigin,
  isFounderMaintainerContribution,
  isFounderSubmittedContribution,
  isOutsidePublicContribution,
} from "./contribution-origin";

export type ContributionCountSummary = ReturnType<typeof getContributionCountSummary>;

export function getContributionCountSummary(contributions: readonly PublicContribution[]) {
  return {
    visibleRecords: contributions.length,
    pending: contributions.filter((item) => item.status === "pending").length,
    needsReview: contributions.filter((item) => item.status === "needs review").length,
    pendingReview: contributions.filter(
      (item) => item.status === "pending" || item.status === "needs review",
    ).length,
    accepted: contributions.filter((item) => item.status === "accepted").length,
    incorporated: contributions.filter((item) => item.status === "incorporated").length,
    rejected: contributions.filter((item) => item.status === "rejected").length,
    changedCard: contributions.filter((item) => isActualCardChange(item)).length,
    publicSubmissions: contributions.filter(isOutsidePublicContribution).length,
    founderMaintainer: contributions.filter(isFounderMaintainerContribution).length,
    founderSubmitted: contributions.filter(isFounderSubmittedContribution).length,
    aiOrigin: contributions.filter((item) => getContributionOrigin(item) === "ai-origin").length,
    prototypeExamples: contributions.filter((item) => item.isSeedExample).length,
    documentBacked: contributions.filter((item) => item.evidenceDocument).length,
  };
}
