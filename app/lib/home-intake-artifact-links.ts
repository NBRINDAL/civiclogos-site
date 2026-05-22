export const HOME_INTAKE_ROOM_CANDIDATES_SECTION_ID = "room-candidates";
export const HOME_INTAKE_DRAFT_TOPICS_SECTION_ID = "draft-topics";
export const HOME_INTAKE_TOPIC_CARD_PRESSURE_SECTION_ID = "intake-pressure";

export function getHomeIntakeRoomCandidateAnchor(entryId: string) {
  return `room-candidate-${entryId}`;
}

export function getHomeIntakeDraftTopicAnchor(entryId: string) {
  return `draft-topic-${entryId}`;
}

export function getHomeIntakeRoomCandidatesHref(entryId?: string) {
  return entryId
    ? `/rooms#${getHomeIntakeRoomCandidateAnchor(entryId)}`
    : `/rooms#${HOME_INTAKE_ROOM_CANDIDATES_SECTION_ID}`;
}

export function getHomeIntakeDraftTopicsHref(
  roomHref: string,
  options?: {
    entryId?: string;
    intakeId?: string;
  },
) {
  const roomContextHref = options?.intakeId
    ? `${roomHref}?intake=${options.intakeId}`
    : roomHref;
  const anchor = options?.entryId
    ? getHomeIntakeDraftTopicAnchor(options.entryId)
    : HOME_INTAKE_DRAFT_TOPICS_SECTION_ID;

  return `${roomContextHref}#${anchor}`;
}

export function getHomeIntakeTopicCardHref(
  topicHref: string,
  intakeId?: string,
) {
  if (!intakeId) {
    return topicHref;
  }

  const [pathAndQuery, hash = ""] = topicHref.split("#");
  const [path, query = ""] = pathAndQuery.split("?");
  const params = new URLSearchParams(query);
  params.set("intake", intakeId);
  const nextQuery = params.toString();

  return `${path}${nextQuery ? `?${nextQuery}` : ""}#${
    hash || HOME_INTAKE_TOPIC_CARD_PRESSURE_SECTION_ID
  }`;
}
