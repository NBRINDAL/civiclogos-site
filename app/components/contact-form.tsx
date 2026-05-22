"use client";

import { FormEvent, useState } from "react";
import styles from "./contact-form.module.css";

type ContactValues = {
  name: string;
  email: string;
  interest: string;
  expertise: string;
  message: string;
  website: string;
};

const initialValues: ContactValues = {
  name: "",
  email: "",
  interest: "Early access",
  expertise: "",
  message: "",
  website: "",
};

const allowedInterests = new Set([
  "Early access",
  "Offering expertise",
  "Healthcare issue room",
  "Institutional pilot",
  "General inquiry",
]);

type SubmissionState = {
  tone: "idle" | "success" | "error";
  message: string;
};

const initialState: SubmissionState = {
  tone: "idle",
  message: "",
};

type ContactContextFact = {
  label: string;
  value: string;
};

export function ContactForm({
  initialInterest,
  initialMessage,
  initialContextTitle,
  initialContextNote,
  initialContextFacts = [],
  initialContextHref,
}: {
  initialInterest?: string;
  initialMessage?: string;
  initialContextTitle?: string;
  initialContextNote?: string;
  initialContextFacts?: ContactContextFact[];
  initialContextHref?: string;
}) {
  const seededInterest =
    initialInterest && allowedInterests.has(initialInterest)
      ? initialInterest
      : initialValues.interest;
  const seededMessage = initialMessage?.trim() || initialValues.message;
  const seededValues: ContactValues = {
    ...initialValues,
    interest: seededInterest,
    message: seededMessage,
  };
  const [values, setValues] = useState<ContactValues>(seededValues);
  const [submission, setSubmission] = useState<SubmissionState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isInstitutionalPilot = values.interest === "Institutional pilot";

  function updateValue<Key extends keyof ContactValues>(
    key: Key,
    value: ContactValues[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmission(initialState);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;

      if (!response.ok) {
        setSubmission({
          tone: "error",
          message:
            payload?.error ??
            "The form could not be sent just yet. Please try again in a moment.",
        });
        return;
      }

      setValues(seededValues);
      setSubmission({
        tone: "success",
        message:
          payload?.message ??
          "Thanks. Your note is on its way to the Civic Logos inbox.",
      });
    } catch {
      setSubmission({
        tone: "error",
        message:
          "The request did not go through. Please check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {initialContextTitle ? (
        <div className={styles.contextPanel}>
          <div className={styles.contextHeader}>
            <span className={styles.contextLabel}>
              {isInstitutionalPilot ? "Institutional pilot context" : "Inquiry context"}
            </span>
            <h3>{initialContextTitle}</h3>
          </div>
          {initialContextNote ? <p className={styles.contextNote}>{initialContextNote}</p> : null}
          {initialContextFacts.length ? (
            <dl className={styles.contextFacts}>
              {initialContextFacts.map((item) => (
                <div className={styles.contextFact} key={`${item.label}-${item.value}`}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <div className={styles.contextLinks}>
            {initialContextHref ? (
              <a className={styles.contextLink} href={initialContextHref}>
                Open current topic card
              </a>
            ) : null}
            {isInstitutionalPilot ? (
              <span className={styles.contextTrustNote}>
                Paying funds review capacity, not authority over the synthesis.
              </span>
            ) : null}
          </div>
        </div>
      ) : isInstitutionalPilot ? (
        <div className={styles.contextPanel}>
          <div className={styles.contextHeader}>
            <span className={styles.contextLabel}>Institutional pilot context</span>
            <h3>Public review comes before favorable conclusions.</h3>
          </div>
          <p className={styles.contextNote}>
            This path is for funding review capacity, evidence work, and synthesis labor.
            It does not buy legitimacy, favorable scoring, or quiet outcomes.
          </p>
        </div>
      ) : null}

      <div className={styles.grid}>
        <label className={styles.field}>
          <span>Name</span>
          <input
            autoComplete="name"
            name="name"
            onChange={(event) => updateValue("name", event.target.value)}
            placeholder="Your name"
            required
            value={values.name}
          />
        </label>

        <label className={styles.field}>
          <span>Email</span>
          <input
            autoComplete="email"
            name="email"
            onChange={(event) => updateValue("email", event.target.value)}
            placeholder="you@company.com"
            required
            type="email"
            value={values.email}
          />
        </label>
      </div>

      <div className={styles.grid}>
        <label className={styles.field}>
          <span>I am reaching out about</span>
          <select
            name="interest"
            onChange={(event) => updateValue("interest", event.target.value)}
            value={values.interest}
          >
            <option>Early access</option>
            <option>Offering expertise</option>
            <option>Healthcare issue room</option>
            <option>Institutional pilot</option>
            <option>General inquiry</option>
          </select>
        </label>

        <label className={styles.field}>
          <span>Relevant expertise</span>
          <input
            name="expertise"
            onChange={(event) => updateValue("expertise", event.target.value)}
            placeholder="Policy, healthcare, design, product, research..."
            value={values.expertise}
          />
        </label>
      </div>

      <label className={styles.field}>
        <span>Message</span>
        <textarea
          name="message"
          onChange={(event) => updateValue("message", event.target.value)}
          placeholder="Tell us how you'd like to follow, test, contribute, or help."
          required
          rows={5}
          value={values.message}
        />
      </label>

      <label className={styles.honeypot} aria-hidden="true">
        <span>Website</span>
        <input
          autoComplete="off"
          name="website"
          onChange={(event) => updateValue("website", event.target.value)}
          tabIndex={-1}
          value={values.website}
        />
      </label>

      <div className={styles.actions}>
        <button className={styles.primaryButton} disabled={isSubmitting} type="submit">
          {isSubmitting
            ? "Sending..."
            : isInstitutionalPilot
              ? "Request institutional review pilot"
              : "Request early access"}
        </button>
        <p className={styles.helper}>
          Messages go to <a href="mailto:hello@civiclogos.com">hello@civiclogos.com</a>.
        </p>
      </div>

      {submission.message ? (
        <p
          className={
            submission.tone === "success" ? styles.successMessage : styles.errorMessage
          }
          role={submission.tone === "error" ? "alert" : "status"}
        >
          {submission.message}
        </p>
      ) : null}
    </form>
  );
}
