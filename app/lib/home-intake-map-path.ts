import {
  getRoomHref,
  getRoomTopicHref,
  roomDirectory,
  type IssueRoomSlug,
} from "./civic-logos";
import type {
  HomeIntakeRouting,
  HomeIntakeRouteKind,
  ProviderHomeIntakeRouting,
} from "./home-intake-types";

export type HomeIntakeMapPath = {
  roomSlug: IssueRoomSlug;
  roomTitle: string;
  topicId?: string;
  topicTitle?: string;
  roomHref: string;
  topicHref?: string;
  provenanceLabel: string;
  detail: string;
};

function getProviderLabel(provider: ProviderHomeIntakeRouting["provider"]) {
  return provider === "openai" ? "OpenAI" : "Claude";
}

function getPathLabel(path: {
  roomTitle: string;
  topicTitle?: string;
}) {
  return path.topicTitle ? `${path.roomTitle} / ${path.topicTitle}` : path.roomTitle;
}

function getClosestRoomFromWhyNotExistingRooms(text?: string) {
  if (!text) {
    return null;
  }

  const matchedRoom = roomDirectory.find((room) =>
    text.includes(room.title),
  );

  if (!matchedRoom) {
    return null;
  }

  return {
    roomSlug: matchedRoom.slug as IssueRoomSlug,
    roomTitle: matchedRoom.title,
  };
}

type RoutedProvider = ProviderHomeIntakeRouting & {
  routeKind: Exclude<HomeIntakeRouteKind, "new-room-draft">;
  roomSlug: IssueRoomSlug;
};

function getCompletedRoutedProviders(routing: HomeIntakeRouting): RoutedProvider[] {
  return routing.providers.filter(
    (
      provider,
    ): provider is RoutedProvider =>
      provider.state === "completed" &&
      Boolean(provider.roomSlug) &&
      Boolean(provider.routeKind) &&
      provider.routeKind !== "new-room-draft",
  );
}

export function getHomeIntakeClosestMapPath(
  routing: HomeIntakeRouting,
): HomeIntakeMapPath | null {
  if (!routing.providers.length && !routing.roomSlug) {
    return null;
  }

  if (
    routing.roomSlug &&
    routing.routeKind &&
    routing.routeKind !== "new-room-draft"
  ) {
    const roomHref = getRoomHref(routing.roomSlug);
    const topicHref =
      routing.topicId
        ? getRoomTopicHref(routing.roomSlug, routing.topicId)
        : undefined;

    return {
      roomSlug: routing.roomSlug,
      roomTitle: routing.roomTitle ?? "Current room",
      topicId: routing.topicId,
      topicTitle: routing.topicTitle,
      roomHref,
      topicHref,
      provenanceLabel: "Visible routing record",
      detail:
        routing.routeKind === "room-topic-draft"
          ? `The strongest current map read still points toward ${getPathLabel({
              roomTitle: routing.roomTitle ?? "the host room",
              topicTitle: routing.topicTitle,
            })}, but Civic Logos is holding this issue separately because that live path still leaves the pressure under-modeled.`
          : `The strongest current map read points toward ${getPathLabel({
              roomTitle: routing.roomTitle ?? "the current room",
              topicTitle: routing.topicTitle,
            })}.`,
    };
  }

  const completedProviders = getCompletedRoutedProviders(routing);
  if (!completedProviders.length) {
    const fallbackRoom = getClosestRoomFromWhyNotExistingRooms(
      routing.whyNotExistingRooms,
    );

    if (!fallbackRoom) {
      return null;
    }

    return {
      roomSlug: fallbackRoom.roomSlug,
      roomTitle: fallbackRoom.roomTitle,
      roomHref: getRoomHref(fallbackRoom.roomSlug),
      provenanceLabel: "Visible routing record",
      detail: `The visible routing record still names ${fallbackRoom.roomTitle} as the nearest current room, even though the overlap remains too weak to place this issue there confidently yet.`,
    };
  }

  const grouped = new Map<
    string,
    {
      roomSlug: IssueRoomSlug;
      roomTitle: string;
      topicId?: string;
      topicTitle?: string;
      routeKind: RoutedProvider["routeKind"];
      providers: Set<string>;
      count: number;
    }
  >();

  for (const provider of completedProviders) {
    const key = [
      provider.roomSlug,
      provider.topicId ?? "",
      provider.topicTitle ?? "",
      provider.routeKind,
    ].join("::");
    const existing = grouped.get(key);
    if (existing) {
      existing.providers.add(getProviderLabel(provider.provider));
      existing.count += 1;
      continue;
    }

    grouped.set(key, {
      roomSlug: provider.roomSlug,
      roomTitle: provider.roomTitle ?? "Current room",
      topicId: provider.topicId,
      topicTitle: provider.topicTitle,
      routeKind: provider.routeKind,
      providers: new Set([getProviderLabel(provider.provider)]),
      count: 1,
    });
  }

  const bestPath = [...grouped.values()].sort((left, right) => {
    if (left.count !== right.count) {
      return right.count - left.count;
    }

    if (Boolean(left.topicId) !== Boolean(right.topicId)) {
      return left.topicId ? -1 : 1;
    }

    if (left.routeKind !== right.routeKind) {
      return left.routeKind === "existing-room" ? -1 : 1;
    }

    return left.roomTitle.localeCompare(right.roomTitle);
  })[0];

  if (!bestPath) {
    return null;
  }

  const providerLabels = [...bestPath.providers];
  const provenanceLabel =
    providerLabels.length >= 2
      ? "Both routing AIs"
      : `${providerLabels[0]} only`;
  const roomHref = getRoomHref(bestPath.roomSlug);
  const topicHref =
    bestPath.topicId
      ? getRoomTopicHref(bestPath.roomSlug, bestPath.topicId)
      : undefined;

  return {
    roomSlug: bestPath.roomSlug,
    roomTitle: bestPath.roomTitle,
    topicId: bestPath.topicId,
    topicTitle: bestPath.topicTitle,
    roomHref,
    topicHref,
    provenanceLabel,
    detail:
      bestPath.routeKind === "room-topic-draft"
        ? `${provenanceLabel} still sees ${getPathLabel(bestPath)} as the nearest current map path, but the issue is being held separately because that live path still leaves the pressure under-modeled.`
        : `${provenanceLabel} still sees ${getPathLabel(bestPath)} as the nearest current map path even though the artifact is being held outside the active map for now.`,
  };
}
