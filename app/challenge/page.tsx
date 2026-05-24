import type { Metadata } from "next";
import Link from "next/link";
import { SiteBrand } from "../components/site-brand";
import { topicCardVisibleContributionLimit } from "../lib/contribution-constants";
import { getContributionStoreMetadata, listPublicContributions } from "../lib/contribution-store";
import { getContributionCountSummary } from "../lib/contribution-counts";
import { normalizeContributionReferralSource } from "../lib/contribution-types";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Can you improve the public record? | Civic Logos",
  description:
    "A Civic Logos challenge page for readers from media mentions to submit one strong objection, evidence source, correction, or implementation concern to the first live healthcare card.",
};

const healthcareTopicHref = "/healthcare/topic-001";
const contributionBaseHref = `${healthcareTopicHref}?view=ledger&contributeFrom=challenge`;

const strongContributionItems = [
  "A specific objection to one claim",
  "A concrete evidence source",
  "A correction to a factual, numeric, or definitional issue",
  "An implementation concern",
  "An economic assumption challenge",
  "A stakeholder perspective",
] as const;

const afterSubmitItems = [
  "The record enters as an outside public submission",
  "GPT/Claude-assisted readers propose lane, attachment, and possible impact",
  "Human review decides placement and whether the card changes",
  "Accepted or incorporated contributions remain visible in the ledger",
  "If the card changes, the revision trace records why",
] as const;

const notItems = [
  "Not a comment feed",
  "Not a popularity contest",
  "Not an AI truth machine",
  "Not pay-to-win legitimacy",
  "Not a partisan media project",
  "Not an endorsement request",
] as const;

const bestFirstContributionExamples = [
  {
    lane: "objection",
    title: "One strong objection",
    body: "The card assumes administrative simplification lowers costs, but savings may be captured by intermediaries unless the record specifies who receives the benefit.",
    action: "Start an objection draft",
  },
  {
    lane: "evidence",
    title: "One concrete evidence source",
    body: "A credible report, policy document, dataset, or paper that measures prior authorization burden, claims friction, documentation time, or triage outcomes.",
    action: "Start an evidence draft",
  },
  {
    lane: "correction",
    title: "One correction",
    body: "A specific factual, numeric, definitional, or scope issue that should be changed before the card is treated as a reliable public record.",
    action: "Start a correction draft",
  },
] as const;

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function contributionHref(lane: string, referralSource?: string) {
  const referralParam = referralSource
    ? `&referralSource=${encodeURIComponent(referralSource)}`
    : "";
  return `${contributionBaseHref}&contributeLane=${lane}${referralParam}#debate`;
}

