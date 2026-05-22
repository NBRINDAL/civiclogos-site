export const HOME_INTAKE_ROOM_CANDIDATES_SECTION_ID = "room-candidates";
export const HOME_INTAKE_DRAFT_TOPICS_SECTION_ID = "draft-topics";

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
