"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

type PreviewState = {
  assignedToKind: string;
  assignedToLabel: string;
  changedSynthesis: string;
  decisionReason: string;
  publicRecordNote: string;
  revisionSummary: string;
  reviewerNote: string;
  status: string;
  synthesisUpdate: string;
};

type PublicRecordConfirmationPreviewProps = {
  aiGateOpen: boolean;
  oldVisibleSynthesis: string;
  originLabel: string;
  nextVersionLabel: string;
  confirmationPhrase: string;
};

function getFormState(form: HTMLFormElement): PreviewState {
  const formData = new FormData(form);
  const read = (key: string) => String(formData.get(key) ?? "").trim();

  return {
    assignedToKind: read("assignedToKind"),
    assignedToLabel: read("assignedToLabel"),
    changedSynthesis: read("changedSynthesis"),
    decisionReason: read("decisionReason"),
    publicRecordNote: read("publicRecordNote"),
    revisionSummary: read("revisionSummary"),
    reviewerNote: read("reviewerNote"),
    status: read("status"),
    synthesisUpdate: read("synthesisUpdate"),
  };
}

function getAffectedLayers(state: PreviewState) {
  const layers = ["Recent Contributions / Ledger", "Review Cycle"];

  if (state.changedSynthesis === "yes") {
    layers.push("Changed-card records", "Revision Trace");
  }

  if (state.synthesisUpdate) {
    layers.push("Current visible synthesis");
  }

  if (state.assignedToKind === "evidence") {
    layers.push("Evidence layer");
  } else if (state.assignedToKind === "assumption") {
    layers.push("Assumption layer");
  } else if (state.assignedToKind === "objection") {
    layers.push("Objection layer");
  } else if (state.assignedToKind === "open-question") {
    layers.push("Open-question layer");
  }

  return [...new Set(layers)];
}

export default function PublicRecordConfirmationPreview({
  aiGateOpen,
  confirmationPhrase,
  nextVersionLabel,
  oldVisibleSynthesis,
  originLabel,
}: PublicRecordConfirmationPreviewProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<PreviewState>({
    assignedToKind: "",
    assignedToLabel: "",
    changedSynthesis: "",
    decisionReason: "",
    publicRecordNote: "",
    revisionSummary: "",
    reviewerNote: "",
    status: "",
    synthesisUpdate: "",
  });
  const [clientWarning, setClientWarning] = useState("");

  useEffect(() => {
    const form = rootRef.current?.closest("form");

    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    const refreshState = () => setState(getFormState(form));
    const validateBeforeSubmit = (event: SubmitEvent) => {
      const nextState = getFormState(form);
      const confirmation = String(
        new FormData(form).get("publicRecordConfirmation") ?? "",
      ).trim();
      const attemptsPublicRecordChange =
        nextState.status === "incorporated" &&
        nextState.changedSynthesis === "yes";

      if (!attemptsPublicRecordChange) {
        setClientWarning("");
        return;
      }

      const missing = [
        !aiGateOpen ? "completed AI reader validation" : "",
        !nextState.publicRecordNote ? "public record note" : "",
        !nextState.revisionSummary ? "revision summary" : "",
        !nextState.synthesisUpdate ? "proposed new synthesis" : "",
        confirmation !== confirmationPhrase ? "exact confirmation phrase" : "",
      ].filter(Boolean);

      if (missing.length) {
        event.preventDefault();
        setClientWarning(
          `Public-record change blocked in the browser preview. Missing: ${missing.join(
            ", ",
          )}.`,
        );
      }
    };

    refreshState();
    form.addEventListener("input", refreshState);
    form.addEventListener("change", refreshState);
    form.addEventListener("submit", validateBeforeSubmit);

    return () => {
      form.removeEventListener("input", refreshState);
      form.removeEventListener("change", refreshState);
      form.removeEventListener("submit", validateBeforeSubmit);
    };
  }, [aiGateOpen, confirmationPhrase]);

  const attemptsPublicRecordChange =
    state.status === "incorporated" && state.changedSynthesis === "yes";
  const affectedLayers = getAffectedLayers(state);

  return (
    <section className={styles.publicRecordPreview} ref={rootRef}>
      <span className={styles.eyebrow}>Public-record confirmation preview</span>
      <h4>Review the public reasoning event before incorporation.</h4>
      <p>
        This preview is for founder-maintainer revisions only. Corrections should
        be additive: if this event later needs repair, create a new correction
        revision instead of overwriting the original public-record event.
      </p>

      <div className={styles.previewGrid}>
        <div>
          <strong>Old visible synthesis</strong>
          <p>{oldVisibleSynthesis}</p>
        </div>
        <div>
          <strong>Proposed new synthesis</strong>
          <p>{state.synthesisUpdate || "No proposed synthesis entered yet."}</p>
        </div>
        <div>
          <strong>Origin</strong>
          <p>{originLabel}</p>
        </div>
        <div>
          <strong>Status</strong>
          <p>{state.status || "Not selected"}</p>
        </div>
        <div>
          <strong>Attachment targets</strong>
          <p>
            {[state.assignedToKind, state.assignedToLabel].filter(Boolean).join(" - ") ||
              "Not assigned yet"}
          </p>
        </div>
        <div>
          <strong>Next version label</strong>
          <p>{attemptsPublicRecordChange ? nextVersionLabel : "No version change yet"}</p>
        </div>
      </div>

      <dl className={styles.previewFacts}>
        <div>
          <dt>Public record note</dt>
          <dd>{state.publicRecordNote || "Required before incorporation."}</dd>
        </div>
        <div>
          <dt>Decision reason</dt>
          <dd>{state.decisionReason || "Not entered yet."}</dd>
        </div>
        <div>
          <dt>Revision summary</dt>
          <dd>{state.revisionSummary || "Required before incorporation."}</dd>
        </div>
        <div>
          <dt>Affected visible layers</dt>
          <dd>{affectedLayers.join(", ")}</dd>
        </div>
        <div>
          <dt>Expected count changes</dt>
          <dd>
            {attemptsPublicRecordChange
              ? "Changed-card records +1; Revision trace +1; Outside public submissions +0."
              : "No public-record count change unless incorporated with actual card change yes."}
          </dd>
        </div>
        <div>
          <dt>AI gate</dt>
          <dd>{aiGateOpen ? "Open: at least one AI reader completed." : "Blocked: no completed AI reader yet."}</dd>
        </div>
      </dl>

      <label className={styles.field}>
        <span>Required confirmation phrase</span>
        <input
          name="publicRecordConfirmation"
          placeholder={confirmationPhrase}
        />
      </label>

      {clientWarning ? <p className={styles.guardWarning}>{clientWarning}</p> : null}
    </section>
  );
}
