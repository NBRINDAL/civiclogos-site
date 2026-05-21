import Link from "next/link";
import TopicContributionLoop from "./topic-contribution-loop";
import TopicAiPanel from "./topic-ai-panel";
import type { IssueRoomSlug, TopicCardData } from "../lib/civic-logos";
import {
  getContributionStoreMetadata,
  listPublicContributions,
} from "../lib/contribution-store";
import styles from "../healthcare/proposal-001/page.module.css";

type TopicCardLink = {
  id: string;
  title: string;
  href: string;
};

type TopicCardPageProps = {
  roomSlug: IssueRoomSlug;
  card: TopicCardData;
  brandSubtitle: string;
  roomHref: string;
  roomLabel: string;
  roomCards: readonly TopicCardLink[];
  currentTopicIndex: number;
};

export default async function TopicCardPage({
  roomSlug,
  card,
  brandSubtitle,
  roomHref,
  roomLabel,
  roomCards,
  currentTopicIndex,
}: TopicCardPageProps) {
  const [liveContributions, contributionStoreMetadata] = await Promise.all([
    listPublicContributions({
      roomSlug,
      topicId: card.id,
      limit: 12,
    }),
    getContributionStoreMetadata(),
  ]);
  const contributorObjectionThatChangedCard = liveContributions.find(
    (item) => item.lane === "objection" && item.review?.changedSynthesis === true,
  );
  const strongestLiveContributorObjection = liveContributions.find(
    (item) => item.lane === "objection",
  );
  const contributionStatusCounts = {
    pending: liveContributions.filter((item) => item.status === "pending").length,
    needsReview: liveContributions.filter((item) => item.status === "needs review").length,
    accepted: liveContributions.filter((item) => item.status === "accepted").length,
    incorporated: liveContributions.filter((item) => item.status === "incorporated").length,
    rejected: liveContributions.filter((item) => item.status === "rejected").length,
  };
  const changedCardContributions = liveContributions.filter(
    (item) => item.review?.changedSynthesis === true,
  );
  const previousCard =
    currentTopicIndex > 0 ? roomCards[currentTopicIndex - 1] : null;
  const nextCard =
    currentTopicIndex < roomCards.length - 1
      ? roomCards[currentTopicIndex + 1]
      : null;
  const siblingCards = roomCards.filter((item) => item.id !== card.id);

  return (
    <div className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.headerBar}>
          <Link className={styles.brand} href={roomHref}>
            <span className={styles.brandMark}>CL</span>
            <span className={styles.brandText}>
              <strong>Civic Logos</strong>
              <span>{brandSubtitle}</span>
            </span>
          </Link>

          <nav className={styles.nav}>
            <Link href="/">Home</Link>
            <Link href={roomHref}>{roomLabel}</Link>
            <a href="#room-context">Room context</a>
            <a href="#debate">Debate lanes</a>
          </nav>
        </div>

        <div className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Working topic card</span>
            <h1>{card.title}</h1>
            <p className={styles.subtitle}>{card.subtitle}</p>
            <p className={styles.thesis}>{card.thesis}</p>
          </div>

          <aside className={styles.heroPanel}>
            <span className={styles.panelLabel}>Card note</span>
            <p>{card.draftNote}</p>
            <p>{card.currentRead}</p>

            <div className={styles.heroMeta}>
              <div>
                <span>Maturity</span>
                <strong>{card.maturity}</strong>
              </div>
              <div>
                <span>Revision history</span>
                <strong>{card.revisionHistory.length} visible updates</strong>
              </div>
              <div>
                <span>AI roles</span>
                <strong>{card.aiPanels.length} active readers</strong>
              </div>
            </div>
          </aside>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.gridSection}>
          <article className={styles.panel}>
            <span className={styles.eyebrow}>Current read</span>
            <h2>Why this topic card matters even before it is proven</h2>
            <p>{card.currentRead}</p>

            <div className={styles.copyBlock}>
              <h3>The problem it is trying to solve</h3>
              <p>{card.problemStatement}</p>
            </div>

            <div className={styles.copyBlock}>
              <h3>The proposed move</h3>
              <p>{card.proposedSolution}</p>
            </div>
          </article>

          <article className={styles.scorePanel}>
            <span className={styles.eyebrow}>Current scorecard</span>
            <p>
              These scores are provisional founder estimates about whether the
              card is getting sharper, not a declaration that the room has settled
              the question. Each score should eventually be challengeable by a
              visible rubric and review history.
            </p>

            <div className={styles.scoreList}>
              {card.scorecard.map((item) => (
                <div className={styles.scoreItem} key={item.label}>
                  <div className={styles.scoreTop}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                  <div className={styles.scoreTrack}>
                    <span style={{ width: `${item.value}%` }} />
                  </div>
                  <details className={styles.scoreDetails}>
                    <summary>How this was scored</summary>
                    <p>
                      {item.basis ??
                        "Provisional founder estimate pending a public scoring rubric and challenge workflow."}
                    </p>
                  </details>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className={styles.gridSection}>
          <article className={styles.panel}>
            <span className={styles.eyebrow}>How it works</span>
            <h2>The mechanism should be explicit enough to attack.</h2>
            <ol className={styles.numberList}>
              {card.mechanism.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>

            <div className={styles.copyBlock}>
              <h3>Expected upside</h3>
              <ul className={styles.bulletList}>
                {card.benefits.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </article>

          <article className={styles.panel}>
            <span className={styles.eyebrow}>What it depends on</span>
            <h2>The topic card is only as credible as its assumptions.</h2>
            <ul className={styles.bulletList}>
              {card.assumptions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className={styles.copyBlock}>
              <h3>Stakeholders already in the blast radius</h3>
              <div className={styles.tagList}>
                {card.stakeholders.map((item) => (
                  <span className={styles.tag} key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </article>
        </section>

        <section className={styles.gridSection}>
          <article className={styles.panel}>
            <span className={styles.eyebrow}>Stress test</span>
            <h2>Where the topic could fail or misfire</h2>
            <ul className={styles.bulletList}>
              {card.risks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className={styles.copyBlock}>
              <h3>Anticipated objection</h3>
              <p>{card.anticipatedObjection ?? card.strongestObjection}</p>
            </div>

            <div className={styles.copyBlock}>
              <h3>Contributor objection that changed the card</h3>
              {contributorObjectionThatChangedCard ? (
                <>
                  <p>
                    <strong>{contributorObjectionThatChangedCard.title}.</strong>{" "}
                    {contributorObjectionThatChangedCard.body}
                  </p>
                  {contributorObjectionThatChangedCard.review?.reviewerNote ? (
                    <p className={styles.metaParagraph}>
                      Human reviewer note:{" "}
                      {contributorObjectionThatChangedCard.review.reviewerNote}
                    </p>
                  ) : null}
                </>
              ) : strongestLiveContributorObjection ? (
                <>
                  <p>
                    No contributor objection has changed this card yet. The
                    strongest live objection in the visible record is{" "}
                    <strong>{strongestLiveContributorObjection.title}.</strong>
                  </p>
                  <p>{strongestLiveContributorObjection.body}</p>
                </>
              ) : (
                <p>
                  No contributor objection has changed this card yet. That field
                  should only fill when a reviewed outside objection materially
                  alters the public record.
                </p>
              )}
            </div>

            <div className={styles.copyBlock}>
              <h3>Economic delta</h3>
              <p>{card.economicDelta.summary}</p>
              <ul className={styles.bulletList}>
                {card.economicDelta.metrics.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </article>

          <article className={styles.panel}>
            <span className={styles.eyebrow}>Support and evidence</span>
            <h2>What currently makes the card worth keeping alive</h2>
            <p>{card.strongestSupport}</p>

            <div className={styles.evidenceList}>
              {card.evidence.map((item) => (
                <article className={styles.evidenceCard} key={item.title}>
                  <span>{item.status}</span>
                  <h3>{item.title}</h3>
                  <p>{item.note}</p>
                </article>
              ))}
            </div>
          </article>
        </section>

        <section className={styles.panel}>
          <span className={styles.eyebrow}>AI review</span>
          <h2>The AI layer should stay visible as a reader, not pretend to be the final judge.</h2>
          <div className={styles.aiGrid}>
            {card.aiPanels.map((item) => (
              <article className={styles.aiCard} key={item.role}>
                <div className={styles.aiMeta}>
                  <h3>{item.role}</h3>
                  <span>{item.confidence} confidence</span>
                </div>
                <p>{item.summary}</p>
                {item.provenance ? (
                  <dl className={styles.aiProvenance}>
                    <div>
                      <dt>Source</dt>
                      <dd>{item.provenance.sourceLabel}</dd>
                    </div>
                    {item.provenance.model ? (
                      <div>
                        <dt>Model</dt>
                        <dd>{item.provenance.model}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt>Stamped</dt>
                      <dd>{item.provenance.generatedAt}</dd>
                    </div>
                    <div>
                      <dt>Prompt class</dt>
                      <dd>{item.provenance.promptCategory}</dd>
                    </div>
                  </dl>
                ) : null}
                {item.provenance?.note ? (
                  <p className={styles.aiProvenanceNote}>{item.provenance.note}</p>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className={styles.gridSection}>
          <article className={styles.panel}>
            <span className={styles.eyebrow}>Review cycle</span>
            <h2>This card should show what is waiting on human judgment.</h2>
            <p>
              The contribution record is currently running in{" "}
              <strong>{contributionStoreMetadata.mode}</strong> mode.{" "}
              {contributionStoreMetadata.note}
            </p>

            <div className={styles.snapshotGrid}>
              <article className={styles.snapshotCard}>
                <span className={styles.snapshotLabel}>Live record</span>
                <strong>{liveContributions.length}</strong>
                <p>Visible contributions currently attached to this topic card.</p>
              </article>
              <article className={styles.snapshotCard}>
                <span className={styles.snapshotLabel}>Pending review</span>
                <strong>
                  {contributionStatusCounts.pending + contributionStatusCounts.needsReview}
                </strong>
                <p>Items still waiting on a clear maintainer decision.</p>
              </article>
              <article className={styles.snapshotCard}>
                <span className={styles.snapshotLabel}>Changed card</span>
                <strong>{changedCardContributions.length}</strong>
                <p>Contributions whose human review says they altered the public record.</p>
              </article>
            </div>

            <div className={styles.copyBlock}>
              <h3>Review status breakdown</h3>
              <div className={styles.reviewPills}>
                <span className={styles.reviewPill}>
                  Pending {contributionStatusCounts.pending}
                </span>
                <span className={styles.reviewPill}>
                  Needs review {contributionStatusCounts.needsReview}
                </span>
                <span className={styles.reviewPill}>
                  Accepted {contributionStatusCounts.accepted}
                </span>
                <span className={styles.reviewPill}>
                  Incorporated {contributionStatusCounts.incorporated}
                </span>
                <span className={styles.reviewPill}>
                  Rejected {contributionStatusCounts.rejected}
                </span>
              </div>
            </div>
          </article>

          <article className={styles.panel}>
            <span className={styles.eyebrow}>Manual cycle</span>
            <h2>The loop only becomes real when review decisions become visible.</h2>
            <p>
              A maintainer should be able to read the pending queue, attach each
              contribution to a claim, objection, evidence item, assumption, or
              open question, and then state whether it changed the card.
            </p>

            {changedCardContributions.length ? (
              <div className={styles.copyBlock}>
                <h3>Most recent contributor-driven card changes</h3>
                <ul className={styles.bulletList}>
                  {changedCardContributions.slice(0, 3).map((item) => (
                    <li key={item.id}>
                      <strong>{item.title}.</strong>{" "}
                      {item.review?.decisionReason ?? "Marked as changing the card."}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className={styles.copyBlock}>
                <h3>No contributor-driven card change yet</h3>
                <p>
                  The card is still waiting for a reviewed outside contribution to
                  visibly move its synthesis. That is the threshold this manual
                  cycle is meant to prove.
                </p>
              </div>
            )}

            <div className={styles.roomActions}>
              <Link
                className={styles.roomActionPrimary}
                href={`/review/contributions?roomSlug=${encodeURIComponent(
                  roomSlug,
                )}&topicId=${encodeURIComponent(card.id)}`}
              >
                Open review queue for this card
              </Link>
            </div>
          </article>
        </section>

        <TopicAiPanel roomSlug={roomSlug} topicId={card.id} topicTitle={card.title} />

        <TopicContributionLoop
          debatePrompts={card.debatePrompts}
          openQuestions={card.openQuestions}
          roomSlug={roomSlug}
          topicId={card.id}
          topicTitle={card.title}
          whatWouldStrengthen={card.whatWouldStrengthen}
        />

        <section className={styles.gridSection} id="room-context">
          <article className={styles.panel}>
            <span className={styles.eyebrow}>Room context</span>
            <h2>This card should feel like one live object inside a room, not a detached essay.</h2>
            <p>
              {roomLabel} currently has {roomCards.length} live topic
              {roomCards.length === 1 ? " card" : " cards"} in view. This card is{" "}
              {currentTopicIndex + 1} of {roomCards.length}.
            </p>

            <div className={styles.roomActions}>
              <Link className={styles.roomActionPrimary} href={roomHref}>
                Return to room
              </Link>
              {previousCard ? (
                <Link className={styles.roomActionSecondary} href={previousCard.href}>
                  Previous card
                </Link>
              ) : null}
              {nextCard ? (
                <Link className={styles.roomActionSecondary} href={nextCard.href}>
                  Next card
                </Link>
              ) : null}
            </div>
          </article>

          <article className={styles.panel}>
            <span className={styles.eyebrow}>Other live cards</span>
            <h2>The room gets stronger when multiple inspectable directions stay visible.</h2>
            {siblingCards.length ? (
              <div className={styles.relatedCardList}>
                {siblingCards.map((item) => (
                  <Link className={styles.relatedCardItem} href={item.href} key={item.id}>
                    <span>{item.id.replace("topic-", "Topic ")}</span>
                    <strong>{item.title}</strong>
                  </Link>
                ))}
              </div>
            ) : (
              <p>
                This is currently the only live card in the room. The next step is
                not to make this card do everything, but to open more competing
                directions beside it.
              </p>
            )}
          </article>
        </section>

        <section className={styles.panel}>
          <span className={styles.eyebrow}>Version history</span>
          <h2>The card should show how the public reasoning moves over time.</h2>
          <div className={styles.historyList}>
            {card.revisionHistory.map((item) => (
              <article className={styles.historyItem} key={item.version}>
                <div>
                  <strong>{item.version}</strong>
                  <span>{item.date}</span>
                </div>
                <p>{item.note}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
