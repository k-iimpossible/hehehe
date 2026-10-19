import "server-only";

import nodemailer from "nodemailer";

const ALERT_TO = "digitalchaos2002@gmail.com";
const CLAIM_FROM = "digitalchaos2003@gmail.com";
const ALERT_EVENTS = new Set(["started", "stuck", "ended"]);

export function alertEvent(payload: Record<string, unknown>) {
  const event = payload.event;
  if (typeof event !== "string") return null;
  const normalized = event.trim().toLowerCase();
  return ALERT_EVENTS.has(normalized) ? normalized : null;
}

export async function sendAssessmentAlert(payload: Record<string, unknown>, event: string) {
  const message = buildAssessmentAlert(payload, event);
  await deliverMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER || CLAIM_FROM,
    to: ALERT_TO,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}

export async function sendClaimedTaskEmail(input: {
  email: string;
  name: string;
  projectName: string;
  rate: string;
  claimedTime: string;
  claimed: boolean;
}) {
  const name = oneLine(input.name);
  const projectName = oneLine(input.projectName);
  const rate = oneLine(input.rate);
  const prefix = input.claimed ? "New task claimed!" : "New task available!";
  const lines = [
    `Account: ${name}`,
    `Project: ${projectName}`,
    `Rate: ${rate}`,
    `Claimed time: ${input.claimedTime}`,
  ];
  const text = lines.join("\n");
  const html = lines
    .map((line) => `<p style="margin:0 0 8px;font-family:Georgia,serif;">${escapeHtml(line)}</p>`)
    .join("");

  await deliverMail({
    from: CLAIM_FROM,
    to: oneLine(input.email),
    subject: `${prefix} ${name}: ${projectName} ${rate}`,
    text,
    html,
  });
}

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

async function deliverMail(message: {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
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

  await transporter.sendMail(message);
}

function oneLine(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function buildAssessmentAlert(payload: Record<string, unknown>, event: string) {
  const name = text(payload, "name", "profile name", "profileName", "profile") || "Not provided";
  const id = text(payload, "id") || "Not provided";
  const lines = [`Assessment ID: ${id}`, `Name: ${name}`];
  let subject = "DA Starter Assessment";

  if (event === "started") {
    subject = "DA Starter Assessment Started";
    lines.push(`Time: ${text(payload, "started at", "time") || "Not provided"}`);
  } else if (event === "stuck") {
    subject = "DA Starter Assessment Stuck";
    lines.push(`Stage: ${text(payload, "stage") || "Not provided"}`);
    lines.push(`Issue: ${text(payload, "error", "issue") || "Not provided"}`);
  } else if (event === "ended") {
    subject = "DA Starter Assessment Ended";
    lines.push(`Time: ${text(payload, "ended at", "time") || "Not provided"}`);
  }

  const textBody = lines.join("\n");
  const html = lines
    .map((line) => `<p style="margin:0 0 8px;font-family:Georgia,serif;">${escapeHtml(line)}</p>`)
    .join("");

  return {
    subject,
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
