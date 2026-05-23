type ContributionImpactInput = {
  aiIntake?: {
    changedSynthesisLikely?: boolean | null;
  };
  review?: {
    changedSynthesis?: boolean | null;
  };
  status?: string | null;
};

export function isFinalReviewStatus(status: string | null | undefined) {
  return status === "accepted" || status === "incorporated";
}

export function isActualCardChange(contribution: ContributionImpactInput) {
  return (
    contribution.review?.changedSynthesis === true &&
    isFinalReviewStatus(contribution.status)
  );
}

export function isProposedCardChange(contribution: ContributionImpactInput) {
  return (
    contribution.review?.changedSynthesis === true &&
    !isFinalReviewStatus(contribution.status)
  );
}

export function hasPotentialCardImpact(contribution: ContributionImpactInput) {
  return contribution.aiIntake?.changedSynthesisLikely === true;
}

export function getPotentialCardImpactLabel(value: boolean | null | undefined) {
  if (value === true) {
    return "Likely";
  }

  if (value === false) {
    return "Unlikely";
  }

  return "Not estimated yet";
}

export function getActualCardChangeLabel(contribution: ContributionImpactInput) {
  if (isActualCardChange(contribution)) {
    return "Yes";
  }

  if (isProposedCardChange(contribution)) {
    return "Proposed, awaiting accepted/incorporated review";
  }

  if (
    contribution.review?.changedSynthesis === false &&
    isFinalReviewStatus(contribution.status)
  ) {
    return "No";
  }

  if (contribution.review?.changedSynthesis === false) {
    return "Review says no; status is not final";
  }

  return "Not decided yet";
}
