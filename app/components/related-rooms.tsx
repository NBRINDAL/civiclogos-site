import Link from "next/link";
import {
  getInspectableTopics,
  getRelatedRooms,
  issueRooms,
  type IssueRoomSlug,
} from "../lib/civic-logos";
import styles from "./related-rooms.module.css";

type RelatedRoomsProps = {
  currentRoomSlug: IssueRoomSlug;
  intro: string;
  title: string;
};

export default function RelatedRooms({
  currentRoomSlug,
  intro,
  title,
}: RelatedRoomsProps) {
  const relatedRooms = getRelatedRooms(currentRoomSlug);

  return (
    <section className={styles.section} id="adjacent-rooms">
      <div className={styles.sectionIntro}>
        <span className={styles.eyebrow}>Adjacent rooms</span>
        <h2>{title}</h2>
        <p>{intro}</p>
      </div>

      <div className={styles.grid}>
        {relatedRooms.map((room) => {
          const roomData = issueRooms[room.slug as IssueRoomSlug];
          const inspectableTopics = getInspectableTopics(roomData);
          const firstLiveCard = inspectableTopics[0];

          return (
            <article className={styles.card} key={room.slug}>
              <div className={styles.meta}>
                <span>{room.domain}</span>
                <strong>{room.stage}</strong>
              </div>

              <h3>{room.title}</h3>
              <p>{room.summary}</p>

              {firstLiveCard ? (
                <div className={styles.liveNote}>
                  <span>First live card</span>
                  <strong>{firstLiveCard.title}</strong>
                </div>
              ) : null}

              <div className={styles.footer}>
                <span>
                  {inspectableTopics.length} live topic
                  {inspectableTopics.length === 1 ? " card" : " cards"}
                </span>

                <div className={styles.actions}>
                  <Link className={styles.primaryAction} href={room.href}>
                    Open room
                  </Link>
                  {firstLiveCard ? (
                    <Link
                      className={styles.secondaryAction}
                      href={firstLiveCard.href!}
                    >
                      Open live card
                    </Link>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
