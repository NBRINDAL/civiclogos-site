import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getRoomHref,
  getRoomTopicHref,
} from "@/app/lib/civic-logos";
import {
  getHomeIntakeCookieName,
  parseHomeIntakeCookie,
} from "@/app/lib/home-intake-cookie";
import { getHomeIntakeEntry, getHomeIntakeStoreMetadata } from "@/app/lib/home-intake-store";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type ProviderLabel = "OpenAI" | "Claude";

function getProviderLabel(provider: string): ProviderLabel {
  return provider === "openai" ? "OpenAI" : "Claude";
}

function getStorageModeLabel(mode: "prototype" | "database" | "fallback") {
  if (mode === "database") {
    return "Persistent database";
  }

  if (mode === "fallback") {
    return "Fallback prototype";
  }

  return "Prototype";
}

export default async function IntakeEntryPage({
  params,
}: {
  params: Promise<{ entryId: string }>;
}) {
  const { entryId } = await params;
  const cookieStore = await cookies();
  const cookieEntry = parseHomeIntakeCookie(
    cookieStore.get(getHomeIntakeCookieName())?.value,
  );
  const [storedEntry, metadata] = await Promise.all([
    getHomeIntakeEntry(entryId),
    getHomeIntakeStoreMetadata(),
  ]);
  const entry =
    cookieEntry?.id === entryId
      ? {
          id: cookieEntry.id,
          prompt: cookieEntry.prompt,
          createdAt: "",
          updatedAt: "",
          routing: cookieEntry.routing,
        }
      : storedEntry;

  if (!entry) {
    notFound();
  }

  const roomHref = entry.routing.roomSlug
    ? getRoomHref(entry.routing.roomSlug)
    : undefined;
  const topicHref =
    entry.routing.roomSlug && entry.routing.topicId
      ? getRoomTopicHref(entry.routing.roomSlug, entry.routing.topicId)
      : undefined;

  return (
    <div className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.headerBar}>
          <Link className={styles.brand} href="/">
            <span className={styles.brandMark}>CL</span>
            <span className={styles.brandText}>
              <strong>Civic Logos</strong>
              <span>AI intake result</span>
            </span>
          </Link>

          <nav className={styles.nav}>
            <Link href="/">Home</Link>
            <Link href="/rooms">All rooms</Link>
          </nav>
        </div>

        <div className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>
              {entry.routing.routeKind === "existing-room"
                ? "Routed to current room"
                : "Room candidate created"}
            </span>
            <h1>
              {entry.routing.routeKind === "existing-room"
                ? entry.routing.roomTitle ?? "Current room"
                : entry.routing.suggestedTopicTitle ?? "Room candidate"}
            </h1>
            <p className={styles.summary}>
              {entry.routing.fitSummary ??
                "The current room map produced a provisional routing result for this idea."}
            </p>
          </div>

          <aside className={styles.heroPanel}>
            <span className={styles.panelLabel}>Original prompt</span>
            <p>{entry.prompt}</p>
            <div className={styles.heroMeta}>
              <div>
                <span>Confidence</span>
                <strong>{entry.routing.routeConfidence ?? "working draft"}</strong>
              </div>
              <div>
                <span>Storage mode</span>
                <strong>{getStorageModeLabel(metadata.mode)}</strong>
              </div>
            </div>
          </aside>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.panel}>
          <span className={styles.eyebrow}>What the intake engine saw</span>
          <h2>
            {entry.routing.routeKind === "existing-room"
              ? "This idea fits a current room more cleanly than it needs a new one."
              : "The current room map was treated as a weak fit, so Civic Logos opened a room candidate instead."}
          </h2>
          <p>{entry.routing.suggestedTopicSummary}</p>

          {entry.routing.suggestedCentralQuestion ? (
            <div className={styles.questionCard}>
              <span>Central question</span>
              <p>{entry.routing.suggestedCentralQuestion}</p>
            </div>
          ) : null}

          {entry.routing.suggestedFirstQuestions?.length ? (
            <div className={styles.listBlock}>
              <h3>Suggested first questions</h3>
              <ul>
                {entry.routing.suggestedFirstQuestions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {entry.routing.routeKind === "new-room-draft" && entry.routing.whyNotExistingRooms ? (
            <div className={styles.listBlock}>
              <h3>Why this was not placed in a current room</h3>
              <p>{entry.routing.whyNotExistingRooms}</p>
            </div>
          ) : null}

          <div className={styles.actions}>
            {roomHref ? (
              <Link className={styles.primaryAction} href={`${roomHref}?intake=${entry.id}`}>
                Open routed room
              </Link>
            ) : null}
            {entry.routing.routeKind === "new-room-draft" ? (
              <Link className={styles.primaryAction} href="/rooms#room-candidates">
                Open room candidates
              </Link>
            ) : null}
            {topicHref ? (
              <Link className={styles.secondaryAction} href={topicHref}>
                Open suggested live card
              </Link>
            ) : null}
            <Link className={styles.secondaryAction} href="/rooms">
              Back to room library
            </Link>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <span className={styles.eyebrow}>Parallel readers</span>
            <h2>The public intake is stronger when both models stay visible as readers.</h2>
          </div>

          <div className={styles.providerGrid}>
            {entry.routing.providers.map((provider) => (
              <article className={styles.providerCard} key={provider.provider}>
                <div className={styles.providerMeta}>
                  <span>{getProviderLabel(provider.provider)}</span>
                  <strong>{provider.model ?? "Unavailable"}</strong>
                </div>

                <p>
                  {provider.state === "completed"
                    ? provider.fitSummary
                    : provider.errorMessage ??
                      "This provider did not produce a routing read for this prompt."}
                </p>

                {provider.routeKind ? (
                  <p>
                    <strong>Route:</strong>{" "}
                    {provider.routeKind === "existing-room"
                      ? provider.roomTitle ?? "Current room"
                      : "Provisional new-room draft"}
                  </p>
                ) : null}

                {provider.topicTitle || provider.suggestedTopicTitle ? (
                  <p>
                    <strong>Suggested topic:</strong>{" "}
                    {provider.topicTitle ?? provider.suggestedTopicTitle}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
