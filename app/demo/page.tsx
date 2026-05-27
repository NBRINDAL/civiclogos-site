import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteBrand } from "../components/site-brand";
import {
  getRoomTopicCard,
  getRoomTopicHref,
  issueRoomQuestion,
} from "../lib/civic-logos";
import { topicCardVisibleContributionLimit } from "../lib/contribution-constants";
import {
  getContributionStoreMetadata,
  listPublicContributions,
} from "../lib/contribution-store";
import {
  getActualCardChangeLabel,
  getPotentialCardImpactLabel,
  isActualCardChange,
} from "../lib/contribution-impact";
import {
  getContributionOrigin,
  getContributionOriginLabel as getContributionOriginValueLabel,
} from "../lib/contribution-origin";
import type { PublicContribution } from "../lib/contribution-types";
import { debateLaneLabels } from "../lib/reasoning-types";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getContributionOriginDisplayLabel(contribution: PublicContribution) {
  return getContributionOriginValueLabel(getContributionOrigin(contribution));
}

function getStatusLabel(status: PublicContribution["status"]) {
  return status === "needs review"
    ? "Needs review"
    : status[0].toUpperCase() + status.slice(1);
}

function getContributionAttachmentKind(contribution: PublicContribution) {
  const kind =
    contribution.review?.assignedToKind ?? contribution.aiIntake?.suggestedAssignmentKind;

  if (!kind || kind === "unclear") {
    return "none-yet";
  }

  return kind;
}

function getContributionReviewStatus(contribution: PublicContribution) {
  return contribution.status === "needs review" ? "needs-review" : contribution.status;
}

function getContributionRecordView(contribution: PublicContribution) {
  if (contribution.draftSource) {
    return "ai-assisted";
  }

  if (isActualCardChange(contribution)) {
    return "changed-card";
  }

  if (contribution.evidenceDocument) {
    return "document-backed";
  }

  if (contribution.status === "pending" || contribution.status === "needs review") {
    return "needs-review";
  }

  return undefined;
}

function getExactContributionHref(
  topicHref: string,
  contribution: PublicContribution,
) {
  const params = new URLSearchParams({
    view: "ledger",
    reviewStatus: getContributionReviewStatus(contribution),
    attachment: getContributionAttachmentKind(contribution),
    origin: getContributionOrigin(contribution),
    lane: contribution.lane,
  });
  const recordView = getContributionRecordView(contribution);

  if (recordView) {
    params.set("recordView", recordView);
  }

  return `${topicHref}?${params.toString()}#contribution-${contribution.id}`;
}

function getAttachmentLabel(contribution: PublicContribution) {
  const kind = getContributionAttachmentKind(contribution);
  const label =
    contribution.review?.assignedToLabel ?? contribution.aiIntake?.suggestedAssignmentLabel;

  if (kind === "none-yet") {
    return "None yet";
  }

  const readableKind = kind === "claim" ? "synthesis" : kind.replaceAll("-", " ");
  return label ? `${readableKind}: ${label}` : readableKind;
}

function getContributionSummary(contribution: PublicContribution) {
  return (
    contribution.review?.publicRecordNote ??
    contribution.review?.decisionReason ??
    contribution.aiIntake?.reviewerNote ??
    contribution.aiIntake?.summary ??
    contribution.body
  );
}

function getProviderLabels(contribution: PublicContribution | null) {
  const providers =
    contribution?.aiIntake?.providers
      .filter((provider) => provider.state === "completed")
      .map((provider) => (provider.provider === "anthropic" ? "Claude" : "GPT")) ?? [];

  return Array.from(new Set(providers));
}

