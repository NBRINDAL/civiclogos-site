import { cookies, headers } from "next/headers";
import Link from "next/link";
import AskInterface from "@/app/components/ask-interface";
import { SiteBrand } from "@/app/components/site-brand";
import { getAskSessionCookieName, isAskSessionId } from "@/app/lib/ask-session";
import { getAskDeploymentState } from "@/app/lib/ask-deployment-state";
import type { AskReadOnlyResult } from "@/app/lib/ask-types";
import {
  getCandidateById,
  inspectCandidateStoreMetadata,
} from "@/app/lib/candidate-store";
import { getContributionCountSummary } from "@/app/lib/contribution-counts";
import {
  listPublicContributions,
} from "@/app/lib/contribution-store";
import { getRoomTopicCard } from "@/app/lib/civic-logos";
import { getCurrentVisibleSynthesis } from "@/app/lib/public-record-revisions";
import {
  inspectTopicChatStoreMetadata,
  listTopicChatMessages,
} from "@/app/lib/topic-chat-store";
import styles from "./main-chat-workspace.module.css";

const roomId = "healthcare";
const topicId = "topic-001";

const readerPrompts = [
  "What changed in this card?",
  "What remains unresolved?",
  "What evidence is attached?",
  "What would move this card forward?",
] as const;

const publicSurfaceLinks = [
  {
    href: "/healthcare/topic-001",
    label: "Live healthcare card",
    detail: "Read the current card, debate structure, and public-facing reasoning object.",
  },
  {
    href: "/healthcare/topic-001?view=ledger#contribution-record",
    label: "Healthcare ledger slice",
    detail: "Inspect visible records, attachment targets, review decisions, and revision context.",
  },
  {
    href: "/ledger",
    label: "Ledger overview",
    detail: "See the public audit surface and the protocol-facing explanation of the record model.",
  },
  {
    href: "/demo",
    label: "Guided demo",
    detail: "Walk through the healthcare example and the V2 candidate-output path.",
  },
] as const;

const explorationLinks = [
  {
    href: "/about",
    label: "About Civic Logos",
    detail: "Read the longer manifesto, distinctions, and public launch framing.",
  },
  {
    href: "/healthcare",
    label: "Healthcare room",
    detail: "View the wider room around the live card without creating a new room.",
  },
  {
    href: "/rooms",
    label: "Room library",
    detail: "Browse the rest of the seeded system from one directory.",
  },
  {
    href: "/institutions",
    label: "Institutions",
    detail: "See the institutional pilot framing and review-capacity thesis.",
  },
  {
    href: "/press",
    label: "Press",
    detail: "Use the public-facing summary, language, and positioning surfaces.",
  },
  {
    href: "/challenge",
    label: "Challenge path",
    detail: "Open the contribution challenge framing without giving AI ledger authority.",
  },
] as const;

const maintainerLinks = [
  {
    href: "/review/contributions?roomSlug=healthcare&topicId=topic-001",
    label: "Maintainer review console",
    detail: "Locked maintainer-only console for promotion, reject, archive, and public review actions.",
  },
] as const;

type MainChatWorkspaceProps = {
  entryPoint: "root" | "ask";
};

type RouteLink = {
  href: string;
  label: string;
  detail: string;
};

function RouteList({
  links,
}: {
  links: readonly RouteLink[];
}) {
  return (
    <div className={styles.routeList}>
      {links.map((item) => (
        <Link className={styles.routeCard} href={item.href} key={item.href}>
          <strong>{item.label}</strong>
          <p>{item.detail}</p>
        </Link>
      ))}
    </div>
  );
}

