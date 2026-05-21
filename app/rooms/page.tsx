import Link from "next/link";
import {
  getInspectableTopics,
  issueRooms,
  roomDirectory,
  type IssueRoomSlug,
} from "../lib/civic-logos";
import styles from "./page.module.css";

export default function RoomsPage() {
  const liveCardIndex = roomDirectory.flatMap((room) => {
    const roomData = issueRooms[room.slug as IssueRoomSlug];
    const inspectableTopics = getInspectableTopics(roomData);

    return inspectableTopics.map((card) => ({
      ...card,
      roomHref: room.href,
      roomTitle: room.title,
      roomStage: room.stage,
    }));
  });

  const totalInspectableCards = roomDirectory.reduce((total, room) => {
    const roomData = issueRooms[room.slug as IssueRoomSlug];
    return total + getInspectableTopics(roomData).length;
  }, 0);

  return (
    <div className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.headerBar}>
          <Link className={styles.brand} href="/">
            <span className={styles.brandMark}>CL</span>
            <span className={styles.brandText}>
              <strong>Civic Logos</strong>
              <span>Issue room library</span>
            </span>
          </Link>

          <nav className={styles.nav}>
            <Link href="/">Home</Link>
            <Link href="/healthcare">Healthcare room</Link>
            <a href="#room-grid">Room grid</a>
            <a href="#card-index">Card index</a>
          </nav>
        </div>

        <div className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Room library</span>
            <h1>One room proves the mechanism. Several rooms prove the system.</h1>
            <p className={styles.lead}>
              Healthcare was a good first prototype, but the paper clearly
              points toward a wider civilizational room set: governance,
              housing, education, institutional trust, economics, AI, energy,
              and more.
            </p>
            <p className={styles.supporting}>
              This library is the first step away from a single-topic demo and
              toward a real public reasoning network. Some rooms are more
              developed than others, but all of them are seeded from the
              structure in the paper.
            </p>
          </div>

          <aside className={styles.heroPanel}>
            <span className={styles.panelLabel}>Current room set</span>
            <div className={styles.heroStats}>
              <div>
                <strong>{roomDirectory.length}</strong>
                <span>rooms in view</span>
              </div>
              <div>
                <strong>{totalInspectableCards}</strong>
                <span>live topic cards</span>
              </div>
              <div>
                <strong>{roomDirectory.length - 1}</strong>
                <span>heavier seeded drafts</span>
              </div>
            </div>
          </aside>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.section}>
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>Why expand now</span>
            <h2>The product gets more credible when it can hold different kinds of complexity.</h2>
            <p>
              Healthcare is institutionally rich, but it is still a familiar
              policy room. A stronger proof of Civic Logos is that the same
              structure can also hold governance, housing, labor automation, and
              institutional trust without collapsing into generic commentary.
            </p>
          </div>
        </section>

        <section className={styles.section} id="room-grid">
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>Room grid</span>
            <h2>Each room should eventually become a living workspace, not a content category.</h2>
          </div>

          <div className={styles.roomGrid}>
            {roomDirectory.map((room) => {
              const inspectableTopics = getInspectableTopics(
                issueRooms[room.slug as IssueRoomSlug],
              );
              const firstLiveCard = inspectableTopics[0];

              return (
                <article className={styles.roomCard} key={room.slug}>
                  <div className={styles.roomMeta}>
                    <span>{room.domain}</span>
                    <strong>{room.complexity}</strong>
                  </div>

                  <h3>{room.title}</h3>
                  <p>{room.summary}</p>

                  {firstLiveCard ? (
                    <div className={styles.liveCardNote}>
                      <span>First live card</span>
                      <strong>{firstLiveCard.title}</strong>
                    </div>
                  ) : null}

                  <div className={styles.roomFooter}>
                    <span>
                      {room.stage} · {inspectableTopics.length} live topic
                      {inspectableTopics.length === 1 ? " card" : " cards"}
                    </span>

                    <div className={styles.roomActions}>
                      <Link className={styles.roomLink} href={room.href}>
                        Open room
                      </Link>
                      {firstLiveCard ? (
                        <Link
                          className={styles.roomSubLink}
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

        <section className={styles.section} id="card-index">
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>Live card index</span>
            <h2>The room layer explains the system. The card layer shows the work.</h2>
            <p>
              These are the inspectable topic cards currently live across Civic
              Logos. This index makes the site navigable at the object level,
              so readers can jump straight into the strongest seeded lines of
              reasoning without scanning every room first.
            </p>
          </div>

          <div className={styles.cardIndexGrid}>
            {liveCardIndex.map((card) => (
              <article className={styles.cardIndexItem} key={card.href}>
                <div className={styles.cardIndexMeta}>
                  <span>{card.roomTitle}</span>
                  <strong>{card.metric}</strong>
                </div>

                <h3>{card.title}</h3>
                <p>{card.summary}</p>

                <div className={styles.cardIndexFooter}>
                  <span>{card.roomStage}</span>

                  <div className={styles.cardIndexActions}>
                    <Link className={styles.cardIndexPrimary} href={card.href!}>
                      Open card
                    </Link>
                    <Link className={styles.cardIndexSecondary} href={card.roomHref}>
                      Open room
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
