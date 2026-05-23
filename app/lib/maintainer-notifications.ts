import nodemailer from "nodemailer";
import { getActualCardChangeLabel } from "./contribution-impact";
import type { Contribution } from "./contribution-types";

type NotificationResult =
  | { delivered: true }
  | { delivered: false; reason: "unconfigured" | "error" };

function asTrimmedEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatContributionIdentity(contribution: Contribution) {
  return `${contribution.roomSlug} / ${contribution.topicId} / ${contribution.lane}`;
}

function getMailConfig() {
  const smtpUser = asTrimmedEnv("SMTP_USER");
  const smtpPass = asTrimmedEnv("SMTP_PASS");
  const smtpHost = asTrimmedEnv("SMTP_HOST") || "smtp.office365.com";
  const smtpPort = Number(asTrimmedEnv("SMTP_PORT") || "587");
  const smtpSecure =
    asTrimmedEnv("SMTP_SECURE") === "true" ? true : smtpPort === 465;
  const contactTo = asTrimmedEnv("CONTACT_TO") || smtpUser;
  const contactFrom = asTrimmedEnv("CONTACT_FROM") || smtpUser;
  const maintainerTo =
    asTrimmedEnv("MAINTAINER_NOTIFICATION_TO") || contactTo || smtpUser;

  if (!smtpUser || !smtpPass || !contactFrom || !maintainerTo) {
    return null;
  }

  return {
    smtpUser,
    smtpPass,
    smtpHost,
    smtpPort,
    smtpSecure,
    contactFrom,
    maintainerTo,
  };
}

async function sendMaintainerMail(args: {
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}): Promise<NotificationResult> {
  const config = getMailConfig();

  if (!config) {
    return { delivered: false, reason: "unconfigured" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });

    await transporter.sendMail({
      to: config.maintainerTo,
      from: config.contactFrom,
      replyTo: args.replyTo,
      subject: args.subject,
      text: args.text,
      html: args.html,
    });

    return { delivered: true };
  } catch (error) {
    console.error("Maintainer notification delivery failed", error);
    return { delivered: false, reason: "error" };
  }
}

