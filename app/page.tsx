import Link from "next/link";
import { ContactForm } from "./components/contact-form";
import HomeIntake from "./components/home-intake";
import { SiteBrand } from "./components/site-brand";
import { getLiveCardIndex, issueRoomQuestion, roomDirectory } from "./lib/civic-logos";
import styles from "./page.module.css";

const distinctions = [
  {
    title: "Ideas, not posts",
    body: "Posts disappear into feeds. Ideas should absorb critique, evolve over time, and become part of a usable public record.",
  },
  {
    title: "Perspective and synthesis",
    body: "People and institutions can own perspectives. The platform keeps a living map of what is agreed, contested, and unresolved.",
  },
  {
    title: "Visibility is not authority",
    body: "Attention alone should not decide what matters. Ideas earn standing by surviving structured public examination.",
  },
  {
    title: "AI as structurer, not oracle",
    body: "AI helps compare, critique, summarize, and clarify. It does not get to declare truth for everyone else.",
  },
  {
    title: "Examination over influence",
    body: "Money can fund review capacity, evidence work, and clearer synthesis. It should never buy legitimacy or favorable scoring.",
  },
];

const priorArtComparisons = [
  {
    title: "Wikipedia",
    body: "Wikipedia is built to summarize relatively settled knowledge under neutrality norms. Civic Logos is built for unresolved public questions, where perspectives stay attributable and synthesis stays visibly revisable.",
  },
  {
    title: "Reddit and feeds",
    body: "Feeds are strong at reaction and discovery, but weak at memory. Civic Logos is trying to keep the object stable enough that objections, evidence, and revisions accumulate instead of vanishing into chronology.",
  },
  {
    title: "Kialo and argument maps",
    body: "Argument maps clarify pro and con structure, but Civic Logos wants a wider room object: stakeholder interests, economic delta, institutional incentives, public perspectives, and a living synthesis in one place.",
  },
  {
    title: "Polis and public comment tools",
    body: "Polis is good at showing opinion clusters. Civic Logos is trying to go further by keeping durable topic cards, room-level synthesis, and evidence-bearing disagreement visible over time.",
  },
] as const;

const contributorLoop = [
  {
    title: "Contributions stay visible",
    body: "A strong objection should not disappear into a thread. The room should preserve what changed the synthesis and make later readers able to find it.",
  },
  {
    title: "Expertise becomes legible",
    body: "People return when the platform makes their judgment visible in a domain-specific way rather than flattening everyone into one generic social score.",
  },
  {
    title: "The room can actually move",
    body: "The reward is not just posting. It is seeing a claim sharpened, a blind spot exposed, or the synthesis change because your contribution survived review.",
  },
  {
    title: "Status comes from quality, not volume",
    body: "Civic Logos should eventually reward the people who clarify, steelman, correct, and improve the record, not the people who simply generate the most noise.",
  },
] as const;

const manifestoPoints = [
  "Public discourse is trapped inside posts, feeds, outrage loops, and fragmented commentary.",
  "Important ideas are buried, duplicated, distorted, or forgotten before they become public memory.",
  "The internet and AI now make a better civic reasoning layer possible.",
  "Civic Logos treats ideas as living objects with objections, evidence, revisions, and scorecards.",
  "The platform begins narrowly: a seed library, a healthcare issue room, and a visible first prototype.",
];

