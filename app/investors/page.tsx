import type { Metadata } from "next";
import Link from "next/link";
import { SiteBrand } from "../components/site-brand";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Investors | Civic Logos",
  description:
    "A concise investor overview of Civic Logos, a chat-first AI reasoning ledger for public claims, evidence, objections, human review, and visible revision history.",
};

const productStatus = [
  "chat-first front door",
  "read-only ledger answers",
  "pre-ledger candidate intake",
  "conservative routing",
  "healthcare and Physics Foundations support",
  "maintainer-gated promotion",
  "public ledger and revision trace",
  "AI cannot write directly into the public record",
] as const;

const useCases = [
  "healthcare policy",
  "foundational science",
  "institutional trust",
  "AI governance",
  "public correction ledgers",
  "institutional issue rooms",
] as const;

const businessModel = [
  "institutional issue rooms",
  "civic issue diagnostics",
  "AI-assisted review workflows",
  "public correction/revision ledgers",
  "structured reports",
  "API access to Reasoning Ledger",
] as const;

const useOfFunds = [
  "durable backend/review tooling",
  "AI-reader workflow",
  "security/privacy/trust hardening",
  "open-source Reasoning Ledger",
  "first institutional pilots",
] as const;

const milestones = [
  "first outside contribution",
  "first institutional pilot conversation",
  "open-source ledger protocol hardening",
  "paid diagnostic or issue-room pilot",
] as const;

function BulletList({
  items,
}: {
  items: readonly string[];
}) {
  return (
    <ul className={styles.bulletList}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function InvestorsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true" />

      <header className={styles.header}>
        <nav className={styles.nav}>
          <SiteBrand className={styles.brand} href="/" subtitle="Investor overview" />
          <div className={styles.navLinks}>
            <Link href="/">Live product</Link>
            <Link href="/ledger">Ledger</Link>
            <Link href="/demo">Demo</Link>
            <Link href="/about">About</Link>
            <Link href="/institutions">Institutions</Link>
          </div>
        </nav>

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Civic Logos V2</span>
            <h1>A chat-first reasoning ledger for public claims.</h1>
            <p className={styles.thesis}>
              Civic Logos is a chat-first AI reasoning ledger for public claims,
              evidence, objections, human review, and visible revision history.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryAction} href="/">
                Try the live product
              </Link>
              <a className={styles.secondaryAction} href="mailto:hello@civiclogos.com">
                Contact
              </a>
            </div>
          </div>

          <aside className={styles.boundaryCard}>
            <span className={styles.eyebrow}>Trust boundary</span>
            <h2>AI structures. Human review moves the public record.</h2>
            <p>
              AI may answer from the public ledger and structure pre-ledger
              candidates. It cannot create public ContributionRecords,
              RevisionEvents, or synthesis changes directly.
            </p>
          </aside>
        </section>
      </header>

      <main className={styles.main}>
        <section className={styles.whyNow}>
          <span className={styles.eyebrow}>Why now</span>
          <h2>Claims are getting cheaper. Public memory is not keeping up.</h2>
          <p>
            AI makes claims and analysis cheaper; institutions, media, and the
            public need durable memory for how claims are challenged, corrected,
            and revised.
          </p>
        </section>

        <section className={styles.sectionGrid} aria-label="Product and use cases">
          <article className={styles.card}>
            <span className={styles.eyebrow}>Product status</span>
            <h2>Live V2 product</h2>
            <BulletList items={productStatus} />
          </article>

          <article className={styles.card}>
            <span className={styles.eyebrow}>Initial use cases</span>
            <h2>Where the ledger starts</h2>
            <BulletList items={useCases} />
          </article>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>Business model</span>
            <h2>Institutional tools around public reasoning memory.</h2>
            <p>
              Civic Logos is exploring products that help organizations map,
              review, and revise high-stakes claims without hiding the reasoning
              trail.
            </p>
          </div>
          <div className={styles.modelGrid}>
            {businessModel.map((item) => (
              <article className={styles.modelCard} key={item}>
                <strong>{item}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.fundingBand}>
          <div>
            <span className={styles.eyebrow}>Funding</span>
            <h2>Exploring $300k pre-seed.</h2>
            <p>
              The goal is to turn the live V2 proof into a more durable,
              secure, and pilot-ready reasoning infrastructure layer. No revenue
              is claimed here.
            </p>
          </div>
          <div className={styles.fundsCard}>
            <strong>Use of funds</strong>
            <BulletList items={useOfFunds} />
          </div>
        </section>

        <section className={styles.milestones}>
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>Milestones</span>
            <h2>Near-term proof points.</h2>
            <p>
              The first outside public contribution remains open. V2 currently
              distinguishes maintainer-promoted candidates, founder records,
              prototype examples, and outside submissions.
            </p>
          </div>
          <div className={styles.milestoneList}>
            {milestones.map((item, index) => (
              <article className={styles.milestoneCard} key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.ctaBand}>
          <div>
            <span className={styles.eyebrow}>CTA</span>
            <h2>Try the live product.</h2>
            <p>
              The public site is the audit surface. The chat is the interaction
              surface. The ledger remains human-reviewed.
            </p>
          </div>
          <div className={styles.ctaActions}>
            <a className={styles.primaryAction} href="https://www.civiclogos.com">
              civiclogos.com
            </a>
            <a className={styles.secondaryAction} href="mailto:hello@civiclogos.com">
              hello@civiclogos.com
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
