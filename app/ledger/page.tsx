import type { Metadata } from "next";
import Link from "next/link";
import { SiteBrand } from "../components/site-brand";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Civic Logos Reasoning Ledger | Civic Logos",
  description:
    "An open protocol and reference implementation proposal for public claims, contributions, AI-reader notes, human review decisions, and visible revision history.",
};

const coreObjects = [
  "RoomRecord",
  "TopicRecord",
  "ClaimRecord",
  "SynthesisSnapshot",
  "ContributionRecord",
  "EvidenceObject",
  "ObjectionRecord",
  "AssumptionRecord",
  "OpenQuestionRecord",
  "AIReaderNote",
  "HumanReviewDecision",
  "AppealRecord",
  "AttachmentTarget",
  "RevisionEvent",
  "MetricScore",
  "AuditEvent",
  "ActorRecord",
] as const;

const workflowSteps = [
  "Contribution enters",
  "classified into a lane",
  "AI-reader notes are attached",
  "human review decides placement",
  "record attaches to claim, evidence, objection, assumption, or open question",
  "synthesis changes only if warranted",
  "before/after revision trace is preserved",
] as const;

const plannedDeliverables = [
  "open specification",
  "TypeScript/Postgres reference implementation",
  "API routes",
  "minimal review UI",
  "test fixtures",
  "documentation",
  "example healthcare ledger integration",
] as const;

const reuseAudiences = [
  "civic-tech projects",
  "newsrooms",
  "public comment systems",
  "research groups",
  "institutions",
] as const;

const directLinks = [
  {
    label: "Protocol charter",
    href: "https://github.com/NBRINDAL/civiclogos-site/tree/main/spec",
  },
  {
    label: "JSON schemas",
    href: "https://github.com/NBRINDAL/civiclogos-site/tree/main/schema",
  },
  {
    label: "Example fixtures",
    href: "https://github.com/NBRINDAL/civiclogos-site/tree/main/examples",
  },
  {
    label: "Conformance tests",
    href: "https://github.com/NBRINDAL/civiclogos-site/tree/main/tests",
  },
  {
    label: "Healthcare ledger",
    href: "/healthcare/topic-001?view=ledger#contribution-record",
  },
  {
    label: "Healthcare protocol JSON",
    href: "/api/ledger/healthcare/topic-001",
  },
  { label: "Ask Civic Logos", href: "/ask" },
  { label: "Demo", href: "/demo" },
  { label: "Challenge", href: "/challenge" },
  { label: "Institutions", href: "/institutions" },
  {
    label: "GitHub prototype repository",
    href: "https://github.com/NBRINDAL/civiclogos-site",
  },
] as const;

