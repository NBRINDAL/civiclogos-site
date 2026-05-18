"use client";

import Link from "next/link";
import { useState } from "react";
import { healthcareIssueRoom, proposal001 } from "../lib/civic-logos";
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

const starterPrompts = [
  "What is the current synthesis?",
  "Which topic is most developed right now?",
  "What are the strongest objections?",
  "What evidence is carrying the most weight?",
  "Who is most affected by these choices?",
  "What would move the room forward?",
] as const;

function buildDefaultAnswer(): RoomAnswer {
  return {
    title: "Ask the room, not a blank chatbot",
    intro:
      "This early guide reads from the current healthcare room. It can summarize where the room leans, surface objections, point to topic families, and show where the uncertainty still lives.",
    bullets: [
      "Ask for the current synthesis if you want the room-level view.",
      "Ask about the administrative simplification topic if you want the most developed seed card.",
      "Ask about objections, evidence, stakeholders, or what could move the synthesis.",
    ],
    sources: [
      "Current living synthesis",
      "Topic field",
      "Evidence library",
      "Objection library",
    ],
    ctaHref: "/healthcare/proposal-001",
    ctaLabel: "Open topic card",
  };
}

function buildAnswer(question: string): RoomAnswer {
  const normalized = question.toLowerCase();

  if (
    normalized.includes("proposal") ||
    normalized.includes("001") ||
    normalized.includes("triage") ||
    normalized.includes("administrative")
  ) {
    return {
      title: "Most developed topic in the room",
      intro:
        "Administrative simplification and AI-assisted triage is currently the clearest demonstration object because it narrows the healthcare debate to one testable reform path instead of trying to solve everything at once.",
      bullets: [
        proposal001.currentRead,
        proposal001.strongestSupport,
        `Main open question: ${proposal001.openQuestions[0]}`,
      ],
      sources: ["Topic card current read", "Strongest support", "Open questions"],
      ctaHref: "/healthcare/proposal-001",
      ctaLabel: "Open the full topic card",
    };
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
        "Right now the room leans most heavily on administrative-cost evidence, coverage data, and edge-case access evidence like rural hospital resilience.",
      bullets: healthcareIssueRoom.evidenceLibrary.map(
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
        "The room is already surfacing a few recurring pressure points that any serious healthcare synthesis will have to survive.",
      bullets: healthcareIssueRoom.objectionLibrary,
      sources: ["Objection library", "Topic card risk surface"],
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
        "The room is trying to make clear that healthcare reform is not one tradeoff but a stack of overlapping burdens and benefits across different groups.",
      bullets: [
        `Core stakeholders: ${healthcareIssueRoom.stakeholders.slice(0, 5).join(", ")}.`,
        healthcareIssueRoom.perspectives[0].thesis,
        healthcareIssueRoom.perspectives[1].thesis,
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
        "The next useful step is not more generic discussion. It is better evidence that changes the shape of the current uncertainty.",
      bullets: healthcareIssueRoom.whatCouldMoveTheRoom,
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
        "The room is intentionally keeping the unresolved parts visible instead of smoothing them over with a clean narrative.",
      bullets: healthcareIssueRoom.openQuestions,
      sources: ["Open questions"],
    };
  }

  if (
    normalized.includes("why healthcare") ||
    normalized.includes("why start") ||
    normalized.includes("why this issue") ||
    normalized.includes("first issue")
  ) {
    return {
      title: "Why healthcare is the first issue room",
      intro: healthcareIssueRoom.whyItMatters,
      bullets: [
        healthcareIssueRoom.narrative[0],
        healthcareIssueRoom.workingConclusions[0],
      ],
      sources: ["Why healthcare first", "Room narrative"],
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
      intro: healthcareIssueRoom.currentSynthesis,
      bullets: healthcareIssueRoom.workingConclusions,
      sources: ["Current living synthesis", "Where the room currently leans"],
    };
  }

  return {
    title: "Best current read",
    intro:
      "The room can already answer in a few grounded ways: it can summarize the current synthesis, compare topic families, surface objections, and point to what evidence would actually change the room.",
    bullets: [
      "Try asking about the current synthesis, administrative simplification, objections, evidence, stakeholders, or what could move the room.",
      `The most developed topic card right now is ${proposal001.title}.`,
      `The room is still openly uncertain about transition cost, rural access, and long-run household impact.`,
    ],
    sources: ["Current synthesis", "Topic field", "Open questions"],
    ctaHref: "/healthcare/proposal-001",
    ctaLabel: "Open topic card",
  };
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function RoomGuide() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: createId(), role: "assistant", answer: buildDefaultAnswer() },
  ]);

  function submitQuestion(question: string) {
    const trimmed = question.trim();

    if (!trimmed) {
      return;
    }

    setMessages((current) => [
      ...current,
      { id: createId(), role: "user", text: trimmed },
      { id: createId(), role: "assistant", answer: buildAnswer(trimmed) },
    ]);
    setInput("");
  }

  return (
    <section className={styles.shell} aria-labelledby="ask-room-title">
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Ask this room</span>
          <h2 id="ask-room-title">
            The first conversational layer should explain the room, not replace it.
          </h2>
          <p>
            This is an early guide grounded in the room&apos;s current public
            structure. It can summarize the healthcare synthesis, point to the
            most developed topic card, surface objections, and show what evidence
            could actually change the room.
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
          the administrative simplification topic
        </label>
        <div className={styles.composerRow}>
          <input
            className={styles.input}
            id="room-question"
            onChange={(event) => setInput(event.target.value)}
            placeholder="What are the strongest objections right now?"
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
