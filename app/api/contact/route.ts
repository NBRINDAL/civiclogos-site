import nodemailer from "nodemailer";
import { NextRequest, NextResponse } from "next/server";
import { throttleRequest } from "@/app/lib/request-throttle";

export const runtime = "nodejs";

type ContactPayload = {
  formType?: unknown;
  name?: unknown;
  email?: unknown;
  interest?: unknown;
  expertise?: unknown;
  message?: unknown;
  organization?: unknown;
  roleTitle?: unknown;
  organizationType?: unknown;
  roomPreference?: unknown;
  issueQuestion?: unknown;
  urgencyTimeline?: unknown;
  budgetRange?: unknown;
  successCriteria?: unknown;
  contextTitle?: unknown;
  contextSummary?: unknown;
  website?: unknown;
};

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const institutionalBudgetOptions = new Set([
  "Under $2,500",
  "$2,500–$10,000",
  "$10,000–$25,000",
  "$25,000–$50,000",
  "$50,000+",
  "Not sure yet",
]);

export async function POST(request: NextRequest) {
  const throttled = throttleRequest(request, {
    bucket: "contact",
    limit: 6,
    windowMs: 60 * 60 * 1000,
  });

  if (throttled) {
    return throttled;
  }

  let payload: ContactPayload;

  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = asTrimmedString(payload.name);
  const email = asTrimmedString(payload.email);
  const formType = asTrimmedString(payload.formType);
  const interest = asTrimmedString(payload.interest) || "General inquiry";
  const expertise = asTrimmedString(payload.expertise);
  const message = asTrimmedString(payload.message);
  const organization = asTrimmedString(payload.organization);
  const roleTitle = asTrimmedString(payload.roleTitle);
  const organizationType = asTrimmedString(payload.organizationType);
  const roomPreference = asTrimmedString(payload.roomPreference);
  const issueQuestion = asTrimmedString(payload.issueQuestion);
  const urgencyTimeline = asTrimmedString(payload.urgencyTimeline);
  const budgetRange = asTrimmedString(payload.budgetRange);
  const successCriteria = asTrimmedString(payload.successCriteria);
  const contextTitle = asTrimmedString(payload.contextTitle);
  const contextSummary = asTrimmedString(payload.contextSummary);
  const website = asTrimmedString(payload.website);
  const isInstitutionalInquiry =
    formType === "institutional-inquiry" || interest === "Institutional pilot";

  if (website) {
    return NextResponse.json({ message: "Thanks." }, { status: 200 });
  }

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }

  if (isInstitutionalInquiry) {
    if (
      !organization ||
      !roleTitle ||
      !organizationType ||
      !roomPreference ||
      !issueQuestion ||
      !urgencyTimeline ||
      !budgetRange ||
      !successCriteria
    ) {
      return NextResponse.json(
        {
          error:
            "Name, email, organization, role, organization type, room preference, issue, timeline, budget range, and success criteria are required.",
        },
        { status: 400 },
      );
    }
  } else if (!message) {
    return NextResponse.json(
      { error: "Name, email, and message are required." },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (
    name.length > 120 ||
    email.length > 240 ||
    expertise.length > 240 ||
    message.length > 4000 ||
    organization.length > 240 ||
    roleTitle.length > 240 ||
    organizationType.length > 240 ||
    roomPreference.length > 240 ||
    issueQuestion.length > 4000 ||
    urgencyTimeline.length > 1000 ||
    budgetRange.length > 240 ||
    successCriteria.length > 4000 ||
    contextTitle.length > 240 ||
    contextSummary.length > 6000
  ) {
    return NextResponse.json(
      { error: "One or more fields are too long." },
      { status: 400 },
    );
  }

  if (isInstitutionalInquiry && !institutionalBudgetOptions.has(budgetRange)) {
    return NextResponse.json(
      { error: "Choose one of the listed budget ranges." },
      { status: 400 },
    );
  }

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST ?? "smtp.office365.com";
  const smtpPort = Number(process.env.SMTP_PORT ?? "587");
  const smtpSecure =
    process.env.SMTP_SECURE === "true" ? true : smtpPort === 465;
  const contactTo = process.env.CONTACT_TO ?? smtpUser;
  const contactFrom = process.env.CONTACT_FROM ?? smtpUser;

  if (!smtpUser || !smtpPass || !contactTo || !contactFrom) {
    return NextResponse.json(
      {
        error:
          "The form is live, but email delivery is not configured yet. Add the SMTP environment variables in Vercel and try again.",
      },
      { status: 503 },
    );
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeInterest = escapeHtml(interest);
  const safeExpertise = escapeHtml(expertise || "Not provided");
  const safeMessage = escapeHtml(message).replaceAll("\n", "<br />");
  const safeOrganization = escapeHtml(organization || "Not provided");
  const safeRoleTitle = escapeHtml(roleTitle || "Not provided");
  const safeOrganizationType = escapeHtml(organizationType || "Not provided");
  const safeRoomPreference = escapeHtml(roomPreference || "Not provided");
  const safeIssueQuestion = escapeHtml(issueQuestion || "Not provided").replaceAll(
    "\n",
    "<br />",
  );
  const safeUrgencyTimeline = escapeHtml(urgencyTimeline || "Not provided").replaceAll(
    "\n",
    "<br />",
  );
  const safeBudgetRange = escapeHtml(budgetRange || "Not provided");
  const safeSuccessCriteria = escapeHtml(successCriteria || "Not provided").replaceAll(
    "\n",
    "<br />",
  );
  const safeContextTitle = escapeHtml(contextTitle || "Not provided");
  const safeContextSummary = escapeHtml(contextSummary || "Not provided").replaceAll(
    "\n",
    "<br />",
  );

  try {
    await transporter.sendMail({
      to: contactTo,
      from: contactFrom,
      replyTo: email,
      subject: isInstitutionalInquiry
        ? `[Civic Logos] Institutional pilot from ${name}${organization ? ` (${organization})` : ""}`
        : `[Civic Logos] ${interest} from ${name}`,
      text: isInstitutionalInquiry
        ? [
            "New Civic Logos institutional pilot inquiry",
            "",
            `Name: ${name}`,
            `Email: ${email}`,
            `Organization: ${organization}`,
            `Role or title: ${roleTitle}`,
            `Organization type: ${organizationType}`,
            `Public or private room preference: ${roomPreference}`,
            `Estimated budget range: ${budgetRange}`,
            `Urgency or timeline: ${urgencyTimeline}`,
            "",
            "Issue or question:",
            issueQuestion,
            "",
            "What would make this successful?",
            successCriteria,
            "",
            `Pilot context title: ${contextTitle || "Not provided"}`,
            "",
            "Pilot context summary:",
            contextSummary || "Not provided",
          ].join("\n")
        : [
            "New Civic Logos form submission",
            "",
            `Name: ${name}`,
            `Email: ${email}`,
            `Interest: ${interest}`,
            `Expertise: ${expertise || "Not provided"}`,
            "",
            "Message:",
            message,
          ].join("\n"),
      html: isInstitutionalInquiry
        ? `
        <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #122127;">
          <h2 style="margin: 0 0 16px;">New Civic Logos institutional pilot inquiry</h2>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Organization:</strong> ${safeOrganization}</p>
          <p><strong>Role or title:</strong> ${safeRoleTitle}</p>
          <p><strong>Organization type:</strong> ${safeOrganizationType}</p>
          <p><strong>Public or private room preference:</strong> ${safeRoomPreference}</p>
          <p><strong>Estimated budget range:</strong> ${safeBudgetRange}</p>
          <p><strong>Urgency or timeline:</strong><br />${safeUrgencyTimeline}</p>
          <p><strong>Issue or question:</strong><br />${safeIssueQuestion}</p>
          <p><strong>What would make this successful?</strong><br />${safeSuccessCriteria}</p>
          <p><strong>Pilot context title:</strong> ${safeContextTitle}</p>
          <p><strong>Pilot context summary:</strong><br />${safeContextSummary}</p>
        </div>
      `
        : `
        <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #122127;">
          <h2 style="margin: 0 0 16px;">New Civic Logos form submission</h2>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Interest:</strong> ${safeInterest}</p>
          <p><strong>Expertise:</strong> ${safeExpertise}</p>
          <p><strong>Message:</strong><br />${safeMessage}</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Contact form delivery failed", error);
    return NextResponse.json(
      {
        error:
          "The message could not be delivered. If Microsoft 365 SMTP is new, confirm SMTP Authentication is enabled for hello@civiclogos.com and that the Vercel environment variables are correct.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    message: isInstitutionalInquiry
      ? "Thank you. Civic Logos will review whether this issue is a good fit for a structured room. Paying for a room funds examination, review capacity, and synthesis work. It does not buy favorable conclusions."
      : "Thanks. Your note was sent to the Civic Logos inbox.",
  });
}
