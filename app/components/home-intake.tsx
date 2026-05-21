"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import styles from "./home-intake.module.css";

type HomeIntakeResponse = {
  destinationHref?: string;
  destinationKind?: "existing-room" | "new-room-draft";
  roomTitle?: string;
  topicTitle?: string;
  fitSummary?: string;
  error?: string;
};

const suggestedPrompts = [
  "How do we separate healthcare from employment without wrecking provider stability?",
  "Does AI make public truth-seeking better or mostly easier to manipulate?",
  "What would actually restore institutional trust after repeated correction failures?",
] as const;

export default function HomeIntake() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSuggestedPrompt(nextPrompt: string) {
    setPrompt(nextPrompt);
    setErrorMessage("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!prompt.trim()) {
      setErrorMessage("Enter a question or idea first.");
      return;
    }

    setErrorMessage("");
    setStatusMessage("Routing this idea through the current room map…");

    startTransition(async () => {
      try {
        const response = await fetch("/api/ai/intake", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            website: "",
          }),
        });

        const payload = (await response.json()) as HomeIntakeResponse;

        if (!response.ok || !payload.destinationHref) {
          throw new Error(
            payload.error ??
              "The intake engine could not place this idea right now.",
          );
        }

        setStatusMessage(
          payload.destinationKind === "existing-room"
            ? `Opening ${payload.roomTitle ?? "the best current room"}…`
            : "Opening a provisional new-room draft…",
        );

        router.push(payload.destinationHref);
      } catch (error) {
        setStatusMessage("");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "The intake engine could not place this idea right now.",
        );
      }
    });
  }

  return (
    <section className={styles.panel} aria-labelledby="home-intake-heading">
      <div className={styles.header}>
        <span className={styles.eyebrow}>Open reasoning path</span>
        <h2 id="home-intake-heading">
          Start with a real question and let the room map decide where it belongs.
        </h2>
        <p>
          Civic Logos will try to place the idea inside the closest current room.
          If none of the current rooms fit, it will open a provisional new-room
          draft instead of pretending the fit is cleaner than it is.
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span>Question or idea</span>
          <textarea
            maxLength={3000}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Type a public question, institutional problem, or new room idea."
            rows={6}
            value={prompt}
          />
        </label>

        <div className={styles.suggestedRow}>
          {suggestedPrompts.map((item) => (
            <button
              className={styles.suggestedPrompt}
              key={item}
              onClick={() => handleSuggestedPrompt(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>

        <div className={styles.footer}>
          <button className={styles.submitButton} disabled={isPending} type="submit">
            {isPending ? "Routing…" : "Open reasoning path"}
          </button>
          <p className={styles.help}>
            This is the first public intake layer. It routes into rooms and topic
            directions instead of dropping ideas into a blank feed.
          </p>
        </div>

        {statusMessage ? (
          <div className={styles.successState} role="status">
            <p>{statusMessage}</p>
          </div>
        ) : null}

        {errorMessage ? (
          <div className={styles.errorState} role="alert">
            <p>{errorMessage}</p>
          </div>
        ) : null}
      </form>
    </section>
  );
}