export default async function DemoPage() {
  const healthcareCard = getRoomTopicCard("healthcare", "topic-001");

  if (!healthcareCard) {
    notFound();
  }

  const topicHref = getRoomTopicHref("healthcare", "topic-001");
  const [metadata, contributions] = await Promise.all([
    getContributionStoreMetadata(),
    listPublicContributions({
      roomSlug: "healthcare",
      topicId: "topic-001",
      limit: topicCardVisibleContributionLimit,
    }),
  ]);
  const demoContribution =
    contributions.find((item) => isActualCardChange(item)) ??
    contributions.find((item) => item.review?.reviewedAt) ??
    contributions[0] ??
    null;
  const pendingContribution = contributions.find(
    (item) => item.status === "pending" || item.status === "needs review",
  );
  const latestRevision =
    healthcareCard.revisionHistory[healthcareCard.revisionHistory.length - 1];
  const providerLabels = getProviderLabels(demoContribution);
  const v2CandidateOutput = [
    "economic-assumption-challenge",
    "healthcare/topic-001",
    "Savings-capture assumption",
    "unsourced but coherent",
    "patients/providers/insurers/employers",
    "pending human review",
    "actual card change: false",
  ];

  const demoSteps = [
    {
      label: "01",
      title: "Original question",
      body: issueRoomQuestion,
      detail:
        "The walkthrough begins with a broad healthcare question that is too large for one post and needs a durable room.",
    },
    {
      label: "02",
      title: "Room routing",
      body:
        "The question is routed into the Healthcare Reform room, then narrowed into an existing topic instead of creating a new room.",
      detail: "Route result: Healthcare Reform -> Administrative Simplification and AI-Assisted Triage.",
    },
    {
      label: "03",
      title: "Topic card creation",
      body: healthcareCard.thesis,
      detail:
        "The card gives the idea a stable object: thesis, risks, evidence pressure, assumptions, scorecard, and revision history.",
    },
    {
      label: "04",
      title: "Contribution submitted",
      body: demoContribution
        ? demoContribution.title
        : "No contribution is visible yet, so this step waits for the first public record.",
      detail: demoContribution
        ? `${getContributionOriginDisplayLabel(demoContribution)} - ${debateLaneLabels[demoContribution.lane]} - recorded ${formatTimestamp(demoContribution.createdAt)}.`
        : "A real submission will enter the public review record once it exists.",
    },
    {
      label: "05",
      title: "GPT/Claude assisted sorting",
      body: demoContribution?.aiIntake?.summary ?? "AI-assisted sorting is available when a contribution enters the record.",
      detail: providerLabels.length
        ? `${providerLabels.join(" and ")} proposed lane fit, attachment, and likely synthesis impact. Human review still decides placement.`
        : "Assisted readers can structure a record, but they are not final judges.",
    },
    {
      label: "06",
      title: "Human review decision",
      body: demoContribution?.review?.publicRecordNote ?? demoContribution?.review?.decisionReason ?? "Pending human review.",
      detail: demoContribution
        ? `Current status: ${getStatusLabel(
            demoContribution.status,
          )}. Potential impact: ${getPotentialCardImpactLabel(
            demoContribution.aiIntake?.changedSynthesisLikely,
          )}. Actual card change: ${getActualCardChangeLabel(demoContribution)}.`
        : "No review decision exists until a contribution is submitted.",
    },
    {
      label: "07",
      title: "Public record attachment",
      body: demoContribution
        ? getAttachmentLabel(demoContribution)
        : "No attachment target yet.",
      detail:
        "Attachments keep the contribution connected to evidence, assumptions, objections, open questions, or synthesis rather than leaving it in a feed.",
    },
    {
      label: "08",
      title: "Revision trace",
      body: latestRevision ? `${latestRevision.version}: ${latestRevision.note}` : "No visible revisions yet.",
      detail:
        "The card should show what changed, why it changed, and which record created the pressure.",
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.headerBar}>
          <SiteBrand className={styles.brand} href="/" subtitle="Guided demo" />

          <nav className={styles.nav}>
            <Link href="/">Main chat</Link>
            <Link href="/healthcare">Healthcare room</Link>
            <Link href="/press">Press</Link>
            <Link href="/ledger">Ledger</Link>
            <Link href="/institutions">Institutions</Link>
          </nav>
        </div>

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Prototype demo data</span>
            <h1>Watch one idea move through Civic Logos</h1>
            <p>
              This walkthrough uses the healthcare card to show the platform
              loop: route a question, create a topic card, record a contribution,
              sort it with GPT/Claude assisted readers, apply human review, attach
              the record, and keep the revision trace visible.
            </p>
            <p className={styles.prototypeNote}>
              This is prototype data, not fake public usage. It is labeled this
              way so the mechanism can be inspected without pretending outside
              adoption has happened yet. Contribution store mode:{" "}
              <strong>{metadata.mode}</strong>.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryAction} href="/">
                Open main chat
              </Link>
              <Link className={styles.secondaryAction} href={topicHref}>
                Open the healthcare card
              </Link>
            </div>
          </div>

          <aside className={styles.heroPanel}>
            <span className={styles.panelLabel}>Proof object</span>
            <h2>{healthcareCard.title}</h2>
            <p>{healthcareCard.currentRead}</p>
            <div className={styles.heroMeta}>
              <div>
                <span>Visible records</span>
                <strong>{contributions.length}</strong>
              </div>
              <div>
                <span>Pending review</span>
                <strong>{pendingContribution ? "Visible" : "None visible"}</strong>
              </div>
              <div>
                <span>Revision trace</span>
                <strong>{healthcareCard.revisionHistory.length} updates</strong>
              </div>
            </div>
          </aside>
        </section>
      </header>

      <main className={styles.main}>
        <section className={styles.recordsSection}>
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>V2 demo note</span>
            <h2>Chat-first candidate intake is live on the healthcare card.</h2>
            <p>
              The new `/ask` path is a pre-ledger intake. It structures a candidate
              first, then waits for human promotion before anything can become a
              public contribution.
            </p>
          </div>

          <div className={styles.recordGrid}>
            <article className={styles.recordCard}>
              <span className={styles.recordLabel}>Healthcare example</span>
              <h3>Natural-language intake</h3>
              <p className={styles.demoQuote}>
                “This healthcare claim assumes savings will reach patients, but
                institutions may capture them.”
              </p>
              <p className={styles.demoAuditNote}>
                /ask does not change public counts, does not create RevisionEvents,
                and does not change synthesis.
              </p>
            </article>

            <article className={styles.recordCard}>
              <span className={styles.recordLabel}>Structured output</span>
              <h3>Candidate returned for human review</h3>
              <ul className={styles.demoList}>
                {v2CandidateOutput.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className={styles.timelineSection}>
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>Guided path</span>
            <h2>One idea, eight inspectable steps.</h2>
            <p>
              The demo stays deliberately narrow: no popularity mechanics, no
              paid ranking, and no AI as final judge. The work is visible because
              the record is visible.
            </p>
          </div>

          <ol className={styles.timeline}>
            {demoSteps.map((step) => (
              <li className={styles.timelineItem} key={step.title}>
                <span className={styles.stepNumber}>{step.label}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                  <span>{step.detail}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.recordsSection}>
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>Visible records</span>
            <h2>The demo points back to the same ledger used by the topic card.</h2>
          </div>

          <div className={styles.recordGrid}>
            {contributions.slice(0, 3).map((item) => (
              <article className={styles.recordCard} key={item.id}>
                <span className={styles.recordLabel}>{getContributionOriginDisplayLabel(item)}</span>
                <h3>{item.title}</h3>
                <p>{getContributionSummary(item)}</p>
                <dl>
                  <div>
                    <dt>Lane</dt>
                    <dd>{debateLaneLabels[item.lane]}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{getStatusLabel(item.status)}</dd>
                  </div>
                  <div>
                    <dt>Attachment</dt>
                    <dd>{getAttachmentLabel(item)}</dd>
                  </div>
                </dl>
                <Link
                  className={styles.inlineLink}
                  href={getExactContributionHref(topicHref, item)}
                >
                  Open synced ledger slice
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.ctaBand}>
          <div>
            <span className={styles.eyebrow}>First outside contribution</span>
            <h2>Help pressure-test the first card.</h2>
            <p>
              A strong objection, evidence source, or correction can become the
              first real public contribution that improves this card. Pick a
              lane to open the healthcare ledger with an editable starter draft
              already loaded.
            </p>
            <div className={styles.ctaPromptGrid}>
              <Link
                className={styles.ctaPrompt}
                href="/healthcare/topic-001?view=ledger&contributeLane=objection&contributeFrom=demo#debate"
              >
                Start with an objection draft
              </Link>
              <Link
                className={styles.ctaPrompt}
                href="/healthcare/topic-001?view=ledger&contributeLane=evidence&contributeFrom=demo#debate"
              >
                Start with an evidence draft
              </Link>
              <Link
                className={styles.ctaPrompt}
                href="/healthcare/topic-001?view=ledger&contributeLane=correction&contributeFrom=demo#debate"
              >
                Start with a correction draft
              </Link>
            </div>
          </div>
          <div className={styles.ctaActions}>
            <Link
              className={styles.primaryAction}
              href="/healthcare/topic-001?view=ledger&contributeLane=objection&contributeFrom=demo#debate"
            >
              Contribute to the healthcare card
            </Link>
            <Link className={styles.secondaryAction} href="/institutions">
              Request an institutional review pilot
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
