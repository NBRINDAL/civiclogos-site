import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getRoomHref,
  getRoomTopicHref,
} from "@/app/lib/civic-logos";
import { buildHomeIntakeBrief } from "@/app/lib/home-intake-brief";
import { SiteBrand } from "@/app/components/site-brand";
import {
  getHomeIntakeCookieName,
  parseHomeIntakeCookie,
} from "@/app/lib/home-intake-cookie";
import {
  formatPromptDate,
  getEarliestAttachedPrompt,
  getLatestAttachedPrompt,
  getPromptEvolution,
  getPromptHistory,
  getPromptHistoryCount,
  getPromptHistoryHref,
  getPromptTimestamp,
} from "@/app/lib/home-intake-prompt-history";
import { getHomeIntakeHeldQuestions } from "@/app/lib/home-intake-held-questions";
import { summarizeHomeIntakeRoutingConsensus } from "@/app/lib/home-intake-routing-consensus";
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
          promptCount:
            cookieEntry.promptCount ??
            cookieEntry.relatedPrompts?.length ??
            1,
          relatedPrompts: cookieEntry.relatedPrompts,
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
  const issueDevelopment =
    entry.routing.routeKind !== "existing-room"
      ? await buildHomeIntakeBrief(entry)
      : null;
  const promptHistory =
    entry.routing.routeKind === "existing-room" ? [] : getPromptHistory(entry);
  const promptCount = getPromptHistoryCount(entry);
  const earliestPrompt =
    entry.routing.routeKind === "existing-room"
      ? null
      : getEarliestAttachedPrompt(entry);
  const latestPrompt =
    entry.routing.routeKind === "existing-room"
      ? null
      : getLatestAttachedPrompt(entry);
  const promptEvolution =
    entry.routing.routeKind === "existing-room"
      ? null
      : getPromptEvolution(entry);
  const earliestPromptDate = earliestPrompt
    ? formatPromptDate(earliestPrompt.createdAt)
    : undefined;
  const latestPromptDate = latestPrompt
    ? formatPromptDate(latestPrompt.createdAt)
    : undefined;
  const heldQuestions = getHomeIntakeHeldQuestions(entry.routing);
  const routingConsensus = summarizeHomeIntakeRoutingConsensus(entry.routing);

  return (
    <div className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.headerBar}>
          <SiteBrand className={styles.brand} href="/" subtitle="AI intake result" />

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
                : entry.routing.routeKind === "room-topic-draft"
                  ? "Draft topic created in current room"
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
            <span className={styles.panelLabel}>
              {entry.routing.routeKind === "new-room-draft" ? "Seed prompt" : "Original prompt"}
            </span>
            <p>{entry.prompt}</p>
            <div className={styles.heroMeta}>
              <div>
                <span>Confidence</span>
                <strong>{entry.routing.routeConfidence ?? "working draft"}</strong>
              </div>
              {entry.routing.routeKind !== "existing-room" ? (
                <div>
                  <span>Attached prompts</span>
                  <strong>{promptCount}</strong>
                </div>
              ) : null}
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
              : entry.routing.routeKind === "room-topic-draft"
                ? "This idea belongs inside a current room, but it still needs its own durable draft topic."
              : "The current room map is still incomplete for this issue, so Civic Logos opened a room candidate instead."}
          </h2>
          <p>{entry.routing.suggestedTopicSummary}</p>

          {entry.routing.suggestedCentralQuestion ? (
            <div className={styles.questionCard}>
              <span>Central question</span>
              <p>{entry.routing.suggestedCentralQuestion}</p>
            </div>
          ) : null}

          {heldQuestions.length ? (
            <div className={styles.listBlock}>
              <h3>Questions this artifact is holding</h3>
              <ul className={styles.questionList}>
                {heldQuestions.map((item) => (
                  <li className={styles.questionListItem} key={item.question}>
                    <p>{item.question}</p>
                    <span>{item.provenanceLabel}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {entry.routing.routeKind !== "existing-room" && entry.routing.whyNotExistingRooms ? (
            <div className={styles.listBlock}>
              <h3>
                {entry.routing.routeKind === "room-topic-draft"
                  ? "Why this became a new draft topic"
                  : "Why this was not placed in a current room"}
              </h3>
              <p>{entry.routing.whyNotExistingRooms}</p>
            </div>
          ) : null}

          {entry.routing.routeKind !== "existing-room" ? (
            <div className={styles.listBlock}>
              <h3>Current map relationship</h3>
              {entry.routing.routeKind === "room-topic-draft" ? (
                <>
                  <p>
                    This object now lives as a durable draft topic inside{" "}
                    <strong>{entry.routing.roomTitle ?? "the host room"}</strong>.
                    {entry.routing.topicTitle
                      ? ` It is currently pressing on the live card ${entry.routing.topicTitle}, which still does not absorb the pressure cleanly enough.`
                      : " It still needs a cleaner live-card home before it becomes a full inspectable topic card."}
                  </p>
                  <div className={styles.actions}>
                    {roomHref ? (
                      <Link className={styles.primaryAction} href={`${roomHref}#draft-topics`}>
                        Open host room
                      </Link>
                    ) : null}
                    {topicHref ? (
                      <Link className={styles.secondaryAction} href={topicHref}>
                        Open closest live card
                      </Link>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  <p>
                    This object is currently being held as a room candidate because
                    the active room library still does not absorb it cleanly enough.
                    It can accumulate more public pressure here before Civic Logos
                    decides whether it belongs inside a current room or needs a new
                    room to exist.
                  </p>
                  <div className={styles.actions}>
                    <Link className={styles.primaryAction} href="/rooms#room-candidates">
                      Open room candidates
                    </Link>
                    <Link className={styles.secondaryAction} href="/rooms">
                      Open room library
                    </Link>
                  </div>
                </>
              )}
            </div>
          ) : null}

          {routingConsensus ? (
            <div className={styles.listBlock}>
              <h3>Routing consensus</h3>
              <p>
                <strong>{routingConsensus.headline}.</strong>{" "}
                {routingConsensus.detail}
              </p>
            </div>
          ) : null}

          {entry.routing.routeKind !== "existing-room" && promptHistory.length ? (
            <div className={styles.listBlock} id="prompt-history">
              <h3>
                {entry.routing.routeKind === "room-topic-draft"
                  ? "Prompt history on this draft topic"
                  : "Prompt history on this room candidate"}
              </h3>
              <p>
                {promptCount > 1
                  ? `This object is now holding ${promptCount} related prompts. The latest pressure appears first so the room map can show what kept the issue alive.`
                  : "This object is currently holding one public prompt. If more related prompts converge on the same issue, they will accumulate here instead of dissolving into separate routing receipts."}
              </p>
              <div className={styles.promptHistoryMeta}>
                {earliestPromptDate ? (
                  <div className={styles.promptHistoryStat}>
                    <span>First seen</span>
                    <strong>{earliestPromptDate}</strong>
                  </div>
                ) : null}
                <div className={styles.promptHistoryStat}>
                  <span>{promptCount > 1 ? "Latest pressure" : "Current state"}</span>
                  <strong>
                    {promptCount > 1 && latestPromptDate
                      ? latestPromptDate
                      : "Single prompt so far"}
                  </strong>
                </div>
                <div className={styles.promptHistoryStat}>
                  <span>Pressure held</span>
                  <strong>
                    {promptCount} prompt{promptCount === 1 ? "" : "s"} attached
                  </strong>
                </div>
              </div>
              {promptEvolution ? (
                <div className={styles.promptEvolution}>
                  <div className={styles.promptEvolutionItem}>
                    <span>Started with</span>
                    <p>{promptEvolution.earliest.prompt}</p>
                  </div>
                  <div className={styles.promptEvolutionItem}>
                    <span>Latest pressure</span>
                    <p>{promptEvolution.latest.prompt}</p>
                  </div>
                </div>
              ) : null}
              <ul>
                {promptHistory.slice(0, 5).map((item) => (
                  <li key={item.id}>
                    {getPromptTimestamp(item.createdAt) ? (
                      <strong>
                        {new Date(item.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        :
                      </strong>
                    ) : null}{" "}
                    {item.prompt}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className={styles.actions}>
            {roomHref ? (
              <Link
                className={styles.primaryAction}
                href={
                  entry.routing.routeKind === "room-topic-draft"
                    ? `${roomHref}#draft-topics`
                    : `${roomHref}?intake=${entry.id}`
                }
              >
                {entry.routing.routeKind === "room-topic-draft"
                  ? "Open host room"
                  : "Open routed room"}
              </Link>
            ) : null}
            {entry.routing.routeKind === "new-room-draft" ? (
              <Link className={styles.primaryAction} href="/rooms#room-candidates">
                Open room candidates
              </Link>
            ) : null}
            {entry.routing.routeKind === "room-topic-draft" && roomHref ? (
              <Link className={styles.secondaryAction} href={`${roomHref}#draft-topics`}>
                Open room draft topics
              </Link>
            ) : null}
            {entry.routing.routeKind !== "existing-room" ? (
              <Link
                className={styles.secondaryAction}
                href={getPromptHistoryHref(entry)}
              >
                Open prompt history
              </Link>
            ) : null}
            {topicHref ? (
              <Link className={styles.secondaryAction} href={topicHref}>
                {entry.routing.routeKind === "room-topic-draft"
                  ? "Open closest live card"
                  : "Open suggested live card"}
              </Link>
            ) : null}
            <Link className={styles.secondaryAction} href="/rooms">
              Back to room library
            </Link>
          </div>
        </section>

        {issueDevelopment ? (
          <section className={styles.section}>
            <div className={styles.sectionHeading}>
              <span className={styles.eyebrow}>Issue development</span>
              <h2>A room candidate should begin mapping the issue from multiple perspectives.</h2>
              <p className={styles.summary}>{issueDevelopment.disclaimer}</p>
            </div>

            {issueDevelopment.answers.length ? (
              <div className={styles.providerGrid}>
                {issueDevelopment.answers.map((answer) => (
                  <article className={styles.providerCard} key={`${answer.provider}-${answer.generatedAt}`}>
                    <div className={styles.providerMeta}>
                      <span>{getProviderLabel(answer.provider)}</span>
                      <strong>{answer.model}</strong>
                    </div>
                    <p className={styles.devStamp}>
                      Generated {new Intl.DateTimeFormat("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(answer.generatedAt))}
                    </p>
                    <div className={styles.longformAnswer}>
                      {answer.response.split(/\n{2,}/).map((block) => (
                        <p key={block}>{block}</p>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : null}

            {issueDevelopment.issues.length ? (
              <div className={styles.providerGrid}>
                {issueDevelopment.issues.map((issue) => (
                  <article className={styles.providerCard} key={`${issue.provider}-${issue.model ?? "issue"}`}>
                    <div className={styles.providerMeta}>
                      <span>{getProviderLabel(issue.provider)}</span>
                      <strong>{issue.model ?? "Unavailable"}</strong>
                    </div>
                    <p>{issue.message}</p>
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        <section className={styles.section} id="routing-ais">
          <div className={styles.sectionHeading}>
            <span className={styles.eyebrow}>Routing AIs</span>
            <h2>The intake engine is stronger when both models stay visible as separate AIs.</h2>
            <p className={styles.summary}>
              These model outputs explain how Civic Logos tried to place the issue in the current map.
              They do not replace the issue-development pass above.
            </p>
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
                      : provider.routeKind === "room-topic-draft"
                        ? `${provider.roomTitle ?? "Current room"} (draft topic)`
                        : "Room candidate"}
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
