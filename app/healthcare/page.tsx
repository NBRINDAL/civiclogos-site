import Link from "next/link";
import {
  healthcareIssueRoom,
  issueRoomQuestion,
} from "../lib/civic-logos";
import styles from "./page.module.css";

function ProposalStrip({
  title,
  items,
}: {
  title: string;
  items: readonly {
    title: string;
    summary: string;
    label: string;
    metric: string;
    href?: string;
  }[];
}) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeading}>
        <span className={styles.eyebrow}>{title}</span>
      </div>
      <div className={styles.proposalGrid}>
        {items.map((item) => {
          const card = (
            <>
              <span className={styles.cardTag}>{item.label}</span>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
              <span className={styles.metric}>{item.metric}</span>
            </>
          );

          return item.href ? (
            <Link className={styles.proposalCard} href={item.href} key={item.title}>
              {card}
            </Link>
          ) : (
            <article className={styles.proposalCard} key={item.title}>
              {card}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default function HealthcareIssueRoomPage() {
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
            <Link href="/healthcare/proposal-001">Proposal 001</Link>
            <a href="#open-questions">Open questions</a>
          </nav>
        </div>

        <div className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>First issue room</span>
            <h1>{healthcareIssueRoom.title}</h1>
            <p className={styles.question}>{issueRoomQuestion}</p>
            <p className={styles.summary}>{healthcareIssueRoom.currentSynthesis}</p>

            <div className={styles.heroActions}>
              <Link className={styles.primaryAction} href="/healthcare/proposal-001">
                Open Proposal 001
              </Link>
              <a className={styles.secondaryAction} href="#room-structure">
                See room structure
              </a>
            </div>
          </div>

          <aside className={styles.heroPanel}>
            <span className={styles.panelLabel}>Why healthcare first</span>
            <p>{healthcareIssueRoom.whyItMatters}</p>
            <div className={styles.heroStats}>
              <div>
                <strong>1</strong>
                <span>living synthesis</span>
              </div>
              <div>
                <strong>10</strong>
                <span>major proposal families</span>
              </div>
              <div>
                <strong>9</strong>
                <span>structured debate lanes</span>
              </div>
            </div>
          </aside>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.section} id="room-structure">
          <div className={styles.sectionHeading}>
            <span className={styles.eyebrow}>Room structure</span>
            <h2>The issue room is a public workspace, not a comment thread.</h2>
            <p>
              The paper frames an Issue Room as the primary civic reasoning
              space for one major question. The structure below follows that
              brief directly.
            </p>
          </div>

          <div className={styles.structureGrid}>
            {healthcareIssueRoom.roomComponents.map((item) => (
              <article className={styles.structureCard} key={item}>
                <h3>{item}</h3>
                <p>
                  This section stays visible so the room can accumulate evidence,
                  objections, stakeholder tradeoffs, and revision pressure over
                  time.
                </p>
              </article>
            ))}
          </div>
        </section>

        <ProposalStrip title="Top proposals" items={healthcareIssueRoom.topProposals} />
        <ProposalStrip
          title="Most novel proposals"
          items={healthcareIssueRoom.novelProposals}
        />
        <ProposalStrip
          title="Highest economic-delta proposals"
          items={healthcareIssueRoom.economicDeltaLeaders}
        />
        <ProposalStrip
          title="Most debated proposals"
          items={healthcareIssueRoom.mostDebated}
        />

        <section className={styles.twoColumnSection}>
          <article className={styles.panel}>
            <span className={styles.eyebrow}>Claim map</span>
            <h2>Key claims stay discrete, reviewable, and revisable.</h2>
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
            <span className={styles.eyebrow}>Evidence library</span>
            <h2>Evidence should be visible with status, not treated as magic.</h2>
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
        </section>

        <section className={styles.twoColumnSection}>
          <article className={styles.panel}>
            <span className={styles.eyebrow}>Public perspectives</span>
            <h2>Perspective stays distinct from synthesis.</h2>
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
            <span className={styles.eyebrow}>Stakeholders</span>
            <h2>The room should make visible who benefits, pays, implements, or absorbs risk.</h2>
            <div className={styles.tagList}>
              {healthcareIssueRoom.stakeholders.map((item) => (
                <span className={styles.tag} key={item}>
                  {item}
                </span>
              ))}
            </div>
          </article>
        </section>

        <section className={styles.twoColumnSection}>
          <article className={styles.panel}>
            <span className={styles.eyebrow}>Objection library</span>
            <h2>Strong objections should stay visible rather than being buried.</h2>
            <ul className={styles.bulletList}>
              {healthcareIssueRoom.objectionLibrary.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className={styles.panel} id="open-questions">
            <span className={styles.eyebrow}>Open questions</span>
            <h2>The room should preserve uncertainty where the evidence is still incomplete.</h2>
            <ul className={styles.bulletList}>
              {healthcareIssueRoom.openQuestions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className={styles.ctaPanel}>
          <div>
            <span className={styles.eyebrow}>Proposal 001</span>
            <h2>The first complete idea object should demonstrate the process, not claim final truth.</h2>
            <p>
              The brief says Proposal 001 succeeds if a raw healthcare idea can
              become a structured card, receive AI review, attract objections,
              surface economic assumptions, and evolve through revision.
            </p>
          </div>

          <Link className={styles.primaryAction} href="/healthcare/proposal-001">
            View the full idea card
          </Link>
        </section>
      </main>
    </div>
  );
}
