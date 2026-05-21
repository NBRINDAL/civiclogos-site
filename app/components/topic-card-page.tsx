import Link from "next/link";
import type { TopicCardData } from "../lib/civic-logos";
import styles from "../healthcare/proposal-001/page.module.css";

type TopicCardLink = {
  id: string;
  title: string;
  href: string;
};

type TopicCardPageProps = {
  card: TopicCardData;
  brandSubtitle: string;
  roomHref: string;
  roomLabel: string;
  roomCards: readonly TopicCardLink[];
  currentTopicIndex: number;
};

export default function TopicCardPage({
  card,
  brandSubtitle,
  roomHref,
  roomLabel,
  roomCards,
  currentTopicIndex,
}: TopicCardPageProps) {
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
              These scores are an early read on whether the card is getting
              sharper, not a declaration that the room has settled the question.
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
              <h3>Strongest objection</h3>
              <p>{card.strongestObjection}</p>
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
              </article>
            ))}
          </div>
        </section>

        <section className={styles.gridSection} id="debate">
          <article className={styles.panel}>
            <span className={styles.eyebrow}>Debate lanes</span>
            <h2>The point is not to react. It is to improve the object.</h2>
            <div className={styles.debateGrid}>
              {card.debatePrompts.map((item) => (
                <article className={styles.debateCard} key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </article>

          <article className={styles.panel}>
            <span className={styles.eyebrow}>What this card needs next</span>
            <h2>The most useful updates are the ones that reduce ambiguity.</h2>

            <div className={styles.copyBlock}>
              <h3>Open questions</h3>
              <ul className={styles.bulletList}>
                {card.openQuestions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className={styles.copyBlock}>
              <h3>What would strengthen it</h3>
              <ul className={styles.bulletList}>
                {card.whatWouldStrengthen.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </article>
        </section>

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
