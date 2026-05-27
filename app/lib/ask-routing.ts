import type {
  CandidateRejectedRoute,
  CandidateRouteConfidence,
  CandidateRoutingStatus,
} from "./candidate-types";
import {
  getFoundationalPhysicsRoutingSignals,
  getFoundationalPhysicsRoutingScore,
  getHealthcareRoutingSignals,
  getHealthcareRoutingScore,
  hasFoundationalPhysicsSignal,
  hasHealthcareAskSignal,
} from "./ask-intake-signals";
import { getRoomTopicCard, type IssueRoomSlug } from "./civic-logos";

export const unroutedCandidateRoomId = "unrouted";
export const unroutedCandidateTopicId = "unrouted";

type AskRouteMetadata = {
  routingStatus: CandidateRoutingStatus;
  routedRoomId?: string;
  routedTopicId?: string;
  routeConfidence: CandidateRouteConfidence;
  routeReason: string;
  matchedSignals: string[];
  rejectedRoutes: CandidateRejectedRoute[];
  fitSummary?: string;
};

export type AskExistingTopicRoute = AskRouteMetadata & {
  routeType: "existing-topic";
  roomId: IssueRoomSlug;
  topicId: string;
  topicTitle: string;
  banner: string;
};

export type AskUnroutedCandidateRoute = AskRouteMetadata & {
  routeType: "unrouted";
  roomId: typeof unroutedCandidateRoomId;
  topicId: typeof unroutedCandidateTopicId;
  topicTitle: "Unrouted candidate";
  banner: string;
};

export type AskCandidateRoute = AskExistingTopicRoute | AskUnroutedCandidateRoute;

type TopicRouteCandidate = {
  roomId: IssueRoomSlug;
  topicId: string;
  topicTitle: string;
  routeConfidence: CandidateRouteConfidence;
  matchedSignals: string[];
  routeReason: string;
  score: number;
};

const healthcareRouteTarget = {
  roomId: "healthcare" as const,
  topicId: "topic-001",
};

const physicsRouteTarget = {
  roomId: "physics-foundations" as const,
  topicId: "topic-001",
};

function formatSignalList(labels: readonly string[]) {
  return labels.join(", ");
}

function getTopicTitle(roomId: IssueRoomSlug, topicId: string) {
  return getRoomTopicCard(roomId, topicId)?.title ?? topicId;
}

function buildTopicBanner(args: {
  roomId: IssueRoomSlug;
  topicId: string;
  routeConfidence: CandidateRouteConfidence;
}) {
  return `Provisionally routed to existing topic: ${args.roomId} / ${args.topicId} (${args.routeConfidence} confidence). Candidate only, pending human review, with no public ledger write.`;
}

function buildUnroutedBanner(reason: string) {
  return `${reason} Candidate only, pending maintainer routing or human review, with no public ledger write.`;
}

function asRejectedRoute(candidate: TopicRouteCandidate): CandidateRejectedRoute {
  return {
    roomId: candidate.roomId,
    topicId: candidate.topicId,
    confidence: candidate.routeConfidence,
    reason: candidate.routeReason,
    matchedSignals: candidate.matchedSignals,
  };
}

function buildExistingTopicRoute(candidate: TopicRouteCandidate, alternatives: TopicRouteCandidate[]) {
  return {
    routeType: "existing-topic" as const,
    roomId: candidate.roomId,
    topicId: candidate.topicId,
    topicTitle: candidate.topicTitle,
    banner: buildTopicBanner({
      roomId: candidate.roomId,
      topicId: candidate.topicId,
      routeConfidence: candidate.routeConfidence,
    }),
    routingStatus: "routed" as const,
    routedRoomId: candidate.roomId,
    routedTopicId: candidate.topicId,
    routeConfidence: candidate.routeConfidence,
    routeReason: candidate.routeReason,
    matchedSignals: candidate.matchedSignals,
    rejectedRoutes: alternatives.map(asRejectedRoute),
    fitSummary: candidate.routeReason,
  };
}

