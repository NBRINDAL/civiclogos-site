import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import IntakeRouteBanner from "../../components/intake-route-banner";
import RelatedRooms from "../../components/related-rooms";
import RoomGuide from "../../components/room-guide";
import {
  getInspectableTopics,
  issueRooms,
  type IssueRoomData,
  type IssueRoomSlug,
} from "../../lib/civic-logos";
import {
  getHomeIntakeCookieName,
  parseHomeIntakeCookie,
} from "../../lib/home-intake-cookie";
import { getHomeIntakeEntry } from "../../lib/home-intake-store";
import styles from "../../healthcare/page.module.css";

function ProposalTrack({
  title,
  intro,
  items,
}: {
  title: string;
  intro: string;
  items: readonly {
    title: string;
    summary: string;
    label: string;
    metric: string;
    href?: string;
  }[];
}) {
  return (
    <article className={styles.trackCard}>
      <div className={styles.trackHeader}>
        <span className={styles.trackLabel}>{title}</span>
        <p>{intro}</p>
      </div>

      <div className={styles.trackList}>
        {items.map((item) => {
          const content = (
            <>
              <div className={styles.trackMeta}>
                <span>{item.label}</span>
                <strong>{item.metric}</strong>
              </div>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
            </>
          );

          return item.href ? (
            <Link className={styles.trackItem} href={item.href} key={item.title}>
              {content}
            </Link>
          ) : (
            <article className={styles.trackItem} key={item.title}>
              {content}
            </article>
          );
        })}
      </div>
    </article>
  );
}

export function generateStaticParams() {
  return Object.keys(issueRooms)
    .filter((slug) => slug !== "healthcare")
    .map((slug) => ({ slug }));
}

function getSingleSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  return Array.isArray(value) ? value[0] : undefined;
}

