import type { Metadata } from "next";
import Link from "next/link";
import { SiteBrand } from "../components/site-brand";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Press | Civic Logos",
  description:
    "A fast producer-facing overview of Civic Logos, a public reasoning platform for claims, objections, evidence, AI-assisted sorting, human review, and visible revision history.",
};

const inspectItems = [
  {
    title: "Reader View",
    body: "The plain-language surface for understanding the current synthesis, strongest objection, strongest evidence, unresolved pressure, and what would move the card.",
  },
  {
    title: "Ledger View",
    body: "The full record: contributions, AI-assisted sorting, human review state, score pressure, attachment targets, and revision trace.",
  },
  {
    title: "Contribution records",
    body: "Each submission keeps lane, status, date, provenance, reviewer note, AI sorting, attachment target, and card-impact boundary visible.",
  },
  {
    title: "AI-assisted sorting",
    body: "GPT and Claude can help propose lane fit, attachment target, likely impact, and review notes. They do not decide the record.",
  },
  {
    title: "Human review notes",
    body: "Reviewer decisions explain placement, public record impact, and whether a contribution changes the visible card.",
  },
  {
    title: "Changed-card records",
    body: "The site distinguishes potential impact from actual changes made after human review.",
  },
  {
    title: "Revision trace",
    body: "The record keeps memory of what changed, why it changed, and which contribution or review decision moved it.",
  },
  {
    title: "Institutional pilot model",
    body: "The Public Review Stake model: money can fund scrutiny and synthesis labor, not legitimacy or favorable conclusions.",
  },
] as const;

const hooks = [
  "AI should structure public reasoning, not declare truth.",
  "Money should fund scrutiny, not legitimacy.",
  "Institutions should not be able to hide claims in PR cycles.",
  "Strong objections should survive instead of disappearing into comment threads.",
  "Public trust requires visible correction memory.",
] as const;

const directLinks = [
  { label: "Homepage", href: "/" },
  { label: "Public challenge", href: "/challenge" },
  { label: "Healthcare Reader View", href: "/healthcare/topic-001" },
  {
    label: "Healthcare Ledger View",
    href: "/healthcare/topic-001?view=ledger#contribution-record",
  },
  {
    label: "Pressure-test contribution path",
    href: "/healthcare/topic-001?view=ledger&contributeLane=objection&contributeFrom=press#debate",
  },
  { label: "Institutional pilot model", href: "/institutions#model" },
] as const;

const producerSummary =
  "Civic Logos is a public reasoning platform that turns important claims into living records with objections, evidence, AI-assisted sorting, human review, and visible revision history. The first public challenge asks whether readers can submit one objection, source, or correction that improves the first healthcare card and becomes part of the public record.";