export default async function MainChatWorkspace({
  entryPoint,
}: MainChatWorkspaceProps) {
  const topic = getRoomTopicCard(roomId, topicId);

  if (!topic) {
    throw new Error("The Civic Logos V2 ask topic is unavailable.");
  }

  const cookieStore = await cookies();
  const headerStore = await headers();
  const requestHost = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const requestProtocol = headerStore.get("x-forwarded-proto");
  const sessionId = cookieStore.get(getAskSessionCookieName())?.value;
  const askSessionId = sessionId && isAskSessionId(sessionId) ? sessionId : null;
  const [chatStoreMetadata, candidateStoreMetadata, contributions] =
    await Promise.all([
      inspectTopicChatStoreMetadata({
        avoidPrototypeInitialization: true,
      }),
      inspectCandidateStoreMetadata({
        avoidPrototypeInitialization: true,
      }),
      listPublicContributions({
        roomSlug: roomId,
        topicId,
        limit: 24,
      }),
    ]);
  const askDeployment = getAskDeploymentState({
    candidateStore: candidateStoreMetadata,
    chatStore: chatStoreMetadata,
    host: requestHost,
    protocol: requestProtocol,
  });
  const initialMessages =
    askSessionId && !askDeployment.prototypeReadOnlyMode
      ? await listTopicChatMessages({
          sessionId: askSessionId,
          roomSlug: roomId,
          topicId,
          limit: 24,
        })
      : [];
  const latestAssistantMessage = [...initialMessages]
    .reverse()
    .find((item) => item.role === "assistant");
  const latestCandidateId =
    latestAssistantMessage?.promotion?.state === "candidate-suggested"
      ? latestAssistantMessage.promotion.candidateId
      : undefined;
  const initialCandidate = latestCandidateId && !askDeployment.prototypeReadOnlyMode
    ? await getCandidateById(latestCandidateId)
    : null;
  const initialReadOnly: AskReadOnlyResult | null =
    latestAssistantMessage?.promotion?.state === "read-only-answer"
      ? {
          intent:
            latestAssistantMessage.promotion.readOnlyIntent ?? "current_synthesis",
          note:
            latestAssistantMessage.promotion.note ||
            "This answer is read-only. No candidate was created.",
          recordsUsed: latestAssistantMessage.promotion.recordsUsed ?? [],
        }
      : null;
  const counts = getContributionCountSummary(contributions);
  const currentSynthesis = getCurrentVisibleSynthesis({
    baseSynthesis: topic.currentRead,
    contributions,
  });
  const latestRevision = topic.revisionHistory[topic.revisionHistory.length - 1];

  return (
    <div className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.headerBar}>
          <SiteBrand className={styles.brand} href="/" subtitle="Main chat workspace" />

          <nav className={styles.topNav}>
            <Link href="/">Chat</Link>
            <Link href="/about">About</Link>
            <Link href="/healthcare/topic-001">Current card</Link>
            <Link href="/ledger">Ledger</Link>
            <Link href="/demo">Demo</Link>
            <Link href="/rooms">Rooms</Link>
            <Link href="/press">Press</Link>
            <Link href="/institutions">Institutions</Link>
          </nav>
        </div>

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Civic Logos V2</span>
            <h1>Make chat the front door, and keep the public record inspectable.</h1>
            <p className={styles.lead}>
              This is now the main interaction surface. Ask read-only questions from the
              live healthcare ledger, or speak naturally and let Civic Logos structure a
              pre-ledger candidate for human review.
            </p>
            <p className={styles.supporting}>
              The website remains the public audit surface. The chat is the interaction
              surface. Human review is still the only path that can promote a contribution
              into the public ledger or later move the synthesis.
            </p>

            <div className={styles.heroActions}>
              <Link className={styles.primaryAction} href="/healthcare/topic-001">
                Open live healthcare card
              </Link>
              <Link className={styles.secondaryAction} href="/about">
                Read the full site narrative
              </Link>
            </div>
          </div>

          <aside className={styles.heroPanel}>
            <span className={styles.panelLabel}>Current scope</span>
            <h2>{topic.title}</h2>
            <p>{currentSynthesis}</p>

            <div className={styles.heroStats}>
              <div>
                <strong>{counts.visibleRecords}</strong>
                <span>visible records</span>
              </div>
              <div>
                <strong>{counts.pendingReview}</strong>
                <span>pending review</span>
              </div>
              <div>
                <strong>{topic.revisionHistory.length}</strong>
                <span>revision trace events</span>
              </div>
              <div>
                <strong>
                  {askDeployment.prototypeReadOnlyMode ? "read-only" : "active"}
                </strong>
                <span>candidate intake</span>
              </div>
            </div>

            {askDeployment.notice ? (
              <p className={`${styles.statusNote} ${styles.statusWarn}`}>
                {askDeployment.notice}
              </p>
            ) : (
              <p className={styles.statusNote}>
                V2 candidate intake is active. AI may answer from the public ledger and
                structure internal candidates, but it may not write directly into the public
                record, create RevisionEvents, or change synthesis.
              </p>
            )}

            <div className={styles.scopeMeta}>
              <span>
                Current topic: <strong>{roomId} / {topicId}</strong>
              </span>
              <span>
                Latest revision: <strong>{latestRevision?.version ?? "v0.1"}</strong>
              </span>
              <span>
                Entry point: <strong>{entryPoint === "root" ? "/" : "/ask"}</strong>
              </span>
            </div>
          </aside>
        </section>
      </header>

      <main className={styles.main}>
        <aside className={styles.sideRail}>
          <section className={styles.railCard}>
            <div className={styles.railHeader}>
              <span className={styles.eyebrow}>Ask as reader</span>
              <h2>Good prompts to try first.</h2>
            </div>
            <ul className={styles.promptList}>
              {readerPrompts.map((prompt) => (
                <li key={prompt}>{prompt}</li>
              ))}
            </ul>
            <p className={styles.railNote}>
              Read-only asks return ledger answers, records used, and no candidate.
              Contribution-style messages still become pending human-review candidates.
            </p>
          </section>

          <section className={styles.railCard}>
            <div className={styles.railHeader}>
              <span className={styles.eyebrow}>Public surfaces</span>
              <h2>Inspect the visible record from here.</h2>
            </div>
            <RouteList links={publicSurfaceLinks} />
          </section>

          <section className={styles.railCard}>
            <div className={styles.railHeader}>
              <span className={styles.eyebrow}>Explore Civic Logos</span>
              <h2>Keep the rest of the site one click away.</h2>
            </div>
            <RouteList links={explorationLinks} />
          </section>

          <section className={styles.railCard}>
            <div className={styles.railHeader}>
              <span className={styles.eyebrow}>Maintainer path</span>
              <h2>Human review still controls promotion.</h2>
            </div>
            <RouteList links={maintainerLinks} />
          </section>
        </aside>

        <section className={styles.workspaceColumn}>
          <section className={styles.workspaceIntro}>
            <div className={styles.workspaceIntroHeader}>
              <div>
                <span className={styles.eyebrow}>Ask-first surface</span>
                <h2>Ask the live healthcare card in plain language.</h2>
              </div>
              <Link className={styles.inlineLink} href="/healthcare/topic-001?view=ledger#contribution-record">
                Open exact ledger slice
              </Link>
            </div>

            <p>
              Read-only questions are answered from the current public ledger. Contribution-style
              statements are structured into internal candidates that wait in the human review
              queue before anything can become a public contribution.
            </p>

            <div className={styles.flowTrack} aria-label="V2 ask flow">
              <span className={styles.flowStep}>natural language</span>
              <span className={styles.flowStep}>ledger answer or AI-assisted candidate</span>
              <span className={styles.flowStep}>human review queue</span>
              <span className={styles.flowStep}>optional public contribution</span>
              <span className={styles.flowStep}>optional later revision</span>
            </div>

            <div className={styles.workspaceMeta}>
              <span>Current topic hard-gate: healthcare / topic-001</span>
              <span>No room expansion</span>
              <span>No static card creation</span>
              <span>No automatic public ledger writes</span>
            </div>
          </section>

          <AskInterface
            candidateIntakeEnabled={askDeployment.candidateIntakeEnabled}
            initialCandidate={
              initialCandidate
                ? {
                    ...initialCandidate,
                    actualCardChange: false,
                    publicSubmission: false,
                  }
                : null
            }
            initialMessages={initialMessages}
            initialReadOnly={initialReadOnly}
            prototypeReadOnlyNotice={askDeployment.notice}
            topic={{
              roomId,
              topicId,
              topicTitle: topic.title,
            }}
            workspaceMode
          />
        </section>
      </main>
    </div>
  );
}
