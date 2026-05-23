"use client";

import { FormEvent, useState } from "react";
import type {
  InstitutionalInquiryContextFact,
  InstitutionalInquiryContextLink,
} from "../lib/institutional-inquiry-context";
import styles from "./contact-form.module.css";

type InstitutionalInquiryValues = {
  name: string;
  email: string;
  organization: string;
  roleTitle: string;
  organizationType: string;
  roomPreference: string;
  issueQuestion: string;
  urgencyTimeline: string;
  budgetRange: string;
  successCriteria: string;
  website: string;
};

type SubmissionState = {
  tone: "idle" | "success" | "error";
  message: string;
};

const budgetOptions = [
  "Under $2,500",
  "$2,500–$10,000",
  "$10,000–$25,000",
  "$25,000–$50,000",
  "$50,000+",
  "Not sure yet",
] as const;

const organizationTypeOptions = [
  "Government agency",
  "University or research institution",
  "Nonprofit or public-interest group",
  "Company or employer",
  "Foundation or philanthropy",
  "Newsroom or media organization",
  "Trade association or coalition",
  "Other",
] as const;

const roomPreferenceOptions = [
  "Public room",
  "Private room",
  "Not sure yet",
] as const;

const initialSubmissionState: SubmissionState = {
  tone: "idle",
  message: "",
};

export function InstitutionalInquiryForm({
  initialIssueQuestion,
  contextTitle,
  contextSummary,
  contextNote,
  contextFacts = [],
  groundingLinks = [],
  returnLinks = [],
}: {
  initialIssueQuestion?: string;
  contextTitle?: string;
  contextSummary?: string;
  contextNote?: string;
  contextFacts?: InstitutionalInquiryContextFact[];
  groundingLinks?: InstitutionalInquiryContextLink[];
  returnLinks?: InstitutionalInquiryContextLink[];
}) {
  const seededValues: InstitutionalInquiryValues = {
    name: "",
    email: "",
    organization: "",
    roleTitle: "",
    organizationType: "",
    roomPreference: "",
    issueQuestion: initialIssueQuestion ?? "",
    urgencyTimeline: "",
    budgetRange: "",
    successCriteria: "",
    website: "",
  };
  const [values, setValues] = useState<InstitutionalInquiryValues>(seededValues);
  const [submission, setSubmission] = useState<SubmissionState>(initialSubmissionState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateValue<Key extends keyof InstitutionalInquiryValues>(
    key: Key,
    value: InstitutionalInquiryValues[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmission(initialSubmissionState);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formType: "institutional-inquiry",
          interest: "Institutional pilot",
          contextTitle,
          contextSummary,
          ...values,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;

      if (!response.ok) {
        setSubmission({
          tone: "error",
          message:
            payload?.error ??
            "The inquiry could not be sent just yet. Please try again in a moment.",
        });
        return;
      }

      setValues(seededValues);
      setSubmission({
        tone: "success",
        message:
          payload?.message ??
          "Thank you. Civic Logos will review whether this issue is a good fit for a structured room. Paying for a room funds examination, review capacity, and synthesis work. It does not buy favorable conclusions.",
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
    <form className={styles.form} id="inquiry" onSubmit={handleSubmit}>
      <div className={styles.contextPanel}>
        <div className={styles.contextHeader}>
          <span className={styles.contextLabel}>Institutional pilot inquiry</span>
          <h3>Request an institutional review pilot</h3>
        </div>
        <p className={styles.contextNote}>
          Paying for a room funds examination, review capacity, and synthesis work.
          It does not buy favorable conclusions.
        </p>
        <p className={styles.disclosureNote}>
          Inquiry details are private by default. If a public room is launched,
          sponsor identity, relevant constraints, and review conditions must be
          disclosed. Payment funds review capacity and synthesis labor; it does
          not buy favorable scoring, legitimacy, or quiet review outcomes.
        </p>
        {contextTitle || contextNote || contextFacts.length ? (
          <>
            {contextTitle ? (
              <p className={styles.contextNote}>
                <strong>Current inquiry context:</strong> {contextTitle}
              </p>
            ) : null}
            {contextNote ? <p className={styles.contextNote}>{contextNote}</p> : null}
            {contextFacts.length ? (
              <dl className={styles.contextFacts}>
                {contextFacts.slice(0, 8).map((item) => (
                  <div className={styles.contextFact} key={`${item.label}-${item.value}`}>
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {groundingLinks.length || returnLinks.length ? (
              <div className={styles.contextLinks}>
                {groundingLinks.slice(0, 4).map((item) => (
                  <a className={styles.contextLink} href={item.href} key={item.href}>
                    {item.label}
                  </a>
                ))}
                {returnLinks.slice(0, 3).map((item) => (
                  <a className={styles.contextLink} href={item.href} key={item.href}>
                    {item.label}
                  </a>
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </div>

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
            placeholder="you@institution.org"
            required
            type="email"
            value={values.email}
          />
        </label>
      </div>

      <div className={styles.grid}>
        <label className={styles.field}>
          <span>Organization</span>
          <input
            autoComplete="organization"
            name="organization"
            onChange={(event) => updateValue("organization", event.target.value)}
            placeholder="Institution or organization name"
            required
            value={values.organization}
          />
        </label>

        <label className={styles.field}>
          <span>Role or title</span>
          <input
            name="roleTitle"
            onChange={(event) => updateValue("roleTitle", event.target.value)}
            placeholder="Director, policy lead, dean, founder..."
            required
            value={values.roleTitle}
          />
        </label>
      </div>

      <div className={styles.grid}>
        <label className={styles.field}>
          <span>Organization type</span>
          <select
            name="organizationType"
            onChange={(event) => updateValue("organizationType", event.target.value)}
            required
            value={values.organizationType}
          >
            <option value="">Select one</option>
            {organizationTypeOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>Public or private room preference</span>
          <select
            name="roomPreference"
            onChange={(event) => updateValue("roomPreference", event.target.value)}
            required
            value={values.roomPreference}
          >
            <option value="">Select one</option>
            {roomPreferenceOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className={styles.field}>
        <span>Issue or question</span>
        <textarea
          name="issueQuestion"
          onChange={(event) => updateValue("issueQuestion", event.target.value)}
          placeholder="What hard public or institutional question should the room structure?"
          required
          rows={4}
          value={values.issueQuestion}
        />
      </label>

      <div className={styles.grid}>
        <label className={styles.field}>
          <span>Urgency or timeline</span>
          <input
            name="urgencyTimeline"
            onChange={(event) => updateValue("urgencyTimeline", event.target.value)}
            placeholder="This quarter, this year, exploratory, immediate..."
            required
            value={values.urgencyTimeline}
          />
        </label>

        <label className={styles.field}>
          <span>Estimated budget range</span>
          <select
            name="budgetRange"
            onChange={(event) => updateValue("budgetRange", event.target.value)}
            required
            value={values.budgetRange}
          >
            <option value="">Select one</option>
            {budgetOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className={styles.field}>
        <span>What would make this successful?</span>
        <textarea
          name="successCriteria"
          onChange={(event) => updateValue("successCriteria", event.target.value)}
          placeholder="What would you want the room to clarify, pressure-test, or synthesize?"
          required
          rows={5}
          value={values.successCriteria}
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
          {isSubmitting ? "Sending..." : "Request an institutional review pilot"}
        </button>
        <p className={styles.helper}>
          Inquiry-first sales. No Stripe checkout yet. Messages go to{" "}
          <a href="mailto:hello@civiclogos.com">hello@civiclogos.com</a>.
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
