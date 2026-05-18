import Link from "next/link";
import { proposal001 } from "../../lib/civic-logos";
import styles from "./page.module.css";

export default function Proposal001Page() {
  return (
    <div className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.headerBar}>
          <Link className={styles.brand} href="/healthcare">
            <span className={styles.brandMark}>CL</span>
            <span className={styles.brandText}>
              <strong>Civic Logos</strong>
              <span>Proposal 001</span>
            </span>
          </Link>

          <nav className={styles.nav}>
            <Link href="/">Home</Link>
            <Link href="/healthcare">Healthcare room</Link>
            <a href="#debate">Debate lanes</a>
          </nav>
        </div>

        <div className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Idea card screen</span>
            <h1>{proposal001.title}</h1>
            <p className={styles.subtitle}>{proposal001.subtitle}</p>
            <p className={styles.thesis}>{proposal001.thesis}</p>

            <div className={styles.heroMeta}>
              <div>
                <span>Maturity</span>
                <strong>{proposal001.maturity}</strong>
              </div>
              <div>
                <span>Revision history</span>
                <strong>{proposal001.revisionHistory.length} visible updates</strong>
              </div>
              <div>
                <span>AI panels</span>
                <strong>{proposal001.aiPanels.length} active roles</strong>
              </div>
            </div>
          </div>

          <aside className={styles.scorePanel}>
            <span className={styles.eyebrow}>Current scorecard</span>
            <div className={styles.scoreList}>
              {proposal001.scorecard.map((item) => (
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
          </aside>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.gridSection}>
          <article className={styles.panel}>
            <span className={styles.eyebrow}>Problem statement</span>
            <h2>The issue this proposal claims to address</h2>
            <p>{proposal001.problemStatement}</p>
          </article>

          <article className={styles.panel}>
            <span className={styles.eyebrow}>Proposed solution</span>
            <h2>What the proposal actually recommends</h2>
            <p>{proposal001.proposedSolution}</p>
          </article>
        </section>

        <section className={styles.gridSection}>
          <article className={styles.panel}>
            <span className={styles.eyebrow}>Mechanism</span>
            <h2>The mechanism is where weak ideas fail first.</h2>
            <ol className={styles.numberList}>
              {proposal001.mechanism.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </article>

          <article className={styles.panel}>
            <span className={styles.eyebrow}>Assumptions</span>
            <h2>Every idea depends on assumptions; this card makes them explicit.</h2>
            <ul className={styles.bulletList}>
              {proposal001.assumptions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className={styles.gridSection}>
          <article className={styles.panel}>
            <span className={styles.eyebrow}>Benefits</span>
            <h2>Expected upside by stakeholder</h2>
            <ul className={styles.bulletList}>
              {proposal001.benefits.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className={styles.panel}>
            <span className={styles.eyebrow}>Risks</span>
            <h2>The strongest visible failure modes</h2>
            <ul className={styles.bulletList}>
              {proposal001.risks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className={styles.gridSection}>
          <article className={styles.panel}>
            <span className={styles.eyebrow}>Stakeholders</span>
            <h2>Who benefits, pays, implements, regulates, or absorbs risk</h2>
            <div className={styles.tagList}>
              {proposal001.stakeholders.map((item) => (
                <span className={styles.tag} key={item}>
                  {item}
                </span>
              ))}
            </div>
          </article>

          <article className={styles.panel}>
            <span className={styles.eyebrow}>Economic delta</span>
            <h2>Preliminary, transparent, and low-confidence by design</h2>
            <p>{proposal001.economicDelta.summary}</p>
            <ul className={styles.bulletList}>
              {proposal001.economicDelta.metrics.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className={styles.panel}>
          <span className={styles.eyebrow}>Evidence</span>
          <h2>Evidence should support or challenge the card, not just decorate it.</h2>
          <div className={styles.evidenceList}>
            {proposal001.evidence.map((item) => (
              <article className={styles.evidenceCard} key={item.title}>
                <span>{item.status}</span>
                <h3>{item.title}</h3>
                <p>{item.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.gridSection}>
          <article className={styles.panel}>
            <span className={styles.eyebrow}>Strongest support</span>
            <h2>The best argument in favor</h2>
            <p>{proposal001.strongestSupport}</p>
          </article>

          <article className={styles.panel}>
            <span className={styles.eyebrow}>Strongest objection</span>
            <h2>The best visible counterargument</h2>
            <p>{proposal001.strongestObjection}</p>
          </article>
        </section>

        <section className={styles.panel}>
          <span className={styles.eyebrow}>AI review panel</span>
          <h2>Role-based AI outputs should stay visible with confidence, not hidden in the background.</h2>
          <div className={styles.aiGrid}>
            {proposal001.aiPanels.map((item) => (
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
            <span className={styles.eyebrow}>Public debate</span>
            <h2>
              The prompt is not &quot;comment.&quot; The prompt is
              &quot;improve the reasoning object.&quot;
            </h2>
            <div className={styles.debateGrid}>
              {proposal001.debatePrompts.map((item) => (
                <article className={styles.debateCard} key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </article>

          <article className={styles.panel}>
            <span className={styles.eyebrow}>Open questions</span>
            <h2>What still needs to be learned before this proposal can mature</h2>
            <ul className={styles.bulletList}>
              {proposal001.openQuestions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className={styles.panel}>
          <span className={styles.eyebrow}>Version history</span>
          <h2>The card should show how public reasoning changes over time.</h2>
          <div className={styles.historyList}>
            {proposal001.revisionHistory.map((item) => (
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