function buildUnroutedRoute(args: {
  reason: string;
  routingStatus: CandidateRoutingStatus;
  routeConfidence: CandidateRouteConfidence;
  matchedSignals?: string[];
  routedRoomId?: string;
  routedTopicId?: string;
  rejectedRoutes?: CandidateRejectedRoute[];
}): AskUnroutedCandidateRoute {
  return {
    routeType: "unrouted" as const,
    roomId: unroutedCandidateRoomId,
    topicId: unroutedCandidateTopicId,
    topicTitle: "Unrouted candidate" as const,
    banner: buildUnroutedBanner(args.reason),
    routingStatus: args.routingStatus,
    routedRoomId: args.routedRoomId,
    routedTopicId: args.routedTopicId,
    routeConfidence: args.routeConfidence,
    routeReason: args.reason,
    matchedSignals: args.matchedSignals ?? [],
    rejectedRoutes: args.rejectedRoutes ?? [],
    fitSummary: args.reason,
  };
}

function classifyHealthcareRoute(rawUserText: string): TopicRouteCandidate | null {
  const matchedSignals = getHealthcareRoutingSignals(rawUserText);
  const score = getHealthcareRoutingScore(rawUserText);

  if (!matchedSignals.length) {
    return null;
  }

  const labels = matchedSignals.map((signal) => signal.label);
  const hasCoreSignal =
    labels.includes("savings-capture assumption") ||
    labels.includes("administrative simplification") ||
    labels.includes("AI triage");
  const hasContextSignal =
    labels.includes("healthcare institutions") ||
    labels.includes("care stakeholders") ||
    labels.includes("human escalation") ||
    labels.includes("liability") ||
    labels.includes("transition costs");
  const routeConfidence: CandidateRouteConfidence =
    labels.includes("savings-capture assumption") || (hasCoreSignal && score >= 5)
      ? "high"
      : hasCoreSignal && hasContextSignal
        ? "medium"
        : score >= 6 && hasContextSignal
          ? "medium"
          : "low";
  const topicTitle = getTopicTitle(
    healthcareRouteTarget.roomId,
    healthcareRouteTarget.topicId,
  );

  return {
    roomId: healthcareRouteTarget.roomId,
    topicId: healthcareRouteTarget.topicId,
    topicTitle,
    routeConfidence,
    matchedSignals: labels,
    routeReason:
      routeConfidence === "low"
        ? `Healthcare was considered, but the signal stayed weak: ${formatSignalList(labels)}.`
        : `Routed to ${topicTitle} because the input matched healthcare signals: ${formatSignalList(labels)}.`,
    score,
  };
}

function classifyPhysicsRoute(rawUserText: string): TopicRouteCandidate | null {
  const matchedSignals = getFoundationalPhysicsRoutingSignals(rawUserText);
  const score = getFoundationalPhysicsRoutingScore(rawUserText);

  if (!matchedSignals.length) {
    return null;
  }

  const labels = matchedSignals.map((signal) => signal.label);
  const strongAnchors = [
    "known symbolic sequence pattern",
    "quantum gravity",
    "Planck",
    "general relativity",
    "QM and GR baseline",
    "foundational physics",
  ];
  const contextSignals = [
    "collapse sequence",
    "physical structure",
    "definitions vs evidence",
    "symbolic/foundational framing",
    "hbar or constants",
    "quantum",
  ];
  const strongAnchorCount = strongAnchors.filter((label) => labels.includes(label)).length;
  const contextCount = contextSignals.filter((label) => labels.includes(label)).length;
  const routeConfidence: CandidateRouteConfidence =
    labels.includes("known symbolic sequence pattern") ||
    labels.includes("quantum gravity") ||
    (strongAnchorCount >= 2 && score >= 6)
      ? "high"
      : strongAnchorCount >= 1 && (contextCount >= 1 || score >= 6)
        ? "medium"
        : "low";
  const topicTitle = getTopicTitle(
    physicsRouteTarget.roomId,
    physicsRouteTarget.topicId,
  );

  return {
    roomId: physicsRouteTarget.roomId,
    topicId: physicsRouteTarget.topicId,
    topicTitle,
    routeConfidence,
    matchedSignals: labels,
    routeReason:
      routeConfidence === "low"
        ? `Physics Foundations was considered, but the signal stayed weak: ${formatSignalList(labels)}.`
        : `Routed to ${topicTitle} because the input matched symbolic or foundational-science signals: ${formatSignalList(labels)}.`,
    score,
  };
}

