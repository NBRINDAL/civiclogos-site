import Link from "next/link";
import { ContactForm } from "./components/contact-form";
import { issueRoomQuestion, roomDirectory } from "./lib/civic-logos";
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

export default function Home() {
  return (
    <div className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true" />

      <header className={styles.hero} id="top">
        <nav className={styles.nav}>
          <a className={styles.brand} href="#top">
            <span className={styles.brandMark}>CL</span>
            <span className={styles.brandText}>
              <strong>Civic Logos</strong>
              <span>Phase 1 launch site</span>
            </span>
          </a>

          <div className={styles.navLinks}>
            <Link href="/rooms">Room library</Link>
            <Link href="/healthcare">Healthcare room</Link>
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

          <aside className={styles.heroPanel}>
            <p className={styles.panelEyebrow}>Now building</p>
            <h2>A narrow first release with a clear job to do.</h2>
            <ul className={styles.panelList}>
              <li>Public homepage and concise founding manifesto.</li>
              <li>Clear explanation of why ideas should outlast posts.</li>
              <li>Healthcare as the first full structured issue room.</li>
              <li>A seeded room library for harder domains like governance, housing, AI/labor, and institutional trust.</li>
            </ul>
          </aside>
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
              <ContactForm />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
