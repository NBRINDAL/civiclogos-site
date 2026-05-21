"use client";

import Link from "next/link";
import { useState } from "react";
import type { IssueRoomData, ProposalSummary } from "../lib/civic-logos";
import styles from "./room-guide.module.css";

type RoomAnswer = {
  title: string;
  intro: string;
  bullets: readonly string[];
  sources: readonly string[];
  ctaHref?: string;
  ctaLabel?: string;
};

type ChatMessage =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; answer: RoomAnswer };

type RoomGuideProps = {
  room: IssueRoomData;
  roomHref: string;
  inspectableTopics: readonly ProposalSummary[];
  sectionId?: string;
};

const starterPrompts = [
  "What is the current synthesis?",
  "Which topic is most developed right now?",
  "What are the strongest objections?",
  "What evidence is carrying the most weight?",
  "Who is most affected by these choices?",
  "What would move the room forward?",
] as const;

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildDefaultAnswer(
  room: IssueRoomData,
  inspectableTopics: readonly ProposalSummary[],
): RoomAnswer {
  const firstLiveCard = inspectableTopics[0];

  return {
    title: "Ask the room, not a blank chatbot",
    intro: `This early guide reads from the current ${room.title.toLowerCase()} room. It can summarize where the room leans, surface objections, point to live topic cards, and show where the uncertainty still lives.`,
    bullets: [
      "Ask for the current synthesis if you want the room-level view.",
      firstLiveCard
        ? `Ask which topic is most developed if you want the clearest live object in the room: ${firstLiveCard.title}.`
        : "Ask which topic is most developed if you want the clearest live object in the room.",
      "Ask about objections, evidence, stakeholders, or what could move the synthesis.",
    ],
    sources: [
      "Current living synthesis",
      "Topic field",
      "Evidence library",
      "Objection library",
    ],
    ctaHref: firstLiveCard?.href,
    ctaLabel: firstLiveCard ? "Open first live card" : undefined,
  };
}

function buildAnswer(
  question: string,
  room: IssueRoomData,
  roomHref: string,
  inspectableTopics: readonly ProposalSummary[],
): RoomAnswer {
  const normalized = question.toLowerCase();
  const firstLiveCard = inspectableTopics[0];

  if (
    normalized.includes("topic") ||
    normalized.includes("card") ||
    normalized.includes("developed") ||
    normalized.includes("most detailed") ||
    normalized.includes("most developed")
  ) {
    if (firstLiveCard) {
      return {
        title: "Most developed live topic",
        intro:
          "The room currently has one topic card doing the most structural work. It is the easiest way to move from room framing into one inspectable line of reasoning.",
        bullets: [
          `${firstLiveCard.title}: ${firstLiveCard.summary}`,
          `Current signal: ${firstLiveCard.metric}.`,
          `The room now has ${inspectableTopics.length} live topic card${
            inspectableTopics.length === 1 ? "" : "s"
          } in view.`,
        ],
        sources: ["Inspectable card layer", "Topic field"],
        ctaHref: firstLiveCard.href,
        ctaLabel: "Open the live topic card",
      };
    }
  }

  if (
    normalized.includes("evidence") ||
    normalized.includes("data") ||
    normalized.includes("proof") ||
    normalized.includes("supporting")
  ) {
    return {
      title: "What evidence is currently doing the most work",
      intro:
        "Right now the room leans on a small set of evidence-bearing materials. They do not settle the room, but they are carrying the current structure.",
      bullets: room.evidenceLibrary.map(
        (item) => `${item.title}: ${item.note}`,
      ),
      sources: ["Evidence library"],
    };
  }

  if (
    normalized.includes("objection") ||
    normalized.includes("risk") ||
    normalized.includes("critic") ||
    normalized.includes("failure") ||
    normalized.includes("wrong")
  ) {
    return {
      title: "Strongest visible objections",
      intro:
        "The room already has a few recurring pressure points that any serious synthesis will have to survive.",
      bullets: room.objectionLibrary,
      sources: ["Objection library", "Topic-card risk surfaces"],
    };
  }

  if (
    normalized.includes("stakeholder") ||
    normalized.includes("affected") ||
    normalized.includes("benefit") ||
    normalized.includes("pay") ||
    normalized.includes("who")
  ) {
    return {
      title: "Who is inside the blast radius",
      intro:
        "The room is trying to keep clear that this is not one tradeoff. Different groups bear different burdens, risks, and upside.",
      bullets: [
        `Core stakeholders: ${room.stakeholders.slice(0, 5).join(", ")}.`,
        room.perspectives[0]?.thesis ?? "The room keeps public-facing perspectives visible.",
        room.perspectives[1]?.thesis ?? "More perspectives are seeded as the room deepens.",
      ],
      sources: ["Stakeholder set", "Public perspectives"],
    };
  }

  if (
    normalized.includes("move") ||
    normalized.includes("change") ||
    normalized.includes("forward") ||
    normalized.includes("update") ||
    normalized.includes("improve")
  ) {
    return {
      title: "What would move the room forward",
      intro:
        "The next useful step is not more generic discussion. It is better evidence or clearer structuring that changes the shape of the current uncertainty.",
      bullets: room.whatCouldMoveTheRoom,
      sources: ["What could move the room"],
    };
  }

  if (
    normalized.includes("question") ||
    normalized.includes("uncertain") ||
    normalized.includes("unknown") ||
    normalized.includes("not know")
  ) {
    return {
      title: "Where the uncertainty still lives",
      intro:
        "The room is intentionally keeping unresolved questions visible instead of smoothing them over with a clean narrative.",
      bullets: room.openQuestions,
      sources: ["Open questions"],
    };
  }

  if (
    normalized.includes("why this room") ||
    normalized.includes("why start") ||
    normalized.includes("why this issue") ||
    normalized.includes("why ")
  ) {
    return {
      title: "Why this room exists",
      intro: room.whyItMatters,
      bullets: [room.narrative[0], room.workingConclusions[0]],
      sources: ["Why this room matters", "Room narrative"],
      ctaHref: roomHref,
      ctaLabel: "Return to room overview",
    };
  }

  if (
    normalized.includes("summary") ||
    normalized.includes("synthesis") ||
    normalized.includes("room") ||
    normalized.includes("where")
  ) {
    return {
      title: "Current synthesis",
      intro: room.currentSynthesis,
      bullets: room.workingConclusions,
      sources: ["Current living synthesis", "Where the room currently leans"],
    };
  }

  return {
    title: "Best current read",
    intro:
      "The room can already answer in a few grounded ways: it can summarize the current synthesis, compare topic families, surface objections, and point to what evidence would actually change the room.",
    bullets: [
      "Try asking about the current synthesis, live topic cards, objections, evidence, stakeholders, or what could move the room.",
      firstLiveCard
        ? `The clearest live card right now is ${firstLiveCard.title}.`
        : "The room is still mostly operating at the room-framing level.",
      `The room is still openly uncertain about ${room.openQuestions[0]?.toLowerCase() ?? "several unresolved structural questions"}.`,
    ],
    sources: ["Current synthesis", "Topic field", "Open questions"],
    ctaHref: firstLiveCard?.href ?? roomHref,
    ctaLabel: firstLiveCard ? "Open first live card" : "Return to room",
  };
}

