import { ContactForm } from "./components/contact-form";
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

const manifestoPoints = [
  "Public discourse is trapped inside posts, feeds, outrage loops, and fragmented commentary.",
  "Important ideas are buried, duplicated, distorted, or forgotten before they become public memory.",
  "The internet and AI now make a better civic reasoning layer possible.",
  "Civic Logos treats ideas as living objects with objections, evidence, revisions, and scorecards.",
  "The platform begins narrowly: a seed library, a healthcare issue room, and a visible first prototype.",
];

const releaseItems = [
  'Homepage, manifesto, and a clear public explanation of "ideas, not posts."',
  "Healthcare as the first issue room, chosen because it is personal, political, expensive, and institutionally complex.",
  "Structured idea cards built around thesis, mechanism, benefits, risks, assumptions, and economic delta.",
  "A simple early-access path for supporters, advisors, testers, and domain experts.",
];

const ideaCardFields = [
  "Thesis",
  "Mechanism",
  "Benefits",
  "Risks",
  "Assumptions",
  "Economic delta",
  "Strongest support",
  "Strongest objection",
  "Public scorecard",
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
            <a href="#manifesto">Manifesto</a>
            <a href="#release">First release</a>
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
              update important proposals in the open.
            </p>
            <p className={styles.supporting}>
              Instead of burying arguments inside feeds, it gives each idea a
              durable home with objections, evidence, assumptions, revisions,
              and transparent public review.
            </p>

            <div className={styles.heroActions}>
              <a className={styles.primaryAction} href="#manifesto">
                Read the manifesto
              </a>
              <a className={styles.secondaryAction} href="#release">
                See Phase 1
              </a>
            </div>
          </div>

          <aside className={styles.heroPanel}>
            <p className={styles.panelEyebrow}>Now building</p>
            <h2>A narrow first release with a clear job to do.</h2>
            <ul className={styles.panelList}>
              <li>Public homepage and concise founding manifesto.</li>
              <li>Clear explanation of why ideas should outlast posts.</li>
              <li>Healthcare preview as the first structured issue room.</li>
              <li>Simple path for early supporters, testers, and advisors.</li>
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
            </article>

            <article className={styles.releaseCard}>
              <h3>Healthcare issue room preview</h3>
              <p>
                The first issue room asks: what system best balances cost,
                access, quality, freedom, innovation, and public health?
              </p>
              <div className={styles.tagGrid}>
                {ideaCardFields.map((field) => (
                  <span className={styles.tag} key={field}>
                    {field}
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
