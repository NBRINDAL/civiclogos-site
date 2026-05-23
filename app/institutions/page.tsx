import Link from "next/link";
import { notFound } from "next/navigation";
import { InstitutionalInquiryForm } from "../components/institutional-inquiry-form";
import { SiteBrand } from "../components/site-brand";
import { buildInstitutionalInquiryContext } from "../lib/institutional-inquiry-context";
import {
  getRoomTopicCard,
  getRoomTopicHref,
} from "../lib/civic-logos";
import { topicCardVisibleContributionLimit } from "../lib/contribution-constants";
import { getContributionStoreMetadata, listPublicContributions } from "../lib/contribution-store";
import type { PublicContribution } from "../lib/contribution-types";
import { debateLaneLabels } from "../lib/reasoning-types";
import styles from "./page.module.css";

const revenueOffers = [
  {
    title: "Civic Issue Diagnostic",
    price: "$1,500–$3,500",
    body:
      "A short structured read on a hard issue: what the live question is, where the disagreement sits, what evidence is missing, and whether the issue is a good fit for a room.",
    bullets: [
      "Best for early-stage scoping",
      "Clarifies whether the issue belongs in a public or private room",
      "Produces a crisp next-step recommendation instead of generic consulting notes",
    ],
  },
  {
    title: "Issue Room Pilot",
    price: "$10,000–$25,000",
    body:
      "A bounded pilot room for one hard public or institutional question, with visible claims, objections, evidence, assumptions, AI-assisted review, human synthesis, and revision history.",
    bullets: [
      "Best for a live issue that needs public or cross-stakeholder structure",
      "Funds review capacity, evidence work, and synthesis labor",
      "Creates a pilot object that can be inspected rather than merely asserted",
    ],
  },
  {
    title: "Ongoing Room Stewardship",
    price: "$2,000–$8,000/month",
    body:
      "Continued room maintenance for issues that need durable review, recurring synthesis, visible correction, and repeated challenge over time.",
    bullets: [
      "Best for issues that stay live across quarters or years",
      "Keeps objections, updates, and revision memory visible",
      "Supports ongoing review labor without turning the room into paid legitimacy",
    ],
  },
] as const;

const revenueFirewallItems = [
  {
    title: "Sponsors fund review capacity, not authority.",
    body: "The money pays for examination, evidence work, human review time, and synthesis labor. It does not control the conclusion.",
  },
  {
    title: "Funder identity and constraints must be disclosed.",
    body: "If an institution is paying for a room, that relationship and any relevant process constraints need to be visible to readers.",
  },
  {
    title: "Objections remain visible.",
    body: "Structured disagreement is part of the object. Paying for the room does not buy the removal of the hardest critique.",
  },
  {
    title: "Reviewer notes and revision history remain inspectable.",
    body: "The public needs to see how the object changed, what moved it, and where review judgment entered.",
  },
  {
    title: "Civic Logos does not sell legitimacy, favorable scoring, or quiet review outcomes.",
    body: "The monetization architecture is money for scrutiny, not money for credibility laundering.",
  },
] as const;

function getContributionOrigin(contribution: PublicContribution) {
  if (contribution.isSeedExample) {
    return "seed-example" as const;
  }

  if (contribution.draftSource) {
    return "ai-origin" as const;
  }

  return "human-submitted" as const;
}

function getContributionOriginLabel(contribution: PublicContribution) {
  const origin = getContributionOrigin(contribution);

  if (origin === "ai-origin") {
    return "AI-origin";
  }

  if (origin === "human-submitted") {
    return "Public submission";
  }

  return "Prototype example";
}

function getContributionStatusLabel(status: PublicContribution["status"]) {
  return status === "needs review"
    ? "Needs review"
    : status[0].toUpperCase() + status.slice(1);
}

function getContributionAttachmentKind(contribution: PublicContribution) {
  const kind =
    contribution.review?.assignedToKind ?? contribution.aiIntake?.suggestedAssignmentKind;

  if (!kind || kind === "unclear") {
    return "none-yet" as const;
  }

  return kind;
}