export default function LedgerPage() {
  return (
    <div className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true" />

      <header className={styles.header}>
        <nav className={styles.nav}>
          <SiteBrand className={styles.brand} href="/" subtitle="Reasoning Ledger" />
          <div className={styles.navLinks}>
            <Link href="/">Main chat</Link>
            <Link href="/demo">Demo</Link>
            <Link href="/challenge">Challenge</Link>
            <Link href="/press">Press</Link>
            <Link href="/institutions">Institutions</Link>
          </div>
        </nav>

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Open-source layer</span>
            <h1>Civic Logos Reasoning Ledger</h1>
            <p className={styles.subtitle}>
              An open protocol and reference implementation for public claims,
              contributions, AI-reader notes, human review decisions, and visible
              revision history.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryAction} href="/">
                Open main chat
              </Link>
              <Link
                className={styles.secondaryAction}
                href="/healthcare/topic-001?view=ledger#contribution-record"
              >
                Inspect healthcare ledger
              </Link>
            </div>
          </div>

          <aside className={styles.positionCard}>
            <span className={styles.eyebrow}>Product vs protocol</span>
            <p>
              Civic Logos is the live product and public prototype. The Reasoning
              Ledger is the reusable open-source layer: the claim, contribution,
              review, attachment, and revision machinery that other projects
              should be able to adapt without adopting the whole Civic Logos site.
            </p>
          </aside>
        </section>
      </header>

      <main className={styles.main}>
        <section className={styles.grantNote}>
          <span className={styles.eyebrow}>Grant-facing scope</span>
          <p>
            This page is the public anchor for NLnet-facing review of the
            proposed open-source layer. It describes the reusable ledger scope,
            planned deliverables, and current prototype evidence without treating
            the specification, license, or reference implementation as finished.
          </p>
        </section>

        <section className={styles.grantNote}>
          <span className={styles.eyebrow}>Public-record milestone</span>
          <p>
            Civic Logos has completed its first founder-maintainer public-record
            revision. The next milestone is the first outside public
            contribution.
          </p>
          <p>
            Count wording is intentionally split: the healthcare ledger currently
            has 1 formal RevisionEvent, while visible revision-trace updates may
            include supporting narrative checkpoints.
          </p>
        </section>

        <section className={styles.grantNote}>
          <span className={styles.eyebrow}>V2 status</span>
          <p>
            <strong>V2 candidate intake is active.</strong>
          </p>
          <ul className={styles.auditList}>
            <li>AI may create pre-ledger candidate records.</li>
            <li>Candidate records are not public contributions.</li>
            <li>Promotion requires human review.</li>
            <li>RevisionEvents still require the existing public review path.</li>
          </ul>
          <p>
            /ask does not change public counts, does not create RevisionEvents,
            and does not change synthesis.
          </p>
          <p>
            Physics Foundations read-only asks are now supported from the
            existing public topic. They remain read-only unless the user
            explicitly contributes a candidate.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryAction} href="/ask">
              Open `/ask`
            </Link>
          </div>
        </section>

        <section className={styles.twoColumn}>
          <article className={styles.panel}>
            <span className={styles.eyebrow}>Public-record audit</span>
            <h2>The first revision proved the ledger loop can move a card without faking public uptake.</h2>
            <ul className={styles.auditList}>
              <li>Origin was labeled as founder-maintainer, not outside public submission.</li>
              <li>AI-reader notes were recorded as advisory structure.</li>
              <li>Human review decided incorporation.</li>
              <li>The visible synthesis changed only after review.</li>
              <li>The revision trace preserved the before/after state.</li>
            </ul>
          </article>

          <article className={styles.panel}>
            <span className={styles.eyebrow}>Next public test</span>
            <h2>The first outside contribution is still the next milestone.</h2>
            <p>
              Prototype examples and founder-maintainer records stay labeled
              separately. The public runway now asks a stranger to make one
              useful objection, evidence source, correction, implementation
              concern, or economic assumption challenge.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryAction} href="/challenge">
                See how to contribute
              </Link>
            </div>
          </article>
        </section>

        <section className={styles.twoColumn}>
          <article className={styles.panel}>
            <span className={styles.eyebrow}>What it is</span>
            <h2>A versioned public reasoning record.</h2>
            <p>
              The ledger is for claims that should not disappear into feeds. It
              keeps the current synthesis, the pressure against it, the evidence
              attached to it, and the human decisions that explain why the record
              changed or did not change.
            </p>
          </article>

          <article className={styles.panel}>
            <span className={styles.eyebrow}>Current status</span>
            <h2>Visible prototype, protocol v0.1 in progress.</h2>
            <p>
              Prototype ledger concepts are visible in the healthcare card now,
              and protocol v0.1 is being formalized in the repository through
              specs, schemas, fixtures, and conformance cases. A reference
              implementation is the next phase; the open-source release is
              planned, not presented as complete.
            </p>
          </article>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>Core objects</span>
            <h2>The ledger is made of inspectable records, not feed posts.</h2>
          </div>
          <div className={styles.objectGrid}>
            {coreObjects.map((item) => (
              <article className={styles.objectCard} key={item}>
                <code>{item}</code>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.workflowSection}>
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>Core workflow</span>
            <h2>AI can assist the record, but human review moves it.</h2>
          </div>
          <ol className={styles.workflowList}>
            {workflowSteps.map((item, index) => (
              <li key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{item}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.twoColumn}>
          <article className={styles.panel}>
            <span className={styles.eyebrow}>Why open source</span>
            <h2>Reusable public reasoning infrastructure.</h2>
            <p>
              Other civic-tech projects, newsrooms, public comment systems,
              research groups, and institutions should be able to reuse the
              ledger without adopting the entire Civic Logos product.
            </p>
            <div className={styles.audienceChips}>
              {reuseAudiences.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </article>

          <article className={styles.panel}>
            <span className={styles.eyebrow}>Licensing plan</span>
            <h2>Libre/open release intent.</h2>
            <p>
              Grant-funded ledger code and documentation are intended to be
              released under recognized libre/open licenses. A final license
              should be named only after it is chosen.
            </p>
          </article>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>Planned deliverables</span>
            <h2>A specification plus a working reference path.</h2>
          </div>
          <div className={styles.deliverableGrid}>
            {plannedDeliverables.map((item) => (
              <article className={styles.deliverableCard} key={item}>
                <span>{item}</span>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.linkSection}>
          <div>
            <span className={styles.eyebrow}>Related links</span>
            <h2>Inspect the live prototype and public-facing paths.</h2>
          </div>
          <div className={styles.linkGrid}>
            {directLinks.map((item) => (
              <Link className={styles.linkCard} href={item.href} key={item.label}>
                {item.label}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
