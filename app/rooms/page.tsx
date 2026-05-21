import { cookies } from "next/headers";
import Link from "next/link";
import LiveCardBrowser from "../components/live-card-browser";
import {
  getHomeIntakeCookieName,
  parseHomeIntakeCookie,
} from "../lib/home-intake-cookie";
import { listHomeIntakeEntries } from "../lib/home-intake-store";
import type { HomeIntakeRecord } from "../lib/home-intake-types";
import {
  getInspectableTopics,
  getLiveCardIndex,
  issueRooms,
  roomDirectory,
  type IssueRoomSlug,
} from "../lib/civic-logos";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

function mergeLatestCookieCandidate(
  roomCandidates: HomeIntakeRecord[],
  cookieCandidate: HomeIntakeRecord | null,
) {
  if (!cookieCandidate) {
    return roomCandidates;
  }

  if (roomCandidates.some((item) => item.id === cookieCandidate.id)) {
    return roomCandidates;
  }

  return [cookieCandidate, ...roomCandidates].slice(0, 6);
}

function getCandidatePromptCount(entry: HomeIntakeRecord) {
  return entry.promptCount ?? entry.relatedPrompts?.length ?? 1;
}

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<{
    room?: string | string[];
    q?: string | string[];
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const cookieStore = await cookies();
  const latestCookieIntake = parseHomeIntakeCookie(
    cookieStore.get(getHomeIntakeCookieName())?.value,
  );
  const initialRoom = Array.isArray(resolvedSearchParams.room)
    ? resolvedSearchParams.room[0]
    : resolvedSearchParams.room;
  const initialQuery = Array.isArray(resolvedSearchParams.q)
    ? resolvedSearchParams.q[0]
    : resolvedSearchParams.q;
  const [liveCardIndex, roomCandidates] = await Promise.all([
    Promise.resolve(getLiveCardIndex()),
    listHomeIntakeEntries({
      routeKind: "new-room-draft",
      limit: 6,
    }),
  ]);
  const cookieCandidate =
    latestCookieIntake?.routing.routeKind === "new-room-draft"
      ? ({
          id: latestCookieIntake.id,
          prompt: latestCookieIntake.prompt,
          createdAt: "",
          updatedAt: "",
          promptCount:
            latestCookieIntake.promptCount ??
            latestCookieIntake.relatedPrompts?.length ??
            1,
          relatedPrompts: latestCookieIntake.relatedPrompts,
          routing: latestCookieIntake.routing,
        } satisfies HomeIntakeRecord)
      : null;
  const visibleRoomCandidates = mergeLatestCookieCandidate(
    roomCandidates,
    cookieCandidate,
  );
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
                <strong>{visibleRoomCandidates.length}</strong>
                <span>room candidates on deck</span>
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

        <section className={styles.section} id="room-candidates">
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>Room candidates</span>
            <h2>Unmapped questions should still become part of the civic map.</h2>
            <p>
              When an idea does not fit the current room set, Civic Logos should
              still hold it as a durable room candidate. These candidates are not
              official rooms yet, but they are no longer disposable one-off answers.
            </p>
          </div>

          {visibleRoomCandidates.length ? (
            <div className={styles.roomGrid}>
              {visibleRoomCandidates.map((entry) => (
                <article className={styles.roomCard} key={entry.id}>
                  <div className={styles.roomMeta}>
                    <span>{entry.routing.routeConfidence ?? "working draft"}</span>
                    <strong>Room candidate</strong>
                  </div>

                  <h3>
                    {entry.routing.suggestedTopicTitle ??
                      entry.routing.suggestedCentralQuestion ??
                      "Unmapped public question"}
                  </h3>
                  <p>
                    {entry.routing.fitSummary ??
                      entry.routing.suggestedTopicSummary ??
                      "This candidate was opened because the current room map did not cleanly absorb the idea yet."}
                  </p>

                  {entry.routing.suggestedCentralQuestion ? (
                    <div className={styles.liveCardNote}>
                      <span>Central question</span>
                      <strong>{entry.routing.suggestedCentralQuestion}</strong>
                    </div>
                  ) : null}

                  <div className={styles.roomFooter}>
                    <span>
                      {getCandidatePromptCount(entry)} prompt
                      {getCandidatePromptCount(entry) === 1 ? "" : "s"} attached
                    </span>
                    <span>
                      {entry.updatedAt
                        ? `Updated ${new Date(entry.updatedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}`
                        : entry.createdAt
                          ? `Created ${new Date(entry.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}`
                          : "Current browser-session candidate"}
                    </span>

                    <div className={styles.roomActions}>
                      <Link className={styles.roomLink} href={`/intake/${entry.id}`}>
                        Open candidate
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <article className={styles.roomCard}>
              <div className={styles.roomMeta}>
                <span>No candidates yet</span>
                <strong>Waiting for new unmapped questions</strong>
              </div>
              <h3>The room map still has blank edges.</h3>
              <p>
                When a public question does not belong cleanly inside the current
                rooms, Civic Logos should hold it here until the map grows.
              </p>
            </article>
          )}
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

          <LiveCardBrowser
            cards={liveCardIndex}
            initialQuery={initialQuery}
            initialRoom={initialRoom}
          />
        </section>
      </main>
    </div>
  );
}
