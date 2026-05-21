import Link from "next/link";
import {
  getRoomTopicHref,
  type IssueRoomSlug,
} from "../lib/civic-logos";
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
  if (
    entry.routing.routeKind !== "existing-room" ||
    entry.routing.roomSlug !== currentRoomSlug
  ) {
    return null;
  }

  const suggestedTopicHref =
    entry.routing.topicId
      ? getRoomTopicHref(currentRoomSlug, entry.routing.topicId)
      : undefined;

  return (
    <section className={styles.banner}>
      <div className={styles.copy}>
        <span className={styles.eyebrow}>AI route</span>
        <h2>This idea was routed into this room from the homepage intake.</h2>
        <p className={styles.summary}>
          {entry.routing.fitSummary ??
            "The current room map judged this question to be a better fit here than in the other active rooms."}
        </p>
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
          <span>Suggested topic</span>
          <strong>
            {entry.routing.topicTitle ??
              entry.routing.suggestedTopicTitle ??
              "Stay at room level"}
          </strong>
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
              Open suggested topic
            </Link>
          ) : null}
          <Link className={styles.secondaryAction} href={currentRoomHref}>
            Stay in this room
          </Link>
        </div>
      </div>
    </section>
  );
}
