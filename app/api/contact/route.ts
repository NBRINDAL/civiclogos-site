import nodemailer from "nodemailer";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  interest?: unknown;
  expertise?: unknown;
  message?: unknown;
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

export async function POST(request: NextRequest) {
  let payload: ContactPayload;

  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = asTrimmedString(payload.name);
  const email = asTrimmedString(payload.email);
  const interest = asTrimmedString(payload.interest) || "General inquiry";
  const expertise = asTrimmedString(payload.expertise);
  const message = asTrimmedString(payload.message);
  const website = asTrimmedString(payload.website);

  if (website) {
    return NextResponse.json({ message: "Thanks." }, { status: 200 });
  }

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "Name, email, and message are required." },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (name.length > 120 || email.length > 240 || expertise.length > 240 || message.length > 4000) {
    return NextResponse.json(
      { error: "One or more fields are too long." },
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

  try {
    await transporter.sendMail({
      to: contactTo,
      from: contactFrom,
      replyTo: email,
      subject: `[Civic Logos] ${interest} from ${name}`,
      text: [
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
      html: `
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
    message: "Thanks. Your note was sent to the Civic Logos inbox.",
  });
}