export default function PressPage() {
  return (
    <div className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true" />

      <header className={styles.header}>
        <nav className={styles.nav}>
          <SiteBrand className={styles.brand} href="/" subtitle="Press brief" />
          <div className={styles.navLinks}>
            <Link href="/">Home</Link>
            <Link href="/challenge">Challenge</Link>
            <Link href="/healthcare/topic-001">Healthcare card</Link>
            <Link href="/healthcare/topic-001?view=ledger#contribution-record">
              Ledger
            </Link>
            <Link href="/institutions">Institutions</Link>
          </div>
        </nav>

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Producer brief</span>
            <h1>Civic Logos is being built as public reasoning infrastructure.</h1>
            <p className={styles.oneLine}>
              Civic Logos is a public reasoning platform that turns important
              claims into living records with objections, evidence, AI-assisted
              sorting, human review, and visible revision history.
            </p>
            <div className={styles.heroActions}>
              <Link
                className={styles.primaryAction}
                href="/challenge"
              >
                Open public challenge
              </Link>
              <Link className={styles.secondaryAction} href="/healthcare/topic-001">
                Inspect the demo object
              </Link>
            </div>
          </div>

          <aside className={styles.challengeCard}>
            <span className={styles.eyebrow}>Public challenge</span>
            <h2>
              Can a reader submit one strong objection, one evidence source, or
              one correction that improves the first Civic Logos card and becomes
              part of the public record?
            </h2>
            <p>
              That is the current proof step. The site is not asking for passive
              approval; it is asking whether the record can be made stronger in
              public.
            </p>
          </aside>
        </section>
      </header>

      <main className={styles.main}>
        <section className={styles.shareLinkCard}>
          <div>
            <span className={styles.eyebrow}>Best link to send</span>
            <h2>Use /challenge for media mentions.</h2>
            <p>
              The challenge page orients first-time visitors before sending them
              into the healthcare ledger, preserves optional source tracking,
              and keeps the first outside contribution as the central ask.
            </p>
          </div>
          <div className={styles.shareActions}>
            <Link className={styles.primaryAction} href="/challenge">
              Go to /challenge
            </Link>
            <Link
              className={styles.secondaryAction}
              href="/healthcare/topic-001?view=ledger&contributeLane=objection&contributeFrom=press#debate"
            >
              Skip to objection draft
            </Link>
          </div>
        </section>

        <section className={styles.producerSummary}>
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>Copyable producer summary</span>
            <h2>One paragraph for show notes, booking threads, or prep docs.</h2>
          </div>
          <textarea
            aria-label="Copyable Civic Logos producer summary"
            className={styles.summaryTextarea}
            readOnly
            value={producerSummary}
          />
        </section>

        <section className={styles.section}>
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>Why this matters</span>
            <h2>Modern discourse buries arguments in feeds.</h2>
            <p>
              Civic Logos gives serious public claims durable memory: what was
              claimed, what challenged it, what evidence mattered, what remained
              unresolved, and what caused the record to change.
            </p>
          </div>

          <div className={styles.demoCard}>
            <div>
              <span className={styles.cardLabel}>Best demo object</span>
              <h3>Administrative Simplification and AI-Assisted Triage</h3>
              <p>
                The healthcare card is the strongest current proof object because
                it shows the product loop without requiring a new room: Reader
                View, Ledger View, contribution records, AI-assisted sorting,
                human review notes, changed-card records, and revision trace.
              </p>
            </div>
            <div className={styles.demoActions}>
              <Link className={styles.primaryAction} href="/healthcare/topic-001">
                Open Reader View
              </Link>
              <Link
                className={styles.secondaryAction}
                href="/healthcare/topic-001?view=ledger#contribution-record"
              >
                Open Ledger View
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>What to inspect</span>
            <h2>The useful question is whether the record holds pressure.</h2>
          </div>
          <div className={styles.inspectGrid}>
            {inspectItems.map((item) => (
              <article className={styles.inspectCard} key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.positionSection}>
          <article className={styles.positionCard}>
            <span className={styles.eyebrow}>Founder position</span>
            <h2>
              Civic Logos is not asking for endorsement. It is asking for
              critique, stress-testing, and better public reasoning.
            </h2>
            <p>
              The project is challenge-oriented by design. Strong objections
              should remain visible. AI can help structure the record, but it is
              not the final judge. Institutions can fund examination, but they
              cannot buy legitimacy.
            </p>
          </article>

          <article className={styles.hookCard}>
            <span className={styles.eyebrow}>Media hooks</span>
            <ul className={styles.hookList}>
              {hooks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className={styles.linksSection}>
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>Fast links</span>
            <h2>Useful routes for a journalist, podcaster, or producer.</h2>
          </div>
          <div className={styles.linkGrid}>
            {directLinks.map((item) => (
              <Link className={styles.routeCard} href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.contactBand}>
          <div>
            <span className={styles.eyebrow}>Contact</span>
            <h2>Open a serious conversation.</h2>
            <p>
              For interviews, producer questions, or critique of the core
              reasoning model:{" "}
              <a href="mailto:hello@civiclogos.com">hello@civiclogos.com</a>
            </p>
          </div>
          <Link
            className={styles.primaryAction}
            href="/challenge"
          >
            Open public challenge
          </Link>
        </section>
      </main>
    </div>
  );
}