export default async function ChallengePage({
  searchParams,
}: {
  searchParams?: Promise<{
    heardFrom?: string | string[];
    referralSource?: string | string[];
  }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const inboundReferralSource = normalizeContributionReferralSource(
    getFirstValue(resolvedSearchParams.referralSource) ??
      getFirstValue(resolvedSearchParams.heardFrom),
  );
  const [metadata, contributions] = await Promise.all([
    getContributionStoreMetadata(),
    listPublicContributions({
      roomSlug: "healthcare",
      topicId: "topic-001",
      limit: topicCardVisibleContributionLimit,
    }),
  ]);

  const contributionCounts = getContributionCountSummary(contributions);
  const proofStats = [
    {
      label: "Prototype records",
      value: String(contributionCounts.prototypeExamples),
      note: "Seeded examples show how the ledger behaves without pretending they are public usage.",
    },
    {
      label: "Pending review items",
      value: String(contributionCounts.pendingReview),
      note: "Open review pressure shows where human judgment still has work to do.",
    },
    {
      label: "Changed-card records",
      value: String(contributionCounts.changedCard),
      note: "These are records whose human review says they changed the public card.",
    },
    {
      label: "Outside submissions so far",
      value: String(contributionCounts.publicSubmissions),
      note: "The mission is to turn the first real outside contribution into visible public record pressure.",
    },
    {
      label: "Founder-submitted test record",
      value: String(contributionCounts.founderSubmitted),
      note: "Non-prototype records from Civic Logos stay labeled separately and do not count as outside public uptake.",
    },
    {
      label: "Database mode",
      value: metadata.mode === "database" ? "Active" : "Prototype/fallback",
      note: metadata.note,
    },
    {
      label: "Contribution form",
      value: "Ready",
      note: "The healthcare card opens with guided starter drafts for objection, evidence, and correction lanes.",
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true" />

      <header className={styles.header}>
        <nav className={styles.nav}>
          <SiteBrand className={styles.brand} href="/" subtitle="Public challenge" />
          <div className={styles.navLinks}>
            <Link href="/">Home</Link>
            <Link href="/press">Press</Link>
            <Link href="/demo">Demo</Link>
            <Link href="/institutions">Institutions</Link>
          </div>
        </nav>

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Public reasoning challenge</span>
            <h1>Can you improve the public record?</h1>
            <p className={styles.subheadline}>
              Civic Logos is testing a public reasoning ledger. Submit one
              strong objection, evidence source, correction, or implementation
              concern to the first live healthcare card.
            </p>
            <div className={styles.heroActions}>
              <Link
                className={styles.primaryAction}
                href={contributionHref("objection", inboundReferralSource)}
              >
                Pressure-test the healthcare card
              </Link>
              <Link className={styles.secondaryAction} href="/demo">
                Watch the 8-step demo
              </Link>
            </div>
          </div>

          <aside className={styles.challengeCard}>
            <span className={styles.eyebrow}>The public challenge</span>
            <h2>The first healthcare card is waiting for its first real outside contribution.</h2>
            <p>
              The challenge is to submit one contribution that makes the record
              more accurate, complete, or honest.
            </p>
          </aside>
        </section>
      </header>

      <main className={styles.main}>
        <section className={styles.ctaStrip} aria-label="Challenge actions">
          <Link
            className={styles.primaryAction}
            href={contributionHref("objection", inboundReferralSource)}
          >
            Pressure-test the healthcare card
          </Link>
          <Link className={styles.secondaryAction} href="/demo">
            Watch the 8-step demo
          </Link>
          <Link className={styles.secondaryAction} href={`${healthcareTopicHref}?view=ledger#contribution-record`}>
            Inspect the contribution ledger
          </Link>
          <Link
            className={styles.secondaryAction}
            href={contributionHref("evidence", inboundReferralSource)}
          >
            Submit an evidence source
          </Link>
          <Link className={styles.secondaryAction} href="/institutions">
            Request an institutional review pilot
          </Link>
        </section>

        <section className={styles.twoColumn}>
          <article className={styles.panel}>
            <span className={styles.eyebrow}>What this is</span>
            <h2>A ledger for claims that should not disappear into feeds.</h2>
            <p>
              Civic Logos turns important public claims into living records with
              objections, evidence, assumptions, AI-assisted sorting, human
              review, and visible revision history.
            </p>
          </article>

          <article className={styles.panel}>
            <span className={styles.eyebrow}>Media framing</span>
            <h2>Civic Logos is not trying to become the media.</h2>
            <p>
              It is trying to become the public record underneath media: a place
              where claims, objections, evidence, correction memory, and revision
              history can survive after the segment, thread, or article moves on.
            </p>
          </article>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>What counts</span>
            <h2>Strong contributions make one inspectable move.</h2>
          </div>
          <div className={styles.cardGrid}>
            {strongContributionItems.map((item) => (
              <article className={styles.smallCard} key={item}>
                <span>{item}</span>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.exampleSection}>
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>Best first contribution</span>
            <h2>Good contributions are specific enough to review.</h2>
            <p>
              The first outside submission does not need to solve healthcare. It
              needs to make one part of the card more accurate, complete, or honest.
            </p>
          </div>
          <div className={styles.exampleGrid}>
            {bestFirstContributionExamples.map((item) => (
              <article className={styles.exampleCard} key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <Link
                  className={styles.exampleAction}
                  href={contributionHref(item.lane, inboundReferralSource)}
                >
                  {item.action}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.twoColumn}>
          <article className={styles.panel}>
            <span className={styles.eyebrow}>After submission</span>
            <h2>The loop is contribution, assisted reading, human review, visible trace.</h2>
            <ol className={styles.stepList}>
              {afterSubmitItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </article>

          <article className={styles.panel}>
            <span className={styles.eyebrow}>What this is not</span>
            <h2>This is not another feed.</h2>
            <ul className={styles.notList}>
              {notItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className={styles.proofSection}>
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>First proof object</span>
            <h2>Administrative Simplification and AI-Assisted Triage</h2>
            <p>
              This healthcare card is the first live object because it is concrete
              enough to challenge: administrative overhead, prior authorization,
              documentation burden, patient routing, AI-assisted triage, and
              implementation risk.
            </p>
          </div>

          <div className={styles.proofGrid}>
            {proofStats.map((item) => (
              <article className={styles.proofCard} key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <p>{item.note}</p>
              </article>
            ))}
          </div>

          <div className={styles.proofActions}>
            <Link
              className={styles.primaryAction}
              href={contributionHref("objection", inboundReferralSource)}
            >
              Submit one strong objection
            </Link>
            <Link
              className={styles.secondaryAction}
              href={contributionHref("evidence", inboundReferralSource)}
            >
              Submit an evidence source
            </Link>
            <Link className={styles.secondaryAction} href={`${healthcareTopicHref}?view=ledger#revision-trace`}>
              Inspect revision trace
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
