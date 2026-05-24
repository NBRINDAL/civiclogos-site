"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type {
  HomeIntakePromotionReview,
  HomeIntakePromotionStatus,
  HomeIntakeRouteKind,
} from "../lib/home-intake-types";
import styles from "./intake-promotion-review-form.module.css";

type IntakePromotionReviewFormProps = {
  entryId: string;
  routeKind?: HomeIntakeRouteKind;
  existingReview?: HomeIntakePromotionReview;
  suggestedTitle?: string;
  suggestedQuestion?: string;
  suggestedSynthesis?: string;
};

type PromotionReviewResponse = {
  error?: string;
  message?: string;
};

const defaultGuardrailNote =
  "This promotion establishes a neutral baseline only. Founder theories, alternate models, and synthesis pressure must enter later through contribution records with AI-assisted review and human incorporation.";

const baseStatuses = [
  {
    value: "held",
    label: "Hold for more prompt pressure",
  },
  {
    value: "merged_into_existing_room",
    label: "Merge into existing room",
  },
  {
    value: "rejected",
    label: "Reject as a live candidate",
  },
  {
    value: "promoted",
    label: "Already promoted",
  },
] as const satisfies ReadonlyArray<{
  value: HomeIntakePromotionStatus;
  label: string;
}>;

function getStatusOptions(routeKind?: HomeIntakeRouteKind) {
  const readyStatus =
    routeKind === "room-topic-draft"
      ? ({
          value: "ready_for_live_topic",
          label: "Ready for live topic shell",
        } as const)
      : ({
          value: "ready_for_live_room",
          label: "Ready for live room shell",
        } as const);

  return [baseStatuses[0], readyStatus, ...baseStatuses.slice(1)];
}

function requiresNeutralBaseline(status: HomeIntakePromotionStatus) {
  return status === "ready_for_live_room" || status === "ready_for_live_topic";
}

export default function IntakePromotionReviewForm({
  entryId,
  routeKind,
  existingReview,
  suggestedTitle = "",
  suggestedQuestion = "",
  suggestedSynthesis = "",
}: IntakePromotionReviewFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<HomeIntakePromotionStatus>(
    existingReview?.status ?? "held",
  );
  const [maintainerKey, setMaintainerKey] = useState("");
  const [reviewerLabel, setReviewerLabel] = useState(
    existingReview?.reviewerLabel ?? "Founder-maintainer",
  );
  const [neutralBaselineTitle, setNeutralBaselineTitle] = useState(
    existingReview?.neutralBaselineTitle ?? suggestedTitle,
  );
  const [neutralBaselineQuestion, setNeutralBaselineQuestion] = useState(
    existingReview?.neutralBaselineQuestion ?? suggestedQuestion,
  );
  const [neutralBaselineSynthesis, setNeutralBaselineSynthesis] = useState(
    existingReview?.neutralBaselineSynthesis ?? suggestedSynthesis,
  );
  const [guardrailNote, setGuardrailNote] = useState(
    existingReview?.guardrailNote ?? defaultGuardrailNote,
  );
  const [reviewerNote, setReviewerNote] = useState(
    existingReview?.reviewerNote ?? "",
  );
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const neutralBaselineRequired = requiresNeutralBaseline(status);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setStatusMessage("");

    if (neutralBaselineRequired) {
      const confirmed = window.confirm(
        "This will mark the intake artifact as ready for a live neutral room/topic shell. It will not create the live topic or endorse any later theory. Continue?",
      );

      if (!confirmed) {
        return;
      }
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/intake/${entryId}/review`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            maintainerKey,
            reviewerLabel,
            neutralBaselineTitle,
            neutralBaselineQuestion,
            neutralBaselineSynthesis,
            guardrailNote,
            reviewerNote,
          }),
        });

        const payload = (await response.json()) as PromotionReviewResponse;

        if (!response.ok) {
          throw new Error(payload.error ?? "Promotion review could not be saved.");
        }

        setStatusMessage(payload.message ?? "Promotion review saved.");
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Promotion review could not be saved.",
        );
      }
    });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.grid}>
        <label className={styles.field}>
          <span>Promotion status</span>
          <select
            onChange={(event) =>
              setStatus(event.target.value as HomeIntakePromotionStatus)
            }
            value={status}
          >
            {getStatusOptions(routeKind).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>Reviewer label</span>
          <input
            onChange={(event) => setReviewerLabel(event.target.value)}
            placeholder="Founder-maintainer"
            value={reviewerLabel}
          />
        </label>
      </div>

      <label className={styles.field}>
        <span>Maintainer key</span>
        <input
          autoComplete="current-password"
          onChange={(event) => setMaintainerKey(event.target.value)}
          placeholder="Required before this can alter promotion state"
          type="password"
          value={maintainerKey}
        />
      </label>

      <label className={styles.field}>
        <span>Neutral baseline title</span>
        <input
          onChange={(event) => setNeutralBaselineTitle(event.target.value)}
          placeholder="Short live room/topic title"
          value={neutralBaselineTitle}
        />
      </label>

      <label className={styles.field}>
        <span>Neutral baseline question</span>
        <textarea
          onChange={(event) => setNeutralBaselineQuestion(event.target.value)}
          placeholder="The neutral question this live shell would hold."
          rows={3}
          value={neutralBaselineQuestion}
        />
      </label>

      <label className={styles.field}>
        <span>Neutral baseline synthesis</span>
        <textarea
          onChange={(event) => setNeutralBaselineSynthesis(event.target.value)}
          placeholder="A non-advocacy baseline that can later receive contribution pressure."
          rows={5}
          value={neutralBaselineSynthesis}
        />
      </label>

      <label className={styles.field}>
        <span>Guardrail note</span>
        <textarea
          onChange={(event) => setGuardrailNote(event.target.value)}
          placeholder={defaultGuardrailNote}
          rows={4}
          value={guardrailNote}
        />
      </label>

      <label className={styles.field}>
        <span>Reviewer note</span>
        <textarea
          onChange={(event) => setReviewerNote(event.target.value)}
          placeholder="Explain why this candidate is being held, rejected, merged, or marked ready."
          rows={4}
          value={reviewerNote}
        />
      </label>

      {neutralBaselineRequired ? (
        <p className={styles.warning}>
          Ready status requires a neutral baseline package. This is a map
          promotion decision, not a synthesis endorsement and not a public
          contribution record.
        </p>
      ) : null}

      <div className={styles.footer}>
        <button className={styles.submitButton} disabled={isPending} type="submit">
          {isPending ? "Saving review..." : "Save promotion review"}
        </button>
        <p>
          Later live topic creation should cite this intake artifact instead of
          appearing as a silent room expansion.
        </p>
      </div>

      {statusMessage ? (
        <div className={styles.successState} role="status">
          {statusMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className={styles.errorState} role="alert">
          {errorMessage}
        </div>
      ) : null}
    </form>
  );
}
