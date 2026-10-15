import "server-only";

import nodemailer from "nodemailer";

const ALERT_TO = "digitalchaos2002@gmail.com";
const ALERT_EVENTS = new Set(["started", "stuck", "ended"]);

export function alertEvent(payload: Record<string, unknown>) {
  const event = payload.event;
  if (typeof event !== "string") return null;
  const normalized = event.trim().toLowerCase();
  return ALERT_EVENTS.has(normalized) ? normalized : null;
}

export async function sendAssessmentAlert(payload: Record<string, unknown>, event: string) {
  const message = buildAssessmentAlert(payload, event);
  if (!smtpConfigured()) {
    throw new Error("SMTP is not configured.");
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: ALERT_TO,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function buildAssessmentAlert(payload: Record<string, unknown>, event: string) {
  const profile = text(payload, "name", "profile name", "profileName", "profile") || "Not provided";
  const id = text(payload, "id") || "Not provided";
  const lines = [
    `Profile name: ${profile}`,
    `Event: ${event}`,
    `Assessment ID: ${id}`,
  ];

  if (event === "started") {
    lines.push(`Started at: ${text(payload, "started at") || "Not provided"}`);
  } else if (event === "stuck") {
    lines.push(`Stage: ${text(payload, "stage") || "Not provided"}`);
    lines.push(`Error: ${text(payload, "error") || "Not provided"}`);
  } else if (event === "ended") {
    lines.push(`Ended at: ${text(payload, "ended at") || "Not provided"}`);
  }

  const textBody = lines.join("\n");
  const html = lines
    .map((line) => `<p style="margin:0 0 8px;font-family:Georgia,serif;">${escapeHtml(line)}</p>`)
    .join("");

  return {
    subject: `Assessment ${event}: ${id}`,
    text: textBody,
    html,
  };
}

function text(payload: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" || typeof value === "boolean") return String(value);
  }
  return "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
