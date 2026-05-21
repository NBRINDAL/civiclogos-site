import Link from "next/link";
import RoomGuide from "../components/room-guide";
import {
  getInspectableTopics,
  healthcareIssueRoom,
  issueRoomQuestion,
} from "../lib/civic-logos";
import styles from "./page.module.css";

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

export default function HealthcareIssueRoomPage() {
  const inspectableTopics = getInspectableTopics(healthcareIssueRoom);
  const firstLiveCard = inspectableTopics[0];

  return (
    <div className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.headerBar}>
          <Link className={styles.brand} href="/">
            <span className={styles.brandMark}>CL</span>
            <span className={styles.brandText}>
              <strong>Civic Logos</strong>
              <span>Healthcare issue room</span>
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
            <span className={styles.eyebrow}>Working draft</span>
            <h1>{healthcareIssueRoom.title}</h1>
            <p className={styles.question}>{issueRoomQuestion}</p>
            <p className={styles.summary}>{healthcareIssueRoom.currentSynthesis}</p>

            <div className={styles.heroActions}>
              {firstLiveCard ? (
                <Link className={styles.primaryAction} href={firstLiveCard.href!}>
                  Open first live card
                </Link>
              ) : (
                <a className={styles.primaryAction} href="#topic-field">
                  Scan room topics
                </a>
              )}
              <a className={styles.secondaryAction} href="#topic-field">
                Scan room topics
              </a>
              <a className={styles.secondaryAction} href="#working-materials">
                See working materials
              </a>
            </div>
          </div>

          <aside className={styles.heroPanel}>
            <span className={styles.panelLabel}>Room note</span>
            <p>{healthcareIssueRoom.draftNote}</p>
            {healthcareIssueRoom.deeperQuestion ? (
              <div className={styles.heroQuote}>
                <span>Deeper question</span>
                <p>{healthcareIssueRoom.deeperQuestion}</p>
              </div>
            ) : null}

            <div className={styles.heroStats}>
              <div>
                <strong>{inspectableTopics.length}</strong>
                <span>live topic card{inspectableTopics.length === 1 ? "" : "s"}</span>
              </div>
              <div>
                <strong>{healthcareIssueRoom.topProposals.length}</strong>
                <span>anchor topics in focus</span>
              </div>
              <div>
                <strong>{healthcareIssueRoom.openQuestions.length}</strong>
                <span>open questions still active</span>
              </div>
            </div>
          </aside>
        </div>
      </header>

      <main className={styles.main}>
        <nav className={styles.sectionRail} aria-label="Healthcare room map">
          <a href="#start-here">Start here</a>
          <a href="#current-read">Current read</a>
          <a href="#major-frames">Frames</a>
          <a href="#ask-room">Ask room</a>
          <a href="#topic-field">Topics</a>
          {inspectableTopics.length ? <a href="#inspectable-cards">Inspect cards</a> : null}
          <a href="#room-structure">Structure</a>
          <a href="#working-materials">Materials</a>
        </nav>

        <section className={styles.storySection}>
          <div className={styles.sectionHeading}>
            <span className={styles.eyebrow}>Why this room exists</span>
            <h2>A first issue room should read like a public workspace, not a pile of fragments.</h2>
          </div>

          <div className={styles.storyGrid}>
            <div className={styles.storyCard}>
              <p>{healthcareIssueRoom.narrative[0]}</p>
              <p>{healthcareIssueRoom.narrative[1]}</p>
            </div>

            <div className={styles.storyAside}>
              <span className={styles.panelLabel}>Why healthcare first</span>
              <p>{healthcareIssueRoom.whyItMatters}</p>
            </div>
          </div>
        </section>

        {healthcareIssueRoom.startHere ? (
          <section className={styles.section} id="start-here">
            <div className={styles.sectionHeading}>
              <span className={styles.eyebrow}>Start Here</span>
              <h2>The room should suggest a few serious entry points instead of asking every reader to invent their own.</h2>
            </div>

            <div className={styles.startHereGrid}>
              {healthcareIssueRoom.startHere.map((item) => (
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
              {healthcareIssueRoom.workingConclusions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className={styles.focusCard}>
            <span className={styles.eyebrow}>What could move it</span>
            <h2>What would meaningfully change the synthesis</h2>
            <ul className={styles.bulletList}>
              {healthcareIssueRoom.whatCouldMoveTheRoom.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className={styles.twoColumnSection} id="major-frames">
          {healthcareIssueRoom.majorFrames ? (
            <article className={styles.panel}>
              <span className={styles.eyebrow}>Major frames</span>
              <h2>The room is not one argument. It is a collision of serious frames.</h2>
              <div className={styles.frameList}>
                {healthcareIssueRoom.majorFrames.map((frame) => (
                  <article className={styles.frameItem} key={frame.title}>
                    <h3>{frame.title}</h3>
                    <p>{frame.body}</p>
                  </article>
                ))}
              </div>
            </article>
          ) : null}

          {healthcareIssueRoom.initialScorecard ? (
            <article className={styles.panel}>
              <span className={styles.eyebrow}>Initial scorecard</span>
              <h2>This room starts high-stakes before any one topic wins.</h2>
              <div className={styles.scorecardList}>
                {healthcareIssueRoom.initialScorecard.map((item) => (
                  <div className={styles.scorecardItem} key={item.metric}>
                    <span>{item.metric}</span>
                    <strong>{item.rating}</strong>
                  </div>
                ))}
              </div>
            </article>
          ) : null}
        </section>

        <RoomGuide sectionId="ask-room" />

        <section className={styles.section} id="topic-field">
          <div className={styles.sectionHeading}>
            <span className={styles.eyebrow}>Topic field</span>
            <h2>The point is to compare live healthcare topics in one place before declaring winners.</h2>
            <p>
              This draft is intentionally selective. It is trying to create a
              legible field of comparison, not an encyclopedic healthcare atlas
              on day one.
            </p>
          </div>

          <div className={styles.trackGrid}>
            <ProposalTrack
              title="Topics in focus"
              intro="These are the healthcare topics currently doing the most structural work in the room."
              items={healthcareIssueRoom.topProposals}
            />
            <ProposalTrack
              title="Less familiar directions"
              intro="These are included because they widen the search space and pressure stale assumptions."
              items={healthcareIssueRoom.novelProposals}
            />
            <ProposalTrack
              title="Highest leverage topics"
              intro="These are the topics currently framed as having the largest possible economic-delta implications."
              items={healthcareIssueRoom.economicDeltaLeaders}
            />
            <ProposalTrack
              title="Most contested topics"
              intro="These are the topics where the rhetoric is usually cleaner than the actual tradeoffs."
              items={healthcareIssueRoom.mostDebated}
            />
          </div>
        </section>

        {inspectableTopics.length ? (
          <section className={styles.section} id="inspectable-cards">
            <div className={styles.sectionHeading}>
              <span className={styles.eyebrow}>Inspectable cards</span>
              <h2>The room should make its most developed objects easy to open and pressure directly.</h2>
              <p>
                These are the detailed topic cards currently attached to the
                healthcare room. The map holds the whole dispute, but the cards
                are where one line of reasoning becomes fully inspectable.
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

        <section className={styles.section} id="room-structure">
          <div className={styles.sectionHeading}>
            <span className={styles.eyebrow}>Room structure</span>
            <h2>The room should keep the reasoning object stable while the content evolves.</h2>
            <p>
              The paper treats the issue room as the primary workspace for one
              major public question. This is the early structure it is trying to
              hold in place.
            </p>
          </div>

          <ol className={styles.structureList}>
            {healthcareIssueRoom.roomComponents.map((item, index) => (
              <li className={styles.structureItem} key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{item}</h3>
                  <p>
                    This stays visible so the room can accumulate pressure,
                    revision, and disagreement without losing the thread.
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.materialsSection} id="working-materials">
          <div className={styles.sectionHeading}>
            <span className={styles.eyebrow}>Working materials</span>
            <h2>The room gets better by making the draft materials visible, not by pretending they are final.</h2>
          </div>

          <div className={styles.materialsGrid}>
            <article className={styles.panel}>
              <span className={styles.panelLabel}>Claim map</span>
              <div className={styles.claimList}>
                {healthcareIssueRoom.claimMap.map((item) => (
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
                {healthcareIssueRoom.evidenceLibrary.map((item) => (
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
                {healthcareIssueRoom.perspectives.map((item) => (
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
                    {healthcareIssueRoom.objectionLibrary.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3>Open questions</h3>
                  <ul className={styles.bulletList}>
                    {healthcareIssueRoom.openQuestions.map((item) => (
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
            <h2>This room exists to make healthcare reasoning clearer before it becomes final power.</h2>
            <p>
              {healthcareIssueRoom.roomPurpose}
            </p>
          </div>

          {firstLiveCard ? (
            <Link className={styles.primaryAction} href={firstLiveCard.href!}>
              Open first live card
            </Link>
          ) : null}
        </section>
      </main>
    </div>
  );
}