export default async function IssueRoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ intake?: string | string[] }>;
}) {
  const { slug } = await params;
  const { intake } = await searchParams;
  const roomSlug = slug as IssueRoomSlug;
  const room = issueRooms[roomSlug] as IssueRoomData | undefined;

  if (!room || roomSlug === "healthcare") {
    notFound();
  }

  const inspectableTopics = getInspectableTopics(room);
  const firstLiveCard = inspectableTopics[0];
  const intakeId = getSingleSearchParam(intake);
  const cookieStore = await cookies();
  const cookieEntry = parseHomeIntakeCookie(
    cookieStore.get(getHomeIntakeCookieName())?.value,
  );
  const routeEntry =
    intakeId && cookieEntry?.id === intakeId
      ? {
          id: cookieEntry.id,
          prompt: cookieEntry.prompt,
          createdAt: "",
          updatedAt: "",
          routing: cookieEntry.routing,
        }
      : intakeId
        ? await getHomeIntakeEntry(intakeId)
        : null;

  return (
    <div className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.headerBar}>
          <Link className={styles.brand} href="/">
            <span className={styles.brandMark}>CL</span>
            <span className={styles.brandText}>
              <strong>Civic Logos</strong>
              <span>{room.title}</span>
            </span>
          </Link>

          <nav className={styles.nav}>
            <Link href="/">Home</Link>
            <Link href="/rooms">All rooms</Link>
            <a href="#working-materials">Working materials</a>
          </nav>
        </div>

        <div className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Seeded issue room</span>
            <h1>{room.title}</h1>
            <p className={styles.question}>{room.question}</p>
            <p className={styles.summary}>{room.currentSynthesis}</p>

            <div className={styles.heroActions}>
              {firstLiveCard ? (
                <Link className={styles.primaryAction} href={firstLiveCard.href!}>
                  Open first live card
                </Link>
              ) : (
                <Link className={styles.primaryAction} href="/rooms">
                  Back to room library
                </Link>
              )}
              <a className={styles.secondaryAction} href="#topic-field">
                See room topics
              </a>
              <Link className={styles.secondaryAction} href="/rooms">
                Back to room library
              </Link>
            </div>
          </div>

          <aside className={styles.heroPanel}>
            <span className={styles.panelLabel}>Room note</span>
            <p>{room.draftNote}</p>
            {room.deeperQuestion ? (
              <div className={styles.heroQuote}>
                <span>Deeper question</span>
                <p>{room.deeperQuestion}</p>
              </div>
            ) : null}

            <div className={styles.heroStats}>
              <div>
                <strong>{inspectableTopics.length}</strong>
                <span>live topic card{inspectableTopics.length === 1 ? "" : "s"}</span>
              </div>
              <div>
                <strong>{room.stakeholders.length}</strong>
                <span>stakeholders already visible</span>
              </div>
              <div>
                <strong>{room.openQuestions.length}</strong>
                <span>open questions in play</span>
              </div>
            </div>
          </aside>
        </div>
      </header>

      <main className={styles.main}>
        {routeEntry ? (
          <IntakeRouteBanner
            currentRoomHref={`/rooms/${roomSlug}`}
            currentRoomSlug={roomSlug}
            entry={routeEntry}
          />
        ) : null}

        <nav className={styles.sectionRail} aria-label={`${room.title} room map`}>
          <a href="#start-here">Start here</a>
          <a href="#current-read">Current read</a>
          <a href="#major-frames">Frames</a>
          <a href="#ask-room">Ask room</a>
          <a href="#topic-field">Topics</a>
          {inspectableTopics.length ? (
            <a href="#inspectable-cards">Inspect cards</a>
          ) : null}
          <a href="#adjacent-rooms">Adjacent rooms</a>
          <a href="#room-structure">Structure</a>
          <a href="#working-materials">Materials</a>
        </nav>

        <section className={styles.storySection}>
          <div className={styles.sectionHeading}>
            <span className={styles.eyebrow}>Why this room exists</span>
            <h2>This room is meant to hold a harder category of public complexity.</h2>
          </div>

          <div className={styles.storyGrid}>
            <div className={styles.storyCard}>
              {room.narrative.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className={styles.storyAside}>
              <span className={styles.panelLabel}>Why this issue matters</span>
              <p>{room.whyItMatters}</p>
            </div>
          </div>
        </section>

        {room.startHere ? (
          <section className={styles.section} id="start-here">
            <div className={styles.sectionHeading}>
              <span className={styles.eyebrow}>Start Here</span>
              <h2>The room gets stronger when it offers concrete first lines of inquiry.</h2>
            </div>

            <div className={styles.startHereGrid}>
              {room.startHere.map((item) => (
                <article className={styles.startHereCard} key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className={styles.focusSection} id="current-read">
          <article className={styles.focusCard}>
            <span className={styles.eyebrow}>Current read</span>
            <h2>Where the room currently leans</h2>
            <ul className={styles.bulletList}>
              {room.workingConclusions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className={styles.focusCard}>
            <span className={styles.eyebrow}>What could move it</span>
            <h2>What would meaningfully change the synthesis</h2>
            <ul className={styles.bulletList}>
              {room.whatCouldMoveTheRoom.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>

        {room.majorFrames || room.initialScorecard ? (
          <section className={styles.twoColumnSection} id="major-frames">
            {room.majorFrames ? (
              <article className={styles.panel}>
                <span className={styles.eyebrow}>Major frames</span>
                <h2>The room works only if competing frames stay visible at the same time.</h2>
                <div className={styles.frameList}>
                  {room.majorFrames.map((frame) => (
                    <article className={styles.frameItem} key={frame.title}>
                      <h3>{frame.title}</h3>
                      <p>{frame.body}</p>
                    </article>
                  ))}
                </div>
              </article>
            ) : null}

            {room.initialScorecard ? (
              <article className={styles.panel}>
                <span className={styles.eyebrow}>Initial scorecard</span>
                <h2>This room is high-stakes before any final answer exists.</h2>
                <div className={styles.scorecardList}>
                  {room.initialScorecard.map((item) => (
                    <div className={styles.scorecardItem} key={item.metric}>
                      <span>{item.metric}</span>
                      <strong>{item.rating}</strong>
                    </div>
                  ))}
                </div>
              </article>
            ) : null}
          </section>
        ) : null}

        <RoomGuide
          inspectableTopics={inspectableTopics}
          room={room}
          roomHref={`/rooms/${roomSlug}`}
          sectionId="ask-room"
        />

        <section className={styles.section} id="topic-field">
          <div className={styles.sectionHeading}>
            <span className={styles.eyebrow}>Topic field</span>
            <h2>The room already has competing directions, and some of them can now open into fuller topic cards.</h2>
            <p>
              These topic tracks are seeded from the paper’s domain logic so
              the room can start with meaningful structure instead of a blank slate.
            </p>
          </div>

          <div className={styles.trackGrid}>
            <ProposalTrack
              title="Topics in focus"
              intro="These are the topic families that currently anchor the room."
              items={room.topProposals}
            />
            <ProposalTrack
              title="Less familiar directions"
              intro="These widen the search space and make room for less familiar institutional designs."
              items={room.novelProposals}
            />
            <ProposalTrack
              title="Highest leverage topics"
              intro="These are currently framed as having the largest possible economic or structural spillovers."
              items={room.economicDeltaLeaders}
            />
            <ProposalTrack
              title="Most contested topics"
              intro="These are the topics where rhetoric is most likely to outrun the actual tradeoffs."
              items={room.mostDebated}
            />
          </div>
        </section>

        {inspectableTopics.length ? (
          <section className={styles.section} id="inspectable-cards">
            <div className={styles.sectionHeading}>
              <span className={styles.eyebrow}>Inspectable cards</span>
              <h2>The room gets more real once some topics open into full objects.</h2>
              <p>
                These are the detailed topic cards currently attached to this
                room. The room map keeps the field wide; the cards make one line
                of reasoning easier to test in public.
              </p>
            </div>

            <div className={styles.trackGrid}>
              {inspectableTopics.map((item) => (
                <Link className={styles.trackItem} href={item.href!} key={item.href}>
                  <div className={styles.trackMeta}>
                    <span>{item.label}</span>
                    <strong>{item.metric}</strong>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <RelatedRooms
          currentRoomSlug={roomSlug}
          intro="Each room is only one slice of the larger civic reasoning graph. These adjacent rooms are where the same incentives, institutions, or failure modes are likely to surface again from a different angle."
          title="A real room library should make it easy to move sideways into the neighboring questions."
        />

        <section className={styles.section} id="room-structure">
          <div className={styles.sectionHeading}>
            <span className={styles.eyebrow}>Room structure</span>
            <h2>The room should stay stable enough that later chat, critique, and revision have something to work on.</h2>
          </div>

          <ol className={styles.structureList}>
            {room.roomComponents.map((item, index) => (
              <li className={styles.structureItem} key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{item}</h3>
                  <p>
                    This section remains visible so later contributions can update the reasoning object instead of disappearing into noise.
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.materialsSection} id="working-materials">
          <div className={styles.sectionHeading}>
            <span className={styles.eyebrow}>Working materials</span>
            <h2>The point is not to look complete. The point is to make the draft legible enough to deepen.</h2>
          </div>

          <div className={styles.materialsGrid}>
            <article className={styles.panel}>
              <span className={styles.panelLabel}>Claim map</span>
              <div className={styles.claimList}>
                {room.claimMap.map((item) => (
                  <div className={styles.claimItem} key={item.claim}>
                    <span>{item.status}</span>
                    <p>{item.claim}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className={styles.panel}>
              <span className={styles.panelLabel}>Evidence library</span>
              <div className={styles.evidenceList}>
                {room.evidenceLibrary.map((item) => (
                  <div className={styles.evidenceItem} key={item.title}>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.note}</p>
                    </div>
                    <span>{item.status}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className={styles.panel}>
              <span className={styles.panelLabel}>Perspectives</span>
              <div className={styles.perspectiveList}>
                {room.perspectives.map((item) => (
                  <article className={styles.perspectiveCard} key={item.title}>
                    <h3>{item.title}</h3>
                    <p>{item.thesis}</p>
                    <span>{item.relation}</span>
                  </article>
                ))}
              </div>
            </article>

            <article className={styles.panel}>
              <span className={styles.panelLabel}>Pressure points</span>
              <div className={styles.stackGroup}>
                <div>
                  <h3>Strong objections</h3>
                  <ul className={styles.bulletList}>
                    {room.objectionLibrary.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3>Open questions</h3>
                  <ul className={styles.bulletList}>
                    {room.openQuestions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className={styles.ctaPanel}>
          <div>
            <span className={styles.eyebrow}>Room purpose</span>
            <h2>This room exists to make a hard public question structurally legible.</h2>
            <p>
              {room.roomPurpose ??
                "The right follow-on is not more generic commentary. It is to pick one anchor topic in this room and turn it into a full inspectable topic card without letting it dominate the room."}
            </p>
          </div>

          {firstLiveCard ? (
            <Link className={styles.primaryAction} href={firstLiveCard.href!}>
              Open first live card
            </Link>
          ) : (
            <Link className={styles.primaryAction} href="/rooms">
              Explore all rooms
            </Link>
          )}
        </section>
      </main>
    </div>
  );
}