function compareCandidates(left: TopicRouteCandidate, right: TopicRouteCandidate) {
  const confidenceRank: Record<CandidateRouteConfidence, number> = {
    high: 3,
    medium: 2,
    low: 1,
  };
  const confidenceDelta =
    confidenceRank[right.routeConfidence] - confidenceRank[left.routeConfidence];

  if (confidenceDelta !== 0) {
    return confidenceDelta;
  }

  return right.score - left.score;
}

function isMixedRoute(
  primary: TopicRouteCandidate,
  secondary?: TopicRouteCandidate,
) {
  if (!secondary) {
    return false;
  }

  if (secondary.routeConfidence !== "low") {
    return true;
  }

  return secondary.score >= 4 && primary.score - secondary.score <= 2;
}

function buildRejectedRoute(args: {
  primary: TopicRouteCandidate;
  secondary?: TopicRouteCandidate;
}) {
  const rejectedRoutes = [args.primary, args.secondary]
    .filter((candidate): candidate is TopicRouteCandidate => Boolean(candidate))
    .map(asRejectedRoute);
  const isMixed = isMixedRoute(args.primary, args.secondary);
  const reason = isMixed
    ? `Needs routing: Civic Logos found competing topic signals and refused to force a best-guess route. Considered ${rejectedRoutes
        .map((route) => `${route.roomId} / ${route.topicId}`)
        .join(" and ")}.`
    : `Needs routing: Civic Logos found a possible topic match, but the confidence stayed ${args.primary.routeConfidence}.`;

  return buildUnroutedRoute({
    reason,
    routingStatus: "rejected_route",
    routeConfidence: args.primary.routeConfidence,
    routedRoomId: args.primary.roomId,
    routedTopicId: args.primary.topicId,
    matchedSignals: args.primary.matchedSignals,
    rejectedRoutes,
  });
}

export function isUnroutedCandidateRoute(
  route: AskCandidateRoute,
): route is AskUnroutedCandidateRoute {
  return route.routeType === "unrouted";
}

export async function routeAskCandidate(rawUserText: string): Promise<AskCandidateRoute> {
  const healthcareCandidate = classifyHealthcareRoute(rawUserText);
  const physicsCandidate = classifyPhysicsRoute(rawUserText);
  const routedCandidates = [healthcareCandidate, physicsCandidate]
    .filter((candidate): candidate is TopicRouteCandidate => Boolean(candidate))
    .sort(compareCandidates);
  const [primary, secondary] = routedCandidates;

  if (!primary) {
    return buildUnroutedRoute({
      reason:
        "Needs routing: Civic Logos could not confidently attach this to an existing topic.",
      routingStatus: "needs_routing",
      routeConfidence: "low",
    });
  }

  if (isMixedRoute(primary, secondary)) {
    return buildRejectedRoute({
      primary,
      secondary,
    });
  }

  if (primary.routeConfidence === "low") {
    return buildRejectedRoute({
      primary,
      secondary,
    });
  }

  if (
    primary.roomId === "healthcare" &&
    !hasHealthcareAskSignal(rawUserText)
  ) {
    return buildRejectedRoute({
      primary,
      secondary,
    });
  }

  if (
    primary.roomId === "physics-foundations" &&
    !hasFoundationalPhysicsSignal(rawUserText)
  ) {
    return buildRejectedRoute({
      primary,
      secondary,
    });
  }

  return buildExistingTopicRoute(primary, secondary ? [secondary] : []);
}
