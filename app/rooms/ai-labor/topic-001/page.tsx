import Link from "next/link";
import { aiTopic001 } from "../../../lib/civic-logos";
import styles from "../../../healthcare/proposal-001/page.module.css";

export default function AiTopic001Page() {
  return (
    <div className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.headerBar}>
          <Link className={styles.brand} href="/rooms/ai-labor">
            <span className={styles.brandMark}>CL</span>
            <span className={styles.brandText}>
              <strong>Civic Logos</strong>
              <span>AI topic card</span>
            </span>
          </Link>

          <nav className={styles.nav}>
            <Link href="/">Home</Link>
            <Link href="/rooms/ai-labor">AI room</Link>
            <a href="#debate">Debate lanes</a>
          </nav>
        </div>

        <div className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Working topic card</span>
            <h1>{aiTopic001.title}</h1>
            <p className={styles.subtitle}>{aiTopic001.subtitle}</p>
            <p className={styles.thesis}>{aiTopic001.thesis}</p>
          </div>

          <aside className={styles.heroPanel}>
            <span className={styles.panelLabel}>Card note</span>
            <p>{aiTopic001.draftNote}</p>
            <p>{aiTopic001.currentRead}</p>

            <div className={styles.heroMeta}>
              <div>
                <span>Maturity</span>
                <strong>{aiTopic001.maturity}</strong>
              </div>
              <div>
                <span>Revision history</span>
                <strong>{aiTopic001.revisionHistory.length} visible updates</strong>
              </div>
              <div>
                <span>AI roles</span>
                <strong>{aiTopic001.aiPanels.length} active readers</strong>
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
            <p>{aiTopic001.currentRead}</p>

            <div className={styles.copyBlock}>
              <h3>The problem it is trying to solve</h3>
              <p>{aiTopic001.problemStatement}</p>
            </div>

            <div className={styles.copyBlock}>
              <h3>The proposed move</h3>
              <p>{aiTopic001.proposedSolution}</p>
            </div>
          </article>

          <article className={styles.scorePanel}>
            <span className={styles.eyebrow}>Current scorecard</span>
            <p>
              These scores are a rough read on whether the card is becoming
              sharper, not a declaration that the room has settled the question.
            </p>

            <div className={styles.scoreList}>
              {aiTopic001.scorecard.map((item) => (
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
              {aiTopic001.mechanism.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>

            <div className={styles.copyBlock}>
              <h3>Expected upside</h3>
              <ul className={styles.bulletList}>
                {aiTopic001.benefits.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </article>

          <article className={styles.panel}>
            <span className={styles.eyebrow}>What it depends on</span>
            <h2>The topic card is only as credible as its assumptions.</h2>
            <ul className={styles.bulletList}>
              {aiTopic001.assumptions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className={styles.copyBlock}>
              <h3>Stakeholders already in the blast radius</h3>
              <div className={styles.tagList}>
                {aiTopic001.stakeholders.map((item) => (
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
            <h2>Where the topic could fail or become dangerous</h2>
            <ul className={styles.bulletList}>
              {aiTopic001.risks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className={styles.copyBlock}>
              <h3>Strongest objection</h3>
              <p>{aiTopic001.strongestObjection}</p>
            </div>

            <div className={styles.copyBlock}>
              <h3>Economic delta</h3>
              <p>{aiTopic001.economicDelta.summary}</p>
              <ul className={styles.bulletList}>
                {aiTopic001.economicDelta.metrics.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </article>

          <article className={styles.panel}>
            <span className={styles.eyebrow}>Support and evidence</span>
            <h2>What currently makes the card worth keeping alive</h2>
            <p>{aiTopic001.strongestSupport}</p>

            <div className={styles.evidenceList}>
              {aiTopic001.evidence.map((item) => (
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
            {aiTopic001.aiPanels.map((item) => (
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
            <h2>The point is not to react to AI. It is to improve the object.</h2>
            <div className={styles.debateGrid}>
              {aiTopic001.debatePrompts.map((item) => (
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
                {aiTopic001.openQuestions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className={styles.copyBlock}>
              <h3>What would strengthen it</h3>
              <ul className={styles.bulletList}>
                {aiTopic001.whatWouldStrengthen.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </article>
        </section>

        <section className={styles.panel}>
          <span className={styles.eyebrow}>Version history</span>
          <h2>The card should show how the public reasoning moves over time.</h2>
          <div className={styles.historyList}>
            {aiTopic001.revisionHistory.map((item) => (
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