const releaseItems = [
  'Homepage, manifesto, and a clear public explanation of "ideas, not posts."',
  "Healthcare as the first fully developed issue room, with governance, housing, AI/labor, and institutional trust now seeded behind it.",
  "Structured idea cards built around thesis, mechanism, benefits, risks, assumptions, and economic delta.",
  "A simple early-access path for supporters, advisors, testers, and domain experts.",
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    interest?: string | string[];
    sourceTopic?: string | string[];
    sourceRoom?: string | string[];
    sourceTopicHref?: string | string[];
    sourceLiveRecord?: string | string[];
    sourcePendingReview?: string | string[];
    sourceChangedCard?: string | string[];
    sourceAiOrigin?: string | string[];
    sourceDocumentBacked?: string | string[];
    sourceRecordMode?: string | string[];
    sourceScoreLabel?: string | string[];
    sourceScoreValue?: string | string[];
    sourceScoreSlice?: string | string[];
    sourceScoreOpenPressure?: string | string[];
    sourceExactRecordTitle?: string | string[];
    sourceExactRecordState?: string | string[];
    sourceExactRecordPilotGrounding?: string | string[];
    sourceExactRecordOrigin?: string | string[];
    sourceExactRecordSlice?: string | string[];
    sourceExactRecordTarget?: string | string[];
    sourceExactRecordRead?: string | string[];
    sourceExactRecordAiSource?: string | string[];
    sourceExactRecordHref?: string | string[];
    sourceExactRecordSourceTurnHref?: string | string[];
    sourceExactRecordSummaryLabel?: string | string[];
    sourceExactRecordSummaryHref?: string | string[];
    sourceIntakeArtifactTitle?: string | string[];
    sourceIntakePromptCount?: string | string[];
    sourceIntakeHeldQuestionCount?: string | string[];
    sourceIntakeRelationship?: string | string[];
    sourceIntakeExactArtifactHref?: string | string[];
    sourceIntakeArtifactHref?: string | string[];
    sourceIntakeRoutingHref?: string | string[];
    sourceIntakePromptHistoryHref?: string | string[];
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const getFirstValue = (value?: string | string[]) =>
    Array.isArray(value) ? value[0] : value;
  const getAllValues = (value?: string | string[]) =>
    Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
  const initialInterest = getFirstValue(resolvedSearchParams.interest);
  const sourceTopic = getFirstValue(resolvedSearchParams.sourceTopic);
  const sourceRoom = getFirstValue(resolvedSearchParams.sourceRoom);
  const sourceTopicHref = getFirstValue(resolvedSearchParams.sourceTopicHref);
  const sourceLiveRecord = getFirstValue(resolvedSearchParams.sourceLiveRecord);
  const sourcePendingReview = getFirstValue(resolvedSearchParams.sourcePendingReview);
  const sourceChangedCard = getFirstValue(resolvedSearchParams.sourceChangedCard);
  const sourceAiOrigin = getFirstValue(resolvedSearchParams.sourceAiOrigin);
  const sourceDocumentBacked = getFirstValue(resolvedSearchParams.sourceDocumentBacked);
  const sourceRecordMode = getFirstValue(resolvedSearchParams.sourceRecordMode);
  const sourceScoreLabel = getFirstValue(resolvedSearchParams.sourceScoreLabel);
  const sourceScoreValue = getFirstValue(resolvedSearchParams.sourceScoreValue);
  const sourceScoreSlice = getFirstValue(resolvedSearchParams.sourceScoreSlice);
  const sourceScoreOpenPressure = getFirstValue(
    resolvedSearchParams.sourceScoreOpenPressure,
  );
  const sourceExactRecordTitle = getFirstValue(
    resolvedSearchParams.sourceExactRecordTitle,
  );
  const sourceExactRecordState = getFirstValue(
    resolvedSearchParams.sourceExactRecordState,
  );
  const sourceExactRecordPilotGrounding = getFirstValue(
    resolvedSearchParams.sourceExactRecordPilotGrounding,
  );
  const sourceExactRecordOrigin = getFirstValue(
    resolvedSearchParams.sourceExactRecordOrigin,
  );
  const sourceExactRecordSlice = getFirstValue(
    resolvedSearchParams.sourceExactRecordSlice,
  );
  const sourceExactRecordTarget = getFirstValue(
    resolvedSearchParams.sourceExactRecordTarget,
  );
  const sourceExactRecordRead = getFirstValue(
    resolvedSearchParams.sourceExactRecordRead,
  );
  const sourceExactRecordAiSource = getFirstValue(
    resolvedSearchParams.sourceExactRecordAiSource,
  );
  const sourceExactRecordHref = getFirstValue(
    resolvedSearchParams.sourceExactRecordHref,
  );
  const sourceExactRecordSourceTurnHref = getFirstValue(
    resolvedSearchParams.sourceExactRecordSourceTurnHref,
  );
  const sourceExactRecordSummaryLabels = getAllValues(
    resolvedSearchParams.sourceExactRecordSummaryLabel,
  );
  const sourceExactRecordSummaryHrefs = getAllValues(
    resolvedSearchParams.sourceExactRecordSummaryHref,
  );
  const sourceExactRecordSummaryLinks = sourceExactRecordSummaryLabels
    .map((label, index) => ({
      label,
      href: sourceExactRecordSummaryHrefs[index] ?? "",
    }))
    .filter((item): item is { label: string; href: string } => Boolean(item.href));
  const sourceIntakeArtifactTitle = getFirstValue(
    resolvedSearchParams.sourceIntakeArtifactTitle,
  );
  const sourceIntakePromptCount = getFirstValue(
    resolvedSearchParams.sourceIntakePromptCount,
  );
  const sourceIntakeHeldQuestionCount = getFirstValue(
    resolvedSearchParams.sourceIntakeHeldQuestionCount,
  );
  const sourceIntakeRelationship = getFirstValue(
    resolvedSearchParams.sourceIntakeRelationship,
  );
  const sourceIntakeExactArtifactHref = getFirstValue(
    resolvedSearchParams.sourceIntakeExactArtifactHref,
  );
  const sourceIntakeArtifactHref = getFirstValue(
    resolvedSearchParams.sourceIntakeArtifactHref,
  );
  const sourceIntakeRoutingHref = getFirstValue(
    resolvedSearchParams.sourceIntakeRoutingHref,
  );
  const sourceIntakePromptHistoryHref = getFirstValue(
    resolvedSearchParams.sourceIntakePromptHistoryHref,
  );
  const liveCardIndex = getLiveCardIndex();
  const contactContextTitle = sourceTopic
    ? `${sourceTopic}${sourceRoom ? ` in ${sourceRoom}` : ""}`
    : undefined;
  const sourceScoreSummary = sourceScoreLabel
    ? sourceScoreValue
      ? `${sourceScoreLabel} · ${sourceScoreValue}`
      : sourceScoreLabel
    : null;
  const contactContextScopeParts = [
    sourceScoreLabel ? "focused score context" : null,
    sourceExactRecordTitle ? "current pressure record" : null,
    sourceIntakeArtifactTitle ? "held intake pressure" : null,
  ].filter((part): part is string => Boolean(part));
  const contactContextScopeSuffix = contactContextScopeParts.length
    ? ` plus ${contactContextScopeParts.join(" and ")}`
    : "";
  const contactContextNote =
    sourceTopic && sourceRoom
      ? `This inquiry came from the live topic card in ${sourceRoom} and carries the card's current public-record snapshot${contactContextScopeSuffix} into the pilot request.`
      : sourceTopic
        ? `This inquiry came from a live Civic Logos topic card and carries its current public-record snapshot${contactContextScopeSuffix} into the pilot request.`
        : undefined;
  const contactContextFacts = [
    sourceLiveRecord ? { label: "Visible record", value: sourceLiveRecord } : null,
    sourcePendingReview ? { label: "Pending review", value: sourcePendingReview } : null,
    sourceChangedCard ? { label: "Changed card", value: sourceChangedCard } : null,
    sourceAiOrigin ? { label: "AI-origin", value: sourceAiOrigin } : null,
    sourceDocumentBacked
      ? { label: "Document-backed", value: sourceDocumentBacked }
      : null,
    sourceRecordMode ? { label: "Record mode", value: sourceRecordMode } : null,
    sourceScoreSummary
      ? { label: "Focused score", value: sourceScoreSummary }
      : null,
    sourceScoreSlice ? { label: "Score slice", value: sourceScoreSlice } : null,
    sourceScoreOpenPressure
      ? { label: "Open review pressure", value: sourceScoreOpenPressure }
      : null,
    sourceExactRecordTitle || sourceExactRecordState
      ? {
          label: "Current pressure record",
          value:
            sourceExactRecordTitle ??
            sourceExactRecordState ??
            "No visible public-record entry is currently linked.",
        }
      : null,
    sourceExactRecordOrigin
      ? { label: "Record origin", value: sourceExactRecordOrigin }
      : null,
    sourceExactRecordPilotGrounding
      ? { label: "Pilot grounding", value: sourceExactRecordPilotGrounding }
      : null,
    sourceExactRecordSlice
      ? { label: "Record slice", value: sourceExactRecordSlice }
      : null,
    sourceExactRecordTarget
      ? { label: "Record target", value: sourceExactRecordTarget }
      : null,
    sourceExactRecordRead
      ? { label: "Record read", value: sourceExactRecordRead }
      : null,
    sourceExactRecordAiSource
      ? { label: "AI source", value: sourceExactRecordAiSource }
      : null,
    sourceExactRecordSummaryLinks.length
      ? {
          label: "Surfacing in card",
          value: sourceExactRecordSummaryLinks.map((item) => item.label).join(", "),
        }
      : null,
    sourceIntakeArtifactTitle
      ? { label: "Held artifact", value: sourceIntakeArtifactTitle }
      : null,
    sourceIntakePromptCount
      ? { label: "Held prompts", value: sourceIntakePromptCount }
      : null,
    sourceIntakeHeldQuestionCount
      ? { label: "Held questions", value: sourceIntakeHeldQuestionCount }
      : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));
  const contactContextLinks = [
    sourceExactRecordHref
      ? { label: "Open exact public record entry", href: sourceExactRecordHref }
      : null,
    sourceExactRecordSourceTurnHref
      ? { label: "Open source AI turn", href: sourceExactRecordSourceTurnHref }
      : null,
    ...sourceExactRecordSummaryLinks.map((item) => ({
      label: `Open ${item.label}`,
      href: item.href,
    })),
    sourceTopicHref
      ? { label: "Open current topic card", href: sourceTopicHref }
      : null,
    sourceIntakeExactArtifactHref
      ? { label: "Open exact held artifact", href: sourceIntakeExactArtifactHref }
      : null,
    sourceIntakeArtifactHref
      ? { label: "Open intake artifact", href: sourceIntakeArtifactHref }
      : null,
    sourceIntakeRoutingHref
      ? { label: "Open routing AIs", href: sourceIntakeRoutingHref }
      : null,
    sourceIntakePromptHistoryHref
      ? { label: "Open prompt history", href: sourceIntakePromptHistoryHref }
      : null,
  ].filter((item): item is { label: string; href: string } => Boolean(item));
  const initialMessage =
    initialInterest === "Institutional pilot" && sourceTopic
      ? [
          `I am interested in an institutional review pilot for "${sourceTopic}"${sourceRoom ? ` in ${sourceRoom}` : ""}.`,
          "",
          "Current public-record snapshot:",
          sourceLiveRecord ? `- Visible record: ${sourceLiveRecord}` : null,
          sourcePendingReview ? `- Pending review: ${sourcePendingReview}` : null,
          sourceChangedCard ? `- Changed card: ${sourceChangedCard}` : null,
          sourceAiOrigin ? `- AI-origin contributions: ${sourceAiOrigin}` : null,
          sourceDocumentBacked
            ? `- Document-backed contributions: ${sourceDocumentBacked}`
            : null,
          sourceRecordMode ? `- Record mode: ${sourceRecordMode}` : null,
          sourceScoreSummary ? `- Focused score: ${sourceScoreSummary}` : null,
          sourceScoreSlice ? `- Score slice: ${sourceScoreSlice}` : null,
          sourceScoreOpenPressure
            ? `- Open review pressure: ${sourceScoreOpenPressure}`
            : null,
          sourceExactRecordTitle
            ? `- Current pressure record: ${sourceExactRecordTitle}`
            : null,
          !sourceExactRecordTitle && sourceExactRecordState
            ? `- Current pressure record: ${sourceExactRecordState}`
            : null,
          sourceExactRecordOrigin
            ? `- Record origin: ${sourceExactRecordOrigin}`
            : null,
          sourceExactRecordPilotGrounding
            ? `- Pilot grounding: ${sourceExactRecordPilotGrounding}`
            : null,
          sourceExactRecordSlice
            ? `- Record slice: ${sourceExactRecordSlice}`
            : null,
          sourceExactRecordTarget
            ? `- Record target: ${sourceExactRecordTarget}`
            : null,
          sourceExactRecordRead
            ? `- Record read: ${sourceExactRecordRead}`
            : null,
          sourceExactRecordAiSource
            ? `- AI source: ${sourceExactRecordAiSource}`
            : null,
          sourceExactRecordSummaryLinks.length
            ? `- Surfacing in card: ${sourceExactRecordSummaryLinks
                .map((item) => item.label)
                .join(", ")}`
            : null,
          sourceIntakeArtifactTitle
            ? `- Held artifact: ${sourceIntakeArtifactTitle}`
            : null,
          sourceIntakePromptCount
            ? `- Held prompts: ${sourceIntakePromptCount}`
            : null,
          sourceIntakeHeldQuestionCount
            ? `- Held questions: ${sourceIntakeHeldQuestionCount}`
            : null,
          sourceIntakeRelationship
            ? `- Held intake relationship: ${sourceIntakeRelationship}`
            : null,
          "",
          "What I want to explore:",
          "",
        ]
          .filter((item): item is string => Boolean(item))
          .join("\n")
      : undefined;

  return (
    <div className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true" />

      <header className={styles.hero} id="top">
        <nav className={styles.nav}>
          <SiteBrand className={styles.brand} href="#top" subtitle="Phase 1 launch site" />

          <div className={styles.navLinks}>
            <Link href="/rooms">Room library</Link>
            <Link href="/healthcare">Healthcare room</Link>
            <a href="#live-cards">Live cards</a>
            <a href="#manifesto">Manifesto</a>
            <a href="#contact">Early access</a>
          </div>
        </nav>

        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>Public reasoning for living ideas</p>
            <h1>Where civilization thinks in public.</h1>
            <p className={styles.lead}>
              Civic Logos is a public reasoning platform for living ideas,
              designed to help humans and AI structure, debate, refine, and
              update important public questions and ideas in the open.
            </p>
            <p className={styles.supporting}>
              Instead of burying arguments inside feeds, it gives each idea a
              durable home with objections, evidence, assumptions, revisions,
              and transparent public review.
            </p>

            <div className={styles.heroActions}>
              <Link className={styles.primaryAction} href="/healthcare">
                Explore healthcare room
              </Link>
              <Link className={styles.secondaryAction} href="/rooms">
                Browse room library
              </Link>
            </div>
          </div>

          <div className={styles.heroAside}>
            <HomeIntake />

            <aside className={styles.heroPanel}>
              <p className={styles.panelEyebrow}>Now building</p>
              <h2>A narrow first release with a clear job to do.</h2>
              <ul className={styles.panelList}>
                <li>Public homepage and concise founding manifesto.</li>
                <li>Visible room routing from the homepage instead of a dead landing page.</li>
                <li>Healthcare as the first full structured issue room.</li>
                <li>AI-assisted intake that places ideas into living rooms and inspectable topic directions.</li>
              </ul>
            </aside>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <section className={`${styles.quoteBand} ${styles.reveal}`}>
          <p>
            &quot;The goal is not to create a platform that tells civilization
            what to think. The goal is to create a platform where civilization
            can think better in public.&quot;
          </p>
        </section>

        <section className={`${styles.splitSection} ${styles.reveal}`}>
          <article className={styles.splitCard}>
            <span className={styles.cardLabel}>The problem</span>
            <h2>Modern discourse is built for expression, not cumulative reasoning.</h2>
            <p>
              Valuable ideas are duplicated, buried, distorted, or forgotten.
              Strong objections vanish into comment threads. Evidence is
              scattered. Public debate repeats itself without becoming a usable
              record of what has been learned.
            </p>
          </article>

          <article className={styles.splitCard}>
            <span className={styles.cardLabel}>The opening</span>
            <h2>Public memory can be structured, revised, and made visible.</h2>
            <p>
              Civic Logos organizes discourse around ideas instead of posts. The
              platform is meant to make disagreement legible, critique durable,
              and public reasoning clearer than ordinary social media can.
            </p>
          </article>
        </section>

        <section className={`${styles.section} ${styles.reveal}`} id="live-cards">
          <div className={styles.sectionIntro}>
            <span className={styles.cardLabel}>Live Cards</span>
            <h2>The most important thing to show is not just the theory, but the inspectable objects already in motion.</h2>
            <p>
              These are the live topic cards currently seeded across Civic
              Logos. They are the places where a room stops being a mission
              statement and starts becoming a public reasoning object.
            </p>
          </div>

          <div className={styles.liveCardGrid}>
            {liveCardIndex.map((card) => (
              <article className={styles.liveCard} key={card.href}>
                <div className={styles.liveCardMeta}>
                  <span>{card.roomTitle}</span>
                  <strong>{card.metric}</strong>
                </div>

                <h3>{card.title}</h3>
                <p>{card.summary}</p>

                <div className={styles.liveCardFooter}>
                  <span>{card.roomStage}</span>
                  <div className={styles.liveCardActions}>
                    <Link className={styles.primaryAction} href={card.href!}>
                      Open card
                    </Link>
                    <Link className={styles.secondaryAction} href={card.roomHref}>
                      Open room
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.reveal}`} id="manifesto">
          <div className={styles.sectionIntro}>
            <span className={styles.cardLabel}>Manifesto</span>
            <h2>A concise founding position for the public launch.</h2>
            <p>
              Phase 1 is not the full platform. It is the public flag-planting
              moment: enough clarity, conviction, and structure for someone to
              understand the mission in under a minute.
            </p>
          </div>

          <div className={styles.manifestoGrid}>
            {manifestoPoints.map((point, index) => (
              <article className={styles.manifestoItem} key={point}>
                <span className={styles.manifestoIndex}>0{index + 1}</span>
                <p>{point}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.reveal}`}>
          <div className={styles.sectionIntro}>
            <span className={styles.cardLabel}>Core distinctions</span>
            <h2>What makes Civic Logos different from a discussion site.</h2>
          </div>

          <div className={styles.distinctionGrid}>
            {distinctions.map((item) => (
              <article className={styles.distinctionCard} key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.reveal}`}>
          <div className={styles.sectionIntro}>
            <span className={styles.cardLabel}>Why This Is Different</span>
            <h2>The project needs an answer to “why isn’t this just Wikipedia or Reddit for ideas?”</h2>
            <p>
              The answer is not that Civic Logos is simply cleaner or more thoughtful.
              It is that the underlying object is different: unresolved public questions,
              attributable perspectives, visible objections, and a living synthesis that
              updates without pretending the disagreement is gone.
            </p>
          </div>

          <div className={styles.compareGrid}>
            {priorArtComparisons.map((item) => (
              <article className={styles.compareCard} key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.reveal}`}>
          <div className={styles.sectionIntro}>
            <span className={styles.cardLabel}>Contributor Loop</span>
            <h2>People will only come back if the platform gives them a real reason to return.</h2>
            <p>
              The long-term loop is not generic engagement. It is contribution, visibility,
              synthesis impact, and domain reputation. People should feel that their
              judgment can survive, matter, and compound inside the room.
            </p>
          </div>

          <div className={styles.loopGrid}>
            {contributorLoop.map((item) => (
              <article className={styles.loopCard} key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.reveal}`} id="release">
          <div className={styles.sectionIntro}>
            <span className={styles.cardLabel}>First release</span>
            <h2>Phase 1 exists to make the project legible and credible.</h2>
            <p>
              The first public version should explain what Civic Logos is, why
              it matters, what is being built first, and how someone can follow
              the work or offer help.
            </p>
          </div>

          <div className={styles.releaseLayout}>
            <article className={styles.releaseCard}>
              <h3>What launches first</h3>
              <ul className={styles.releaseList}>
                {releaseItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className={styles.releaseActions}>
                <Link className={styles.primaryAction} href="/healthcare">
                  Enter the room
                </Link>
                <Link className={styles.secondaryAction} href="/rooms">
                  Explore all rooms
                </Link>
              </div>
            </article>

            <article className={styles.releaseCard}>
              <h3>Room library now in view</h3>
              <p>
                The first issue room still asks: {issueRoomQuestion}
              </p>
              <div className={styles.tagGrid}>
                {roomDirectory.map((room) => (
                  <span className={styles.tag} key={room.slug}>
                    {room.title}
                  </span>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className={`${styles.section} ${styles.reveal}`} id="contact">
          <div className={styles.contactCard}>
            <div className={styles.contactCopy}>
              <span className={styles.cardLabel}>Early access</span>
              <h2>Help shape the first version.</h2>
              <p>
                Civic Logos is beginning with a focused public launch, a
                healthcare prototype direction, and a search for early readers,
                testers, researchers, designers, and domain experts.
              </p>
              <p>
                If you want to follow the project, contribute perspective, or
                help pressure-test the first issue room, send a note here and
                it will go straight to the Civic Logos inbox.
              </p>
            </div>

            <div className={styles.contactFormWrap}>
              <ContactForm
                initialContextFacts={contactContextFacts}
                initialContextHref={sourceTopicHref}
                initialContextLinks={contactContextLinks}
                initialContextNote={contactContextNote}
                initialContextRelationshipNote={sourceIntakeRelationship}
                initialContextTitle={contactContextTitle}
                initialInterest={initialInterest}
                initialMessage={initialMessage}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