export async function sendContributionSubmittedNotification(
  contribution: Contribution,
) {
  const contributorName = contribution.author.name || "Anonymous contributor";
  const contributorEmail = contribution.author.email || "Not provided";
  const contributorExpertise = contribution.author.expertise || "Not provided";
  const referralSource = contribution.referralSource || "Not provided";
  const evidenceLine = contribution.evidenceSource?.url
    ? `${contribution.evidenceSource.label || "Source"}: ${contribution.evidenceSource.url}`
    : "No evidence/source link provided";
  const uploadedEvidenceLine = contribution.evidenceDocument
    ? `${contribution.evidenceDocument.fileName} (${contribution.evidenceDocument.mimeType}, ${contribution.evidenceDocument.sizeBytes} bytes) — ${contribution.evidenceDocument.downloadHref}`
    : "No uploaded evidence document provided";
  const safeTitle = escapeHtml(contribution.title);
  const safeBody = escapeHtml(contribution.body).replaceAll("\n", "<br />");

  return sendMaintainerMail({
    subject: `[Civic Logos] New contribution for ${formatContributionIdentity(contribution)}`,
    replyTo: contribution.author.email,
    text: [
      "A new Civic Logos contribution was submitted.",
      "",
      `Room/topic/lane: ${formatContributionIdentity(contribution)}`,
      `Topic title: ${contribution.topicTitle}`,
      `Status: ${contribution.status}`,
      `Contributor: ${contributorName}`,
      `Email: ${contributorEmail}`,
      `Expertise/context: ${contributorExpertise}`,
      `Heard about Civic Logos: ${referralSource}`,
      "",
      `Title: ${contribution.title}`,
      "",
      contribution.body,
      "",
      evidenceLine,
      uploadedEvidenceLine,
      "",
      "Open the scoped queue:",
      `${process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.civiclogos.com"}/review/contributions?roomSlug=${encodeURIComponent(contribution.roomSlug)}&topicId=${encodeURIComponent(contribution.topicId)}`,
    ].join("\n"),
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #122127;">
        <h2 style="margin: 0 0 16px;">New Civic Logos contribution</h2>
        <p><strong>Room/topic/lane:</strong> ${escapeHtml(formatContributionIdentity(contribution))}</p>
        <p><strong>Topic title:</strong> ${escapeHtml(contribution.topicTitle)}</p>
        <p><strong>Status:</strong> ${escapeHtml(contribution.status)}</p>
        <p><strong>Contributor:</strong> ${escapeHtml(contributorName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(contributorEmail)}</p>
        <p><strong>Expertise/context:</strong> ${escapeHtml(contributorExpertise)}</p>
        <p><strong>Heard about Civic Logos:</strong> ${escapeHtml(referralSource)}</p>
        <p><strong>Title:</strong> ${safeTitle}</p>
        <p><strong>Contribution:</strong><br />${safeBody}</p>
        <p><strong>Evidence/source:</strong> ${escapeHtml(evidenceLine)}</p>
        <p><strong>Uploaded evidence:</strong> ${escapeHtml(uploadedEvidenceLine)}</p>
        <p><a href="${escapeHtml(
          `${process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.civiclogos.com"}/review/contributions?roomSlug=${encodeURIComponent(contribution.roomSlug)}&topicId=${encodeURIComponent(contribution.topicId)}`,
        )}">Open the scoped queue</a></p>
      </div>
    `,
  });
}

export async function sendContributionReviewedNotification(
  contribution: Contribution,
) {
  const review = contribution.review;

  if (!review?.reviewedAt) {
    return { delivered: false, reason: "unconfigured" as const };
  }

  const publicRecordNote =
    review.publicRecordNote ||
    review.decisionReason ||
    "No public-facing outcome note was recorded.";
  const reviewerNote = review.reviewerNote || "No internal reviewer note recorded.";
  const safePublicRecordNote = escapeHtml(publicRecordNote).replaceAll("\n", "<br />");
  const safeReviewerNote = escapeHtml(reviewerNote).replaceAll("\n", "<br />");

  return sendMaintainerMail({
    subject: `[Civic Logos] Review decision for ${formatContributionIdentity(contribution)}`,
    text: [
      "A Civic Logos contribution received a human review decision.",
      "",
      `Room/topic/lane: ${formatContributionIdentity(contribution)}`,
      `Topic title: ${contribution.topicTitle}`,
      `Status: ${contribution.status}`,
      `Reviewed at: ${review.reviewedAt}`,
      `Actual card change: ${getActualCardChangeLabel(contribution)}`,
      `Assigned to: ${review.assignedToKind || "Unassigned"}${review.assignedToLabel ? ` / ${review.assignedToLabel}` : ""}`,
      "",
      `Public record note: ${publicRecordNote}`,
      "",
      `Reviewer note: ${reviewerNote}`,
      "",
      "Open the scoped queue:",
      `${process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.civiclogos.com"}/review/contributions?roomSlug=${encodeURIComponent(contribution.roomSlug)}&topicId=${encodeURIComponent(contribution.topicId)}`,
    ].join("\n"),
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #122127;">
        <h2 style="margin: 0 0 16px;">Human review decision recorded</h2>
        <p><strong>Room/topic/lane:</strong> ${escapeHtml(formatContributionIdentity(contribution))}</p>
        <p><strong>Topic title:</strong> ${escapeHtml(contribution.topicTitle)}</p>
        <p><strong>Status:</strong> ${escapeHtml(contribution.status)}</p>
        <p><strong>Reviewed at:</strong> ${escapeHtml(review.reviewedAt)}</p>
        <p><strong>Actual card change:</strong> ${escapeHtml(
          getActualCardChangeLabel(contribution),
        )}</p>
        <p><strong>Assigned to:</strong> ${escapeHtml(
          review.assignedToKind || "Unassigned",
        )}${review.assignedToLabel ? ` / ${escapeHtml(review.assignedToLabel)}` : ""}</p>
        <p><strong>Public record note:</strong><br />${safePublicRecordNote}</p>
        <p><strong>Reviewer note:</strong><br />${safeReviewerNote}</p>
        <p><a href="${escapeHtml(
          `${process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.civiclogos.com"}/review/contributions?roomSlug=${encodeURIComponent(contribution.roomSlug)}&topicId=${encodeURIComponent(contribution.topicId)}`,
        )}">Open the scoped queue</a></p>
      </div>
    `,
  });
}
