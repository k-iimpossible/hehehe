import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { safeEqual } from "./crypto";

const MAX_PAYLOAD_BYTES = 256_000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-notify-secret",
  "Access-Control-Max-Age": "86400",
  "Cache-Control": "no-store",
};

export function notifyOptions() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export function notifyJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: corsHeaders });
}

export function authorizeNotify(request: Request) {
  const expected = process.env.NOTIFY_SECRET;
  if (!expected) {
    return notifyJson({ error: "Notification secret is not configured." }, 503);
  }

  const provided = request.headers.get("x-notify-secret") ?? "";
  if (!provided || !safeEqual(provided, expected)) {
    return notifyJson({ error: "Unauthorized." }, 401);
  }

  return null;
}

export function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function readNotifyPayload(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_PAYLOAD_BYTES) {
    return { error: notifyJson({ error: "Payload is too large." }, 413) };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: notifyJson({ error: "Invalid JSON." }, 400) };
  }

  if (!isJsonObject(parsed)) {
    return { error: notifyJson({ error: "Notification must be a JSON object." }, 400) };
  }

  return { payload: parsed as Prisma.InputJsonValue };
}

export async function enqueueNotification(payload: Prisma.InputJsonValue) {
  return prisma.notification.create({
    data: { payload },
    select: { id: true },
  });
}

type StoredNotification = {
  id: string;
  payload: unknown;
  createdAt: Date;
};

export async function takePendingNotifications() {
  const rows = await prisma.$queryRaw<StoredNotification[]>`
    WITH picked AS (
      SELECT id
      FROM "Notification"
      ORDER BY "createdAt" ASC
      FOR UPDATE SKIP LOCKED
    )
    DELETE FROM "Notification" AS n
    USING picked
    WHERE n.id = picked.id
    RETURNING n.id, n.payload, n."createdAt"
  `;

  return rows
    .slice()
    .sort((a, b) => timestamp(a.createdAt) - timestamp(b.createdAt))
    .map((row) => normalizePayload(row.payload));
}

function timestamp(value: Date | string) {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

function normalizePayload(payload: unknown): unknown {
  if (typeof payload === "string") {
    try {
      return JSON.parse(payload) as unknown;
    } catch {
      return payload;
    }
  }
  return payload;
}
