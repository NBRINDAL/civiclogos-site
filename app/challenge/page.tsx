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

const firstContributionExamples = [
  {
    lane: "objection",
    title: "Strong objection",
    body: "The card assumes administrative simplification lowers costs, but savings may be captured by intermediaries unless the record specifies who receives the benefit.",
    why: "A good objection names the exact claim under pressure and the failure mode a reviewer should inspect.",
    action: "Start an objection draft",
  },
  {
    lane: "evidence",
    title: "Evidence source",
    body: "A credible report, policy document, dataset, or paper that measures prior authorization burden, claims friction, documentation time, or triage outcomes.",
    why: "A good source says what it supports, narrows, or challenges instead of simply dropping a link.",
    action: "Start an evidence draft",
  },
  {
    lane: "correction",
    title: "Correction",
    body: "A specific factual, numeric, definitional, or scope issue that should be changed before the card is treated as a reliable public record.",
    why: "A good correction is small enough to verify and precise enough for a human reviewer to accept or reject.",
    action: "Start a correction draft",
  },
  {
    lane: "implementation-concern",
    title: "Implementation concern",
    body: "The card names AI-assisted triage, but it still needs human-escalation thresholds, liability boundaries, and fail-safe rules before the proposal is operational.",
    why: "A good implementation concern explains what would break during deployment, not just whether the idea sounds appealing.",
    action: "Start an implementation draft",
  },
  {
    lane: "economic-assumption-challenge",
    title: "Economic assumption challenge",
    body: "The card should not treat gross administrative savings as net public savings until transition costs and savings-capture rules are attached to evidence.",
    why: "A good economic challenge identifies the assumption that controls whether the card's upside is real.",
    action: "Start an economic draft",
  },
] as const;

const guidedContributionPrompts = [
  {
    lane: "objection",
    prompt: "What is the strongest reason this card might be wrong?",
    detail: "Use this if you see an overclaim, missing counterargument, or hidden assumption.",
  },
  {
    lane: "evidence",
    prompt: "What evidence would make this card stronger or weaker?",
    detail: "Use this if you have a source, dataset, paper, or concrete institutional example.",
  },
  {
    lane: "implementation-concern",
    prompt: "What implementation detail is currently under-specified?",
    detail: "Use this if the idea depends on workflow, staffing, liability, escalation, or adoption details.",
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
  const currentStatusItems = [
    {
      label: "Founder-maintainer revision",
      value: "Complete",
      note: "The first synthesis change is labeled as maintainer-origin and visible in the revision trace.",
    },
    {
      label: "Outside public submissions",
      value: String(contributionCounts.publicSubmissions),
      note: "The first real outside contribution is still the next public milestone.",
    },
    {
      label: "Maintainer-promoted V2 candidates",
      value: String(contributionCounts.maintainerPromotedCandidates),
      note: "V2 candidate test records stay public only after maintainer promotion and do not count as outside submissions.",
    },
    {
      label: "Next milestone",
      value: "First outside contribution",
      note: "The goal is one useful public objection, source, correction, or implementation challenge.",
    },
    {
      label: "Prototype examples",
      value: "Labeled",
      note: `${contributionCounts.prototypeExamples} prototype examples remain separate from public uptake.`,
    },
    {
      label: "AI-origin records",
      value: String(contributionCounts.aiOrigin),
      note: "AI-origin records stay labeled separately from outside public uptake.",
    },
  ];
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
      note: "These count only when human review and a live revision trace changed the public card.",
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
      label: "Founder-maintainer records",
      value: String(contributionCounts.founderMaintainer),
      note: "Founder-maintainer revisions are formal review records, not outside public submissions.",
    },
    {
      label: "Maintainer-promoted V2 candidates",
      value: String(contributionCounts.maintainerPromotedCandidates),
      note: "Candidate promotions preserve maintainer provenance and remain separate from outside public submissions.",
    },
    {
      label: "AI-origin records",
      value: String(contributionCounts.aiOrigin),
      note: "AI-origin records are labeled separately and do not imply external participation.",
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
            <Link href="/">Main chat</Link>
            <Link href="/press">Press</Link>
            <Link href="/demo">Demo</Link>
            <Link href="/ledger">Ledger</Link>
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
              <Link className={styles.secondaryAction} href="/">
                Open main chat
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
          <Link className={styles.secondaryAction} href="/">
            Open main chat
          </Link>
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

        <section className={styles.proofSection}>
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>Current status</span>
            <h2>The first public-record revision is complete. The first outside contribution is next.</h2>
          </div>
          <div className={styles.statusGrid}>
            {currentStatusItems.map((item) => (
              <article className={styles.proofCard} key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <p>{item.note}</p>
              </article>
            ))}
          </div>
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
            <span className={styles.eyebrow}>First contribution runway</span>
            <h2>What makes a good first contribution?</h2>
            <p>
              The first outside submission does not need to solve healthcare. It
              needs to make one part of the card more accurate, complete, or honest.
            </p>
          </div>
          <div className={styles.exampleGrid}>
            {firstContributionExamples.map((item) => (
              <article className={styles.exampleCard} key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <p>{item.why}</p>
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

        <section className={styles.exampleSection}>
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>Guided prompts</span>
            <h2>If you are not sure where to start, answer one of these.</h2>
          </div>
          <div className={styles.promptGrid}>
            {guidedContributionPrompts.map((item) => (
              <article className={styles.exampleCard} key={item.prompt}>
                <h3>{item.prompt}</h3>
                <p>{item.detail}</p>
                <Link
                  className={styles.exampleAction}
                  href={contributionHref(item.lane, inboundReferralSource)}
                >
                  Start this contribution
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