export default function RoomGuide({
  room,
  roomHref,
  inspectableTopics,
  sectionId,
}: RoomGuideProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createId(),
      role: "assistant",
      answer: buildDefaultAnswer(room, inspectableTopics),
    },
  ]);

  function submitQuestion(question: string) {
    const trimmed = question.trim();

    if (!trimmed) {
      return;
    }

    setMessages((current) => [
      ...current,
      { id: createId(), role: "user", text: trimmed },
      {
        id: createId(),
        role: "assistant",
        answer: buildAnswer(trimmed, room, roomHref, inspectableTopics),
      },
    ]);
    setInput("");
  }

  return (
    <section className={styles.shell} id={sectionId} aria-labelledby="ask-room-title">
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Ask this room</span>
          <h2 id="ask-room-title">
            The first conversational layer should explain the room, not replace it.
          </h2>
          <p>
            This is an early guide grounded in the room&apos;s current public
            structure. It can summarize the synthesis, point to live topic
            cards, surface objections, and show what evidence could actually
            change the room.
          </p>
        </div>
      </div>

      <div className={styles.promptRow}>
        {starterPrompts.map((prompt) => (
          <button
            className={styles.promptChip}
            key={prompt}
            onClick={() => submitQuestion(prompt)}
            type="button"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className={styles.messageList}>
        {messages.map((message) =>
          message.role === "user" ? (
            <article className={styles.userMessage} key={message.id}>
              <span className={styles.messageLabel}>You asked</span>
              <p>{message.text}</p>
            </article>
          ) : (
            <article className={styles.answerCard} key={message.id}>
              <span className={styles.messageLabel}>Room guide</span>
              <h3>{message.answer.title}</h3>
              <p className={styles.answerIntro}>{message.answer.intro}</p>

              <ul className={styles.answerList}>
                {message.answer.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <div className={styles.answerFooter}>
                <p>
                  <strong>Grounded in:</strong> {message.answer.sources.join(", ")}
                </p>

                {message.answer.ctaHref && message.answer.ctaLabel ? (
                  <Link className={styles.answerLink} href={message.answer.ctaHref}>
                    {message.answer.ctaLabel}
                  </Link>
                ) : null}
              </div>
            </article>
          ),
        )}
      </div>

      <form
        className={styles.composer}
        onSubmit={(event) => {
          event.preventDefault();
          submitQuestion(input);
        }}
      >
        <label className={styles.composerLabel} htmlFor="room-question">
          Ask about the current synthesis, evidence, objections, stakeholders, or
          the strongest live topic card
        </label>
        <div className={styles.composerRow}>
          <input
            className={styles.input}
            id="room-question"
            onChange={(event) => setInput(event.target.value)}
            placeholder="What would move the room forward right now?"
            type="text"
            value={input}
          />
          <button className={styles.submitButton} type="submit">
            Ask the room
          </button>
        </div>
      </form>
    </section>
  );
}