function getContributionAttachmentLabel(contribution: PublicContribution) {
  const kind = getContributionAttachmentKind(contribution);

  switch (kind) {
    case "claim":
      return "Synthesis";
    case "objection":
      return "Objection";
    case "evidence":
      return "Evidence";
    case "assumption":
      return "Assumption";
    case "open-question":
      return "Open question";
    case "none-yet":
    default:
      return "None yet";
  }
}

function getContributionAttachmentSummary(contribution: PublicContribution) {
  const label =
    contribution.review?.assignedToLabel ?? contribution.aiIntake?.suggestedAssignmentLabel;

  if (!label) {
    return getContributionAttachmentLabel(contribution);
  }

  return `${getContributionAttachmentLabel(contribution)} - ${label}`;
}

function getContributionRecordView(contribution: PublicContribution) {
  if (contribution.draftSource) {
    return "ai-assisted";
  }

  if (contribution.review?.changedSynthesis === true) {
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

function getContributionReviewStatus(contribution: PublicContribution) {
  return contribution.status === "needs review" ? "needs-review" : contribution.status;
}

function getProviderLabel(provider: "openai" | "anthropic") {
  return provider === "anthropic" ? "Claude" : "OpenAI";
}

function getExactContributionHref(contribution: PublicContribution) {
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

  return `${getRoomTopicHref("healthcare", contribution.topicId)}?${params.toString()}#contribution-${contribution.id}`;
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

export default async function InstitutionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const inquiryContext = buildInstitutionalInquiryContext(resolvedSearchParams);
  const healthcareCard = getRoomTopicCard("healthcare", "topic-001");
  const trustCard = getRoomTopicCard("institutional-trust", "topic-001");

  if (!healthcareCard || !trustCard) {
    notFound();
  }

  const [contributionStoreMetadata, healthcareContributions] = await Promise.all([
    getContributionStoreMetadata(),
    listPublicContributions({
      roomSlug: "healthcare",
      topicId: "topic-001",
      limit: topicCardVisibleContributionLimit,
    }),
  ]);

  const visibleContributionExamples = healthcareContributions.slice(0, 5);
  const pendingReviewExamples = healthcareContributions.filter(
    (item) => item.status === "pending" || item.status === "needs review",
  );
  const changedCardExamples = healthcareContributions.filter(
    (item) => item.review?.changedSynthesis === true,
  );
  const publicSubmissionExamples = healthcareContributions.filter(
    (item) => !item.isSeedExample && !item.draftSource,
  );
  const prototypeExamples = healthcareContributions.filter(
    (item) => item.isSeedExample,
  );
  const humanReviewExamples = healthcareContributions.filter(
    (item) => Boolean(item.review?.reviewedAt),
  );
  const evidenceAttachmentExample = healthcareContributions.find(
    (item) => item.review?.assignedToKind === "evidence",
  );
  const openQuestionAttachmentExample = healthcareContributions.find(
    (item) => item.review?.assignedToKind === "open-question",
  );
  const aiProviderLabels = Array.from(
    new Set(
      healthcareContributions.flatMap((item) =>
        item.aiIntake?.providers.map((provider) => getProviderLabel(provider.provider)) ?? [],
      ),
    ),
  );

  return (
    <div className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true" />

      <header className={styles.header}>
        <nav className={styles.nav}>
          <SiteBrand href="/" subtitle="Institutional pilots" />
          <div className={styles.navLinks}>
            <Link href="/">Home</Link>
            <Link href="/demo">Demo</Link>
            <a href="#offers">Offers</a>
            <a href="#model">Public Review Stake</a>
            <a href="#example">Healthcare example</a>
            <a href="#inquiry">Request pilot</a>
          </div>
        </nav>

        <div className={styles.hero}>
          <article className={styles.heroCard}>
            <span className={styles.eyebrow}>For Institutions</span>
            <h1>For Institutions</h1>
            <p className={styles.heroLead}>
              Civic Logos helps institutions structure hard public questions into
              living issue rooms with claims, objections, evidence, assumptions,
              AI-assisted review, human synthesis, and visible revision history.
            </p>
            <p className={styles.heroSupport}>
              The product being sold is not favorable treatment. It is a durable
              review object that can absorb challenge, surface real disagreement,
              and keep institutional claims inspectable over time.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.primaryAction} href="#inquiry">
                Request an institutional review pilot
              </a>
              <a className={styles.secondaryAction} href="#example">
                See the healthcare pilot example
              </a>
            </div>
          </article>

          <aside className={styles.heroPanel}>
            <span className={styles.eyebrow}>What this sells</span>
            <h2>Money funds scrutiny, not legitimacy.</h2>
            <p>
              Civic Logos is building a monetization architecture around the
              <strong> Public Review Stake </strong>
              model: institutions fund the review capacity required to examine a
              live issue room, while objections, reviewer notes, and revision
              history remain visible.
            </p>
            <ul className={styles.heroPanelList}>
              <li>AI can help structure and sort the record, but it does not act as the final judge.</li>
              <li>Human review remains visible wherever synthesis, attachment, or score pressure changes.</li>
              <li>The output is an inspectable room, not a prestige badge or paid ranking.</li>
            </ul>
          </aside>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.section} id="offers">
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>Offers</span>
            <h2>Three ways to start without pretending the platform is further along than it is.</h2>
            <p>
              Civic Logos is inquiry-first right now. The job is to turn a hard
              issue into a structured room before adding checkout or scale
              mechanics.
            </p>
          </div>

          <div className={styles.threeUp}>
            {revenueOffers.map((offer) => (
              <article className={styles.offerCard} key={offer.title}>
                <h3>{offer.title}</h3>
                <p>{offer.body}</p>
                <p className={styles.offerPrice}>{offer.price}</p>
                <ul>
                  {offer.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <div className={styles.miniActions}>
                  <a className={styles.inlineLink} href="#inquiry">
                    Request an institutional review pilot
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} id="model">
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>Public Review Stake</span>
            <h2>The Public Review Stake model is the monetization architecture.</h2>
            <p>
              The core idea is simple: money should fund examination, not
              legitimacy. The trust-model card already frames that mechanism as a
              live object rather than a manifesto sentence.
            </p>
          </div>

          <div className={styles.twoUp}>
            <article className={styles.sectionCard}>
              <h3>{trustCard.title}</h3>
              <p>{trustCard.currentRead}</p>
              <ul className={styles.bulletList}>
                <li>Sponsors fund review capacity, not authority.</li>
                <li>Visible objections stay attached to the claim.</li>
                <li>Human reviewer notes and revision history stay inspectable.</li>
                <li>Readers can see where the process could still fail or be captured.</li>
              </ul>
              <div className={styles.miniActions}>
                <Link
                  className={styles.inlineLink}
                  href={getRoomTopicHref("institutional-trust", "topic-001")}
                >
                  Open the Public Review Stake card
                </Link>
              </div>
            </article>

            <article className={styles.sectionCard}>
              <h3>What an institution is paying for</h3>
              <p>
                A room can hold the live question, visible claims, objections,
                evidence, assumptions, unresolved pressure, AI sorting, and human
                synthesis in one revisable object. The payer funds the work
                required to keep that object legible.
              </p>
              <ul className={styles.bulletList}>
                <li>Structured issue framing instead of generalized consulting prose.</li>
                <li>Visible contribution records instead of uninspectable private notes.</li>
                <li>Human synthesis under challenge instead of AI as the final judge.</li>
                <li>Revision memory instead of a clean-looking final PDF.</li>
              </ul>
            </article>
          </div>
        </section>

        <section className={styles.sampleSection} id="example">
          <div className={styles.sampleHeader}>
            <span className={styles.eyebrow}>Example pilot</span>
            <h2>Administrative Simplification and AI-Assisted Triage</h2>
            <p>
              This is the strongest proof-of-product object on the site right now:
              a healthcare topic card where synthesis, contributions, AI sorting,
              human review, attachments, and revision trace are all visible in one
              place.
            </p>
            <p className={styles.sampleNote}>
              This is prototype data, not fake public usage. The goal is to show
              the review object honestly while the public record is still early.
              Current contribution mode: <strong>{contributionStoreMetadata.mode}</strong>.
            </p>
          </div>

          <div className={styles.proofGrid}>
            <article className={styles.proofCard}>
              <span className={styles.proofLabel}>Current synthesis</span>
              <p className={styles.proofValue}>{healthcareCard.thesis}</p>
              <div className={styles.proofLinkList}>
                <Link
                  className={styles.inlineLink}
                  href={`${getRoomTopicHref("healthcare", "topic-001")}#institutional-pilot`}
                >
                  Open pilot-ready healthcare card
                </Link>
                <Link
                  className={styles.inlineLink}
                  href={`${getRoomTopicHref("healthcare", "topic-001")}?view=ledger#contribution-record`}
                >
                  Open ledger view
                </Link>
              </div>
            </article>

            <article className={styles.proofCard}>
              <span className={styles.proofLabel}>Visible sample counts</span>
              <div className={styles.proofMeta}>
                <strong>{visibleContributionExamples.length} visible records</strong>
                <strong>{pendingReviewExamples.length} pending review</strong>
                <strong>{changedCardExamples.length} changed-card records</strong>
                <strong>{publicSubmissionExamples.length} outside public submissions</strong>
                <strong>{prototypeExamples.length} prototype examples</strong>
              </div>
              <p>
                The sample below uses the current visible healthcare record instead
                of a fabricated showcase dataset.
              </p>
              <p className={styles.proofDisclosure}>
                {publicSubmissionExamples.length
                  ? "Outside public submissions are now visible in this pilot snapshot."
                  : "No outside public submission has been reviewed into this snapshot yet; the visible records are still prototype-led and labeled that way."}
              </p>
            </article>

            <article className={styles.proofCard}>
              <span className={styles.proofLabel}>Five visible contribution examples</span>
              <div className={styles.proofList}>
                {visibleContributionExamples.map((item) => (
                  <div key={item.id}>
                    <p>
                      <strong>
                        <Link className={styles.inlineLink} href={getExactContributionHref(item)}>
                          {item.title}
                        </Link>
                      </strong>
                    </p>
                    <p>{getContributionSummary(item)}</p>
                    <p className={styles.proofMeta}>
                      <span>{debateLaneLabels[item.lane]}</span>
                      <span>{getContributionStatusLabel(item.status)}</span>
                      <span>{getContributionOriginLabel(item)}</span>
                      <span>{getContributionAttachmentSummary(item)}</span>
                    </p>
                  </div>
                ))}
              </div>
            </article>

            <article className={styles.proofCard}>
              <span className={styles.proofLabel}>Pending review items</span>
              <div className={styles.proofList}>
                {pendingReviewExamples.slice(0, 2).map((item) => (
                  <div key={item.id}>
                    <p>
                      <strong>
                        <Link className={styles.inlineLink} href={getExactContributionHref(item)}>
                          {item.title}
                        </Link>
                      </strong>
                    </p>
                    <p>{getContributionSummary(item)}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className={styles.proofCard}>
              <span className={styles.proofLabel}>Card-changing records</span>
              <div className={styles.proofList}>
                {changedCardExamples.slice(0, 2).map((item) => (
                  <div key={item.id}>
                    <p>
                      <strong>
                        <Link className={styles.inlineLink} href={getExactContributionHref(item)}>
                          {item.title}
                        </Link>
                      </strong>
                    </p>
                    <p>{getContributionSummary(item)}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className={styles.proofCard}>
              <span className={styles.proofLabel}>AI-assisted sorting</span>
              <p>
                Each visible contribution currently carries AI-assisted routing
                reads before human review. The active prototype uses{" "}
                <strong>{aiProviderLabels.join(" and ") || "AI readers"}</strong>
                {" "}to propose lanes, attachments, and whether a contribution is
                likely to change the card.
              </p>
            </article>

            <article className={styles.proofCard}>
              <span className={styles.proofLabel}>Human review notes</span>
              <div className={styles.proofList}>
                {humanReviewExamples.slice(0, 2).map((item) => (
                  <div key={item.id}>
                    <p>
                      <strong>{item.title}</strong>
                    </p>
                    <p>
                      {item.review?.publicRecordNote ??
                        item.review?.decisionReason ??
                        "Human review is visible on this record."}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            <article className={styles.proofCard}>
              <span className={styles.proofLabel}>Evidence and open-question attachment</span>
              <div className={styles.proofList}>
                {evidenceAttachmentExample ? (
                  <div>
                    <p>
                      <strong>Evidence attachment</strong>
                    </p>
                    <p>
                      {evidenceAttachmentExample.title} attaches to{" "}
                      {getContributionAttachmentSummary(evidenceAttachmentExample)}.
                    </p>
                  </div>
                ) : null}
                {openQuestionAttachmentExample ? (
                  <div>
                    <p>
                      <strong>Open-question attachment</strong>
                    </p>
                    <p>
                      {openQuestionAttachmentExample.title} attaches to{" "}
                      {getContributionAttachmentSummary(openQuestionAttachmentExample)}.
                    </p>
                  </div>
                ) : null}
              </div>
            </article>

            <article className={styles.proofCard}>
              <span className={styles.proofLabel}>Revision trace</span>
              <ul className={styles.traceList}>
                {healthcareCard.revisionHistory.map((item) => (
                  <li key={item.version}>
                    <strong>{item.version}</strong>: {item.note}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className={styles.inquirySection}>
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>Inquiry-first sales</span>
            <h2>Request an institutional review pilot</h2>
            <p>
              No Stripe checkout yet. The right first step is a scoped inquiry
              that makes the issue, room preference, budget band, and success
              criteria explicit.
            </p>
          </div>

          <div className={styles.inquiryGrid}>
            <div className={styles.snapshotWrap}>
              {inquiryContext.showSnapshot ? (
                <article className={styles.snapshotCard}>
                  <div>
                    <span className={styles.proofLabel}>Institutional pilot snapshot</span>
                    <h3>{inquiryContext.title}</h3>
                  </div>
                  {inquiryContext.note ? (
                    <p className={styles.snapshotNote}>{inquiryContext.note}</p>
                  ) : null}
                  {inquiryContext.facts.length ? (
                    <dl className={styles.snapshotGrid}>
                      {inquiryContext.facts.map((item) => (
                        <div className={styles.snapshotFact} key={`${item.label}-${item.value}`}>
                          <dt>{item.label}</dt>
                          <dd>{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                  {inquiryContext.relationshipNote ? (
                    <p className={styles.snapshotNote}>{inquiryContext.relationshipNote}</p>
                  ) : null}
                  {inquiryContext.groundingLinks.length ? (
                    <div className={styles.snapshotSection}>
                      <span className={styles.snapshotSectionTitle}>Grounding links</span>
                      <div className={styles.snapshotLinks}>
                        {inquiryContext.groundingLinks.slice(0, 8).map((item) => (
                          <Link className={styles.inlineLink} href={item.href} key={item.href}>
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {inquiryContext.returnLinks.length ? (
                    <div className={styles.snapshotSection}>
                      <span className={styles.snapshotSectionTitle}>Return paths</span>
                      <div className={styles.snapshotLinks}>
                        {inquiryContext.returnLinks.slice(0, 6).map((item) => (
                          <Link className={styles.inlineLink} href={item.href} key={item.href}>
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </article>
              ) : (
                <article className={styles.snapshotCard}>
                  <div>
                    <span className={styles.proofLabel}>How this starts</span>
                    <h3>Start with a scoped issue, not a blank consulting ask.</h3>
                  </div>
                  <p className={styles.snapshotNote}>
                    Civic Logos will review whether the issue is a good fit for a
                    structured room, whether it should be public or private, and
                    whether a diagnostic or pilot is the better first step.
                  </p>
                  <div className={styles.snapshotSection}>
                    <span className={styles.snapshotSectionTitle}>Good first fits</span>
                    <ul className={styles.bulletList}>
                      <li>Questions with visible disagreement, evidence pressure, and revision risk.</li>
                      <li>Institutional claims that need durable scrutiny instead of one-cycle messaging.</li>
                      <li>Issues where AI can help sort the record but human review must remain visible.</li>
                    </ul>
                  </div>
                </article>
              )}

              <article className={styles.firewallCard}>
                <span className={styles.eyebrow}>Revenue firewall</span>
                <h2>What paying does not buy</h2>
                <div className={styles.firewallList}>
                  {revenueFirewallItems.map((item) => (
                    <div className={styles.firewallItem} key={item.title}>
                      <strong>{item.title}</strong>
                      <span>{item.body}</span>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <InstitutionalInquiryForm
              contextSummary={inquiryContext.summary}
              initialIssueQuestion={inquiryContext.initialIssueQuestion}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
