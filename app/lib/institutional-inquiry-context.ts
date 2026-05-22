export type InstitutionalInquiryContextFact = {
  label: string;
  value: string;
};

export type InstitutionalInquiryContextLink = {
  label: string;
  href: string;
};

export type InstitutionalInquiryContext = {
  sourceTopic?: string;
  sourceRoom?: string;
  sourceTopicHref?: string;
  title?: string;
  note?: string;
  relationshipNote?: string;
  facts: InstitutionalInquiryContextFact[];
  groundingLinks: InstitutionalInquiryContextLink[];
  returnLinks: InstitutionalInquiryContextLink[];
  links: InstitutionalInquiryContextLink[];
  showSnapshot: boolean;
  initialIssueQuestion: string;
  summary?: string;
};

type InstitutionalSearchParams = Record<string, string | string[] | undefined>;

function getFirstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function getAllValues(value?: string | string[]) {
  return Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
}

function buildLinks(
  labels: string[],
  hrefs: string[],
): InstitutionalInquiryContextLink[] {
  return labels
    .map((label, index) => ({
      label,
      href: hrefs[index] ?? "",
    }))
    .filter((item): item is InstitutionalInquiryContextLink => Boolean(item.href));
}

export function buildInstitutionalInquiryContext(
  searchParams: InstitutionalSearchParams,
): InstitutionalInquiryContext {
  const sourceTopic = getFirstValue(searchParams.sourceTopic);
  const sourceRoom = getFirstValue(searchParams.sourceRoom);
  const sourceTopicHref = getFirstValue(searchParams.sourceTopicHref);
  const sourceLiveRecord = getFirstValue(searchParams.sourceLiveRecord);
  const sourcePendingReview = getFirstValue(searchParams.sourcePendingReview);
  const sourceChangedCard = getFirstValue(searchParams.sourceChangedCard);
  const sourceAiOrigin = getFirstValue(searchParams.sourceAiOrigin);
  const sourceDocumentBacked = getFirstValue(searchParams.sourceDocumentBacked);
  const sourceRecordMode = getFirstValue(searchParams.sourceRecordMode);
  const sourceScoreLabel = getFirstValue(searchParams.sourceScoreLabel);
  const sourceScoreValue = getFirstValue(searchParams.sourceScoreValue);
  const sourceScoreSlice = getFirstValue(searchParams.sourceScoreSlice);
  const sourceScoreOpenPressure = getFirstValue(searchParams.sourceScoreOpenPressure);
  const sourceExactRecordTitle = getFirstValue(searchParams.sourceExactRecordTitle);
  const sourceExactRecordState = getFirstValue(searchParams.sourceExactRecordState);
  const sourceExactRecordPilotGrounding = getFirstValue(
    searchParams.sourceExactRecordPilotGrounding,
  );
  const sourceExactRecordPublicUptakeLabel = getFirstValue(
    searchParams.sourceExactRecordPublicUptakeLabel,
  );
  const sourceExactRecordPublicUptakeNote = getFirstValue(
    searchParams.sourceExactRecordPublicUptakeNote,
  );
  const sourceExactRecordPublicUptakeHref = getFirstValue(
    searchParams.sourceExactRecordPublicUptakeHref,
  );
  const sourceExactRecordOrigin = getFirstValue(searchParams.sourceExactRecordOrigin);
  const sourceExactRecordSlice = getFirstValue(searchParams.sourceExactRecordSlice);
  const sourceExactRecordTarget = getFirstValue(searchParams.sourceExactRecordTarget);
  const sourceExactRecordRead = getFirstValue(searchParams.sourceExactRecordRead);
  const sourceExactRecordReadNote = getFirstValue(searchParams.sourceExactRecordReadNote);
  const sourceExactRecordAiSource = getFirstValue(searchParams.sourceExactRecordAiSource);
  const sourceExactRecordHref = getFirstValue(searchParams.sourceExactRecordHref);
  const sourceExactRecordSourceTurnHref = getFirstValue(
    searchParams.sourceExactRecordSourceTurnHref,
  );
  const sourceIntakeArtifactTitle = getFirstValue(searchParams.sourceIntakeArtifactTitle);
  const sourceIntakePromptCount = getFirstValue(searchParams.sourceIntakePromptCount);
  const sourceIntakeHeldQuestionCount = getFirstValue(
    searchParams.sourceIntakeHeldQuestionCount,
  );
  const sourceIntakeRelationship = getFirstValue(searchParams.sourceIntakeRelationship);
  const sourceIntakeExactArtifactHref = getFirstValue(
    searchParams.sourceIntakeExactArtifactHref,
  );
  const sourceIntakeArtifactHref = getFirstValue(searchParams.sourceIntakeArtifactHref);
  const sourceIntakeRoutingHref = getFirstValue(searchParams.sourceIntakeRoutingHref);
  const sourceIntakePromptHistoryHref = getFirstValue(
    searchParams.sourceIntakePromptHistoryHref,
  );

  const sourceExactRecordPublicUptakeLinks = buildLinks(
    getAllValues(searchParams.sourceExactRecordPublicUptakeLinkLabel),
    getAllValues(searchParams.sourceExactRecordPublicUptakeLinkHref),
  );
  const sourceExactRecordSummaryLinks = buildLinks(
    getAllValues(searchParams.sourceExactRecordSummaryLabel),
    getAllValues(searchParams.sourceExactRecordSummaryHref),
  );
  const sourceExactRecordScoreLinks = buildLinks(
    getAllValues(searchParams.sourceExactRecordScoreLabel),
    getAllValues(searchParams.sourceExactRecordScoreHref),
  );
  const sourceExactRecordScorePressureLinks = buildLinks(
    getAllValues(searchParams.sourceExactRecordScorePressureLabel),
    getAllValues(searchParams.sourceExactRecordScorePressureHref),
  );

  const sourceScoreSummary = sourceScoreLabel
    ? sourceScoreValue
      ? `${sourceScoreLabel} · ${sourceScoreValue}`
      : sourceScoreLabel
    : null;
  const contextScopeParts = [
    sourceScoreLabel ? "focused score context" : null,
    sourceExactRecordTitle ? "current pressure record" : null,
    sourceIntakeArtifactTitle ? "held intake pressure" : null,
  ].filter((part): part is string => Boolean(part));
  const contextScopeSuffix = contextScopeParts.length
    ? ` plus ${contextScopeParts.join(" and ")}`
    : "";
  const title = sourceTopic
    ? `${sourceTopic}${sourceRoom ? ` in ${sourceRoom}` : ""}`
    : undefined;
  const note =
    sourceTopic && sourceRoom
      ? `This inquiry came from the live topic card in ${sourceRoom} and carries the card's current public-record snapshot${contextScopeSuffix} into the institutional pilot request.`
      : sourceTopic
        ? `This inquiry came from a live Civic Logos topic card and carries its current public-record snapshot${contextScopeSuffix} into the institutional pilot request.`
        : undefined;

  const facts = [
    sourceLiveRecord ? { label: "Visible record", value: sourceLiveRecord } : null,
    sourcePendingReview ? { label: "Pending review", value: sourcePendingReview } : null,
    sourceChangedCard ? { label: "Changed card", value: sourceChangedCard } : null,
    sourceAiOrigin ? { label: "AI-origin", value: sourceAiOrigin } : null,
    sourceDocumentBacked
      ? { label: "Document-backed", value: sourceDocumentBacked }
      : null,
    sourceRecordMode ? { label: "Record mode", value: sourceRecordMode } : null,
    sourceScoreSummary ? { label: "Focused score", value: sourceScoreSummary } : null,
    sourceScoreSlice ? { label: "Score slice", value: sourceScoreSlice } : null,
    sourceScoreOpenPressure
      ? { label: "Open review pressure", value: sourceScoreOpenPressure }
      : null,
    sourceExactRecordTitle || sourceExactRecordState
      ? {
          label: "Current pressure record",
          value:
            sourceExactRecordTitle ??
            sourceExactRecordState ??
            "No visible public-record entry is currently linked.",
        }
      : null,
    sourceExactRecordOrigin
      ? { label: "Record origin", value: sourceExactRecordOrigin }
      : null,
    sourceExactRecordPilotGrounding
      ? { label: "Pilot grounding", value: sourceExactRecordPilotGrounding }
      : null,
    sourceExactRecordPublicUptakeLabel
      ? {
          label: "Public uptake status",
          value: sourceExactRecordPublicUptakeLabel,
        }
      : null,
    sourceExactRecordPublicUptakeNote
      ? { label: "Public uptake note", value: sourceExactRecordPublicUptakeNote }
      : null,
    sourceExactRecordPublicUptakeLinks.length
      ? {
          label: "Public uptake slices",
          value: sourceExactRecordPublicUptakeLinks.map((item) => item.label).join(", "),
        }
      : null,
    sourceExactRecordSlice ? { label: "Record slice", value: sourceExactRecordSlice } : null,
    sourceExactRecordTarget
      ? { label: "Record target", value: sourceExactRecordTarget }
      : null,
    sourceExactRecordRead ? { label: "Record read", value: sourceExactRecordRead } : null,
    sourceExactRecordReadNote
      ? {
          label: sourceExactRecordRead ?? "Read interpretation",
          value: sourceExactRecordReadNote,
        }
      : null,
    sourceExactRecordAiSource
      ? { label: "AI source", value: sourceExactRecordAiSource }
      : null,
    sourceExactRecordSummaryLinks.length
      ? {
          label: "Surfacing in card",
          value: sourceExactRecordSummaryLinks.map((item) => item.label).join(", "),
        }
      : null,
    sourceExactRecordScoreLinks.length
      ? {
          label: "Scorecard use of this record",
          value: sourceExactRecordScoreLinks.map((item) => item.label).join(", "),
        }
      : null,
    sourceExactRecordScorePressureLinks.length
      ? {
          label: "Open review pressure on linked scores",
          value: sourceExactRecordScorePressureLinks
            .map((item) => item.label)
            .join(", "),
        }
      : null,
    sourceIntakeArtifactTitle
      ? { label: "Held artifact", value: sourceIntakeArtifactTitle }
      : null,
    sourceIntakePromptCount
      ? { label: "Held prompts", value: sourceIntakePromptCount }
      : null,
    sourceIntakeHeldQuestionCount
      ? { label: "Held questions", value: sourceIntakeHeldQuestionCount }
      : null,
  ].filter((item): item is InstitutionalInquiryContextFact => Boolean(item));

  const groundingLinks = [
    sourceExactRecordHref
      ? { label: "Open exact public record entry", href: sourceExactRecordHref }
      : null,
    sourceExactRecordSourceTurnHref
      ? { label: "Open source AI turn", href: sourceExactRecordSourceTurnHref }
      : null,
    sourceExactRecordPublicUptakeHref
      ? { label: "Open public uptake record", href: sourceExactRecordPublicUptakeHref }
      : null,
    ...sourceExactRecordPublicUptakeLinks.map((item) => ({
      label: `Open ${item.label}`,
      href: item.href,
    })),
    ...sourceExactRecordSummaryLinks.map((item) => ({
      label: `Open ${item.label}`,
      href: item.href,
    })),
    ...sourceExactRecordScoreLinks.map((item) => ({
      label: `Open ${item.label}`,
      href: item.href,
    })),
    ...sourceExactRecordScorePressureLinks.map((item) => ({
      label: `Open ${item.label}`,
      href: item.href,
    })),
  ].filter((item): item is InstitutionalInquiryContextLink => Boolean(item));

  const returnLinks = [
    sourceTopicHref
      ? { label: "Return to pilot-ready topic section", href: sourceTopicHref }
      : null,
    sourceIntakeExactArtifactHref
      ? { label: "Open exact held artifact", href: sourceIntakeExactArtifactHref }
      : null,
    sourceIntakeArtifactHref
      ? { label: "Open intake artifact", href: sourceIntakeArtifactHref }
      : null,
    sourceIntakeRoutingHref
      ? { label: "Open routing AIs", href: sourceIntakeRoutingHref }
      : null,
    sourceIntakePromptHistoryHref
      ? { label: "Open prompt history", href: sourceIntakePromptHistoryHref }
      : null,
  ].filter((item): item is InstitutionalInquiryContextLink => Boolean(item));

  const links = [...groundingLinks, ...returnLinks];
  const showSnapshot = Boolean(
    title && (facts.length || links.length || note || sourceIntakeRelationship),
  );
  const initialIssueQuestion =
    sourceTopic ??
    sourceExactRecordTitle ??
    (sourceRoom ? `Issue in ${sourceRoom}` : "");

  const summaryLines = title
    ? [
        `Institutional pilot context: ${title}`,
        note,
        ...facts.map((item) => `- ${item.label}: ${item.value}`),
        sourceIntakeRelationship ? `- Held intake relationship: ${sourceIntakeRelationship}` : null,
        groundingLinks.length
          ? "Grounding links: " + groundingLinks.map((item) => item.label).join(", ")
          : null,
        returnLinks.length
          ? "Return paths: " + returnLinks.map((item) => item.label).join(", ")
          : null,
      ].filter((item): item is string => Boolean(item))
    : [];

  return {
    sourceTopic,
    sourceRoom,
    sourceTopicHref,
    title,
    note,
    relationshipNote: sourceIntakeRelationship,
    facts,
    groundingLinks,
    returnLinks,
    links,
    showSnapshot,
    initialIssueQuestion,
    summary: summaryLines.length ? summaryLines.join("\n") : undefined,
  };
}
