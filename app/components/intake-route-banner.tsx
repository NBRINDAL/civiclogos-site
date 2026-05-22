import Link from "next/link";
import {
  getRoomTopicHref,
  type IssueRoomSlug,
} from "../lib/civic-logos";
import { getHomeIntakeClosestMapPath } from "../lib/home-intake-map-path";
import type { HomeIntakeRecord } from "../lib/home-intake-types";
import styles from "./intake-route-banner.module.css";

type IntakeRouteBannerProps = {
  currentRoomHref: string;
  currentRoomSlug: IssueRoomSlug;
  entry: HomeIntakeRecord;
};

export default function IntakeRouteBanner({
  currentRoomHref,
  currentRoomSlug,
  entry,
}: IntakeRouteBannerProps) {
  const closestMapPath = getHomeIntakeClosestMapPath(entry.routing);
  const isExistingRoomRoute =
    entry.routing.routeKind === "existing-room" &&
    entry.routing.roomSlug === currentRoomSlug;
  const isDraftTopicPressure =
    entry.routing.routeKind === "room-topic-draft" &&
    entry.routing.roomSlug === currentRoomSlug;
  const isNearestCurrentRoom =
    entry.routing.routeKind === "new-room-draft" &&
    closestMapPath?.roomSlug === currentRoomSlug;

  if (!isExistingRoomRoute && !isDraftTopicPressure && !isNearestCurrentRoom) {
    return null;
  }

  const suggestedTopicHref =
    closestMapPath?.topicHref ??
    (entry.routing.topicId
      ? getRoomTopicHref(currentRoomSlug, entry.routing.topicId)
      : undefined);
  const intakeHref = `/intake/${entry.id}`;
  const eyebrow = isExistingRoomRoute
    ? "AI route"
    : isDraftTopicPressure
      ? "Draft topic pressure"
      : "Nearest current room";
  const title = isExistingRoomRoute
    ? "This idea was routed into this room from the homepage intake."
    : isDraftTopicPressure
      ? "This room is currently holding this idea as a durable draft topic from the homepage intake."
      : "This room is the nearest current map path for a room candidate still being held outside the active map.";
  const summary = isNearestCurrentRoom
    ? closestMapPath?.detail ??
      entry.routing.fitSummary ??
      "The active map still does not absorb this issue cleanly enough, but this room is currently the closest place it could belong."
    : entry.routing.fitSummary ??
      "The current room map judged this question to be a better fit here than in the other active rooms.";
  const relationshipLabel = isExistingRoomRoute
    ? "Suggested topic"
    : isDraftTopicPressure
      ? "Draft topic"
      : "Current map path";
  const relationshipValue = isExistingRoomRoute
    ? entry.routing.topicTitle ??
      entry.routing.suggestedTopicTitle ??
      "Stay at room level"
    : closestMapPath?.topicTitle ??
      entry.routing.topicTitle ??
      entry.routing.suggestedTopicTitle ??
      (isDraftTopicPressure ? "Draft topic pressure" : "Closest current room");
  const roomContextHref = isDraftTopicPressure
    ? `${currentRoomHref}?intake=${entry.id}#draft-topics`
    : `${currentRoomHref}?intake=${entry.id}`;
  const roomContextLabel = isDraftTopicPressure
    ? "Open room draft topics"
    : isNearestCurrentRoom
      ? "Open this room in context"
      : "Stay in this room";

  return (
    <section className={styles.banner}>
      <div className={styles.copy}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h2>{title}</h2>
        <p className={styles.summary}>{summary}</p>
        <blockquote className={styles.promptQuote}>
          <p>{entry.prompt}</p>
        </blockquote>
      </div>

      <div className={styles.metaPanel}>
        <div className={styles.metaItem}>
          <span>Route confidence</span>
          <strong>{entry.routing.routeConfidence ?? "working draft"}</strong>
        </div>
        <div className={styles.metaItem}>
          <span>{relationshipLabel}</span>
          <strong>{relationshipValue}</strong>
        </div>

        {entry.routing.suggestedFirstQuestions?.length ? (
          <div className={styles.questionBlock}>
            <span>Suggested first questions</span>
            <ul>
              {entry.routing.suggestedFirstQuestions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className={styles.actions}>
          {suggestedTopicHref ? (
            <Link className={styles.primaryAction} href={suggestedTopicHref}>
              {isDraftTopicPressure || isNearestCurrentRoom
                ? "Open closest live card"
                : "Open suggested topic"}
            </Link>
          ) : null}
          <Link className={styles.secondaryAction} href={roomContextHref}>
            {roomContextLabel}
          </Link>
          <Link className={styles.secondaryAction} href={intakeHref}>
            Open intake artifact
          </Link>
        </div>
      </div>
    </section>
  );
}
