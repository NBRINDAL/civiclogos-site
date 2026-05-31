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

const revenuePaths = [
  {
    title: "Institutional issue rooms",
    body: "Hosted public or semi-public reasoning spaces for a university, nonprofit, company, newsroom, or civic organization to map claims, objections, evidence, and revisions around one high-stakes issue.",
  },
  {
    title: "Civic issue diagnostics",
    body: "Short engagements that turn a messy public issue into a structured ledger: core claims, strongest objections, evidence gaps, unresolved questions, and recommended review steps.",
  },
  {
    title: "Hosted review workflows",
    body: "Maintainer-facing tools for intake, routing, evidence review, human decision notes, promotion, rejection, archiving, and visible revision tracking.",
  },
  {
    title: "Public correction/revision ledgers",
    body: "Durable correction memory for organizations that need to show how public claims, reports, policies, or AI outputs changed over time and why.",
  },
  {
    title: "AI-assisted research and review tools",
    body: "Reader and reviewer support for summarizing existing records, identifying attachment targets, drafting internal notes, and surfacing evidence burdens without letting AI move the public record.",
  },
  {
    title: "Structured reports",
    body: "Investor, policy, board, grant, or public-interest briefs generated from a ledger so the reasoning trail stays inspectable instead of becoming a one-off PDF.",
  },
  {
    title: "API access to the Civic Logos Reasoning Ledger",
    body: "Programmatic access to claims, contributions, evidence anchors, objections, review decisions, revision events, and provenance for teams building trusted reasoning workflows.",
  },
  {
    title: "Open-source ledger plus hosted/enterprise workflow layer",
    body: "An open protocol and schema for trust, paired with hosted infrastructure, private workflow controls, integrations, support, and enterprise governance features.",
  },
] as const;

const customers = [
  "universities",
  "nonprofits",
  "professional associations",
  "public-interest newsrooms",
  "civic organizations",
  "foundations",
  "companies facing public-trust questions",
  "local governments",
  "research and policy groups",
] as const;

const useOfFunds = [
  "founder/build runway",
  "backend/database/review tooling",
  "AI-reader workflow and routing",
  "security/privacy/trust-boundary hardening",
  "open-source Reasoning Ledger development",
  "first institutional pilots",
  "usability testing and early customer discovery",
] as const;

const milestones = [
  "first real outside contribution processed through the review path",
  "first institutional pilot conversation",
  "expanded deterministic read-only answers",
  "Reasoning Ledger protocol hardening",
  "first paid diagnostic or issue-room pilot",
  "investor/customer feedback loop",
] as const;

const links = [
  { label: "Try Civic Logos", href: "/" },
  { label: "Demo", href: "/demo" },
  { label: "Ledger", href: "/ledger" },
  { label: "Healthcare card", href: "/healthcare/topic-001?view=ledger" },
  { label: "Physics Foundations", href: "/rooms/physics-foundations/topic-001" },
  { label: "About", href: "/about" },
  { label: "Institutions", href: "/institutions" },
  { label: "Press", href: "/press" },
] as const;

const founderLinkedInHref = "https://www.linkedin.com/in/nick-rindal-675068171";

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
            <Link href="/demo">Demo</Link>
            <Link href="/ledger">Ledger</Link>
            <Link href="/institutions">Institutions</Link>
            <Link href="/press">Press</Link>
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
            <span className={styles.eyebrow}>Revenue paths</span>
            <h2>Early-stage paths, not traction claims.</h2>
            <p>
              Civic Logos is still early. These are product and revenue
              hypotheses around a live V2 prototype, not claims of current
              revenue or signed customers.
            </p>
          </div>
          <div className={styles.revenueGrid}>
            {revenuePaths.map((item) => (
              <article className={styles.revenueCard} key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.sectionGrid} aria-label="Customers and funding">
          <article className={styles.card}>
            <span className={styles.eyebrow}>Customers / buyers</span>
            <h2>Likely early buyers</h2>
            <BulletList items={customers} />
          </article>

          <article className={styles.card}>
            <span className={styles.eyebrow}>Funding</span>
            <h2>Exploring aligned pre-seed conversations.</h2>
            <p>
              Civic Logos is exploring aligned pre-seed conversations to turn
              the live V2 prototype into a durable product, expand the review
              workflow, harden the open-source Reasoning Ledger, and begin
              institutional pilot outreach.
            </p>
            <p className={styles.plainNote}>
              Current target: $300k pre-seed. Specific terms available to
              qualified investors on request.
            </p>
          </article>
        </section>

        <section className={styles.fundingBand}>
          <div>
            <span className={styles.eyebrow}>Use of funds</span>
            <h2>Make the prototype durable enough for pilots.</h2>
            <p>
              The near-term funding goal is practical: more reliable backend
              infrastructure, stronger review tooling, safer AI-reader flows,
              trust-boundary hardening, and early customer discovery.
            </p>
          </div>
          <div className={styles.fundsCard}>
            <strong>Planned allocation areas</strong>
            <BulletList items={useOfFunds} />
          </div>
        </section>

        <section className={styles.milestones}>
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>Near-term milestones</span>
            <h2>Proof points that matter next.</h2>
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

        <section className={styles.founderBand}>
          <div>
            <span className={styles.eyebrow}>Founder</span>
            <h2>Founder-built and self-funded to date.</h2>
            <p>
              Nick Rindal is the founder and primary builder of Civic Logos. The
              current V2 product, ledger workflow, public site, protocol
              direction, and investor materials are founder-built and
              self-funded to date.
            </p>
          </div>
          <div className={styles.founderLinks}>
            <a className={styles.secondaryAction} href={founderLinkedInHref}>
              LinkedIn
            </a>
            <a className={styles.secondaryAction} href="mailto:hello@civiclogos.com">
              hello@civiclogos.com
            </a>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>Links</span>
            <h2>Inspect the live product and public record.</h2>
          </div>
          <div className={styles.linkGrid}>
            {links.map((item) => (
              <Link className={styles.routeCard} href={item.href} key={item.href}>
                {item.label}
              </Link>
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
