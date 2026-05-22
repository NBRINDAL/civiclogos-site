import type {
  HomeIntakeRouteKind,
  HomeIntakeRouting,
  ProviderHomeIntakeRouting,
} from "./home-intake-types";

type RoutingConsensus = {
  headline: string;
  detail: string;
};

function getProviderLabel(provider: ProviderHomeIntakeRouting["provider"]) {
  return provider === "openai" ? "OpenAI" : "Claude";
}

function getRouteLabel(routeKind: HomeIntakeRouteKind) {
  if (routeKind === "existing-room") {
    return "current room";
  }

  if (routeKind === "room-topic-draft") {
    return "room-attached draft topic";
  }

  return "room candidate";
}

function getProviderRouteTarget(provider: ProviderHomeIntakeRouting) {
  if (provider.routeKind === "existing-room") {
    return provider.roomTitle ?? "current room";
  }

  if (provider.routeKind === "room-topic-draft") {
    if (provider.topicTitle) {
      return `${provider.roomTitle ?? "current room"} / ${provider.topicTitle}`;
    }

    return provider.roomTitle ?? "current room";
  }

  return "outside the current room map";
}

function getCurrentRouteTarget(routing: HomeIntakeRouting) {
  if (routing.routeKind === "existing-room") {
    return routing.roomTitle ?? "current room";
  }

  if (routing.routeKind === "room-topic-draft") {
    if (routing.topicTitle) {
      return `${routing.roomTitle ?? "current room"} / ${routing.topicTitle}`;
    }

    return routing.roomTitle ?? "current room";
  }

  return "outside the current room map";
}

export function summarizeHomeIntakeRoutingConsensus(
  routing: HomeIntakeRouting,
): RoutingConsensus | null {
  const completedProviders = routing.providers.filter(
    (provider): provider is ProviderHomeIntakeRouting & { routeKind: HomeIntakeRouteKind } =>
      provider.state === "completed" && Boolean(provider.routeKind),
  );

  if (!completedProviders.length) {
    return {
      headline: "Routing AIs unavailable",
      detail:
        "Neither routing AI returned a complete map read, so Civic Logos is holding the current artifact with incomplete model provenance.",
    };
  }

  if (completedProviders.length === 1) {
    const provider = completedProviders[0];
    return {
      headline: "Single routing AI completed",
      detail: `${getProviderLabel(provider.provider)} produced the visible ${getRouteLabel(
        provider.routeKind,
      )} read toward ${getProviderRouteTarget(provider)}, while the other routing AI did not return a usable result.`,
    };
  }

  const distinctRoutes = new Map<string, ProviderHomeIntakeRouting[]>();

  for (const provider of completedProviders) {
    const routeKey = [
      provider.routeKind,
      provider.roomSlug ?? "",
      provider.topicId ?? "",
      provider.topicTitle ?? "",
    ].join("::");
    const existing = distinctRoutes.get(routeKey) ?? [];
    existing.push(provider);
    distinctRoutes.set(routeKey, existing);
  }

  if (distinctRoutes.size === 1) {
    const provider = completedProviders[0];
    if (provider.routeKind === "existing-room") {
      return {
        headline: "Routing AIs aligned",
        detail: `Both routing AIs pointed to ${provider.roomTitle ?? "the current room"} as the cleanest current home for this idea.`,
      };
    }

    if (provider.routeKind === "room-topic-draft") {
      return {
        headline: "Routing AIs aligned",
        detail: `Both routing AIs pointed to ${provider.roomTitle ?? "the host room"} but agreed the current live cards still did not absorb the pressure cleanly enough, so Civic Logos opened a durable draft topic instead.`,
      };
    }

    return {
      headline: "Routing AIs aligned",
      detail:
        "Both routing AIs treated this issue as still outside the active room map, so Civic Logos is holding it as a room candidate instead of forcing a weak fit.",
    };
  }

  const providerTargets = completedProviders
    .map((provider) => `${getProviderLabel(provider.provider)}: ${getProviderRouteTarget(provider)}`)
    .join(" | ");

  return {
    headline: "Routing AIs split",
    detail: `The routing AIs did not fully agree on the cleanest map placement. Civic Logos is currently holding the artifact at ${getCurrentRouteTarget(
      routing,
    )}, while keeping the separate model reads visible: ${providerTargets}.`,
  };
}
