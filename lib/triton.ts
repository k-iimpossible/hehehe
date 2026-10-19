import { Prisma } from "@prisma/client";
import { prisma } from "./db";

const GAP_MS = 60_000;
const WINDOW_MS = 30_000;
const LOCK_KEY = 84218421;
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

const NAIVE_DATE =
  /^(\d{4})[-/](\d{2})[-/](\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;
const CLOCK_TIME = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

export function parseJstTime(value: unknown, now = new Date()): Date | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const millis = value < 1_000_000_000_000 ? value * 1000 : value;
    const date = new Date(millis);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const clock = CLOCK_TIME.exec(trimmed);
  if (clock) return nextClockTime(clock, now);

  if (/[zZ]$/.test(trimmed) || /[+-]\d{2}:?\d{2}$/.test(trimmed)) {
    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const match = NAIVE_DATE.exec(trimmed);
  if (!match) return null;

  const [, year, month, day, hour, minute, second = "00", fraction = "0"] = match;
  const millis = fraction.padEnd(3, "0").slice(0, 3);
  const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}.${millis}+09:00`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isNewTritonNotification(
  latest: { time: Date; createdAt: Date } | null,
  incomingTime: Date,
  nowMs: number,
) {
  if (!latest) return true;
  return (
    incomingTime.getTime() - latest.time.getTime() >= GAP_MS &&
    nowMs - latest.createdAt.getTime() >= GAP_MS
  );
}

export function pickNextAccount(
  calls: { accountName: string; startTime: Date; receivedAt: Date }[],
  referenceMs: number,
) {
  const ordered = [...calls].sort((a, b) => a.receivedAt.getTime() - b.receivedAt.getTime());
  let best: { accountName: string; startMs: number } | null = null;

  for (const call of ordered) {
    const startMs = call.startTime.getTime();
    if (startMs < referenceMs) continue;
    if (!best || startMs < best.startMs) {
      best = { accountName: call.accountName, startMs };
    }
  }

  return best?.accountName ?? null;
}

export async function receiveTritonNotification(name: string, time: Date) {
  return prisma.$transaction(async (tx) => {
    await lock(tx);
    await selectDueWinners(tx);

    const latest = await tx.tritonNotification.findFirst({
      orderBy: { id: "desc" },
      select: { time: true, createdAt: true },
    });

    if (!isNewTritonNotification(latest, time, Date.now())) {
      return { stored: false as const };
    }

    const saved = await tx.tritonNotification.create({
      data: { name, time },
      select: { id: true },
    });
    return { stored: true as const, id: saved.id };
  });
}

type GetBody = {
  name?: unknown;
  notification_id?: unknown;
  start_time?: unknown;
  end_time?: unknown;
};

export async function readTritonNotification(body: GetBody) {
  const name = accountName(body.name);
  if (!name) return { error: "name is required." as const };

  const result = await prisma.$transaction(async (tx) => {
    await lock(tx);
    await recordSpecialCall(tx, name, body);
    await selectDueWinners(tx);

    const latest = await tx.tritonNotification.findFirst({
      orderBy: { id: "desc" },
      select: { id: true, createdAt: true },
    });

    let flag = false;
    let notificationId: number | undefined;
    if (latest && Date.now() - latest.createdAt.getTime() < GAP_MS) {
      const alreadySent = await tx.tritonDelivery.findUnique({
        where: {
          notificationId_accountName: {
            notificationId: latest.id,
            accountName: name,
          },
        },
        select: { id: true },
      });
      if (!alreadySent) {
        await tx.tritonDelivery.create({
          data: { notificationId: latest.id, accountName: name },
        });
        flag = true;
        notificationId = latest.id;
      }
    }

    const pending = await tx.tritonNotification.findFirst({
      where: {
        winnerSelected: true,
        winnerAccount: name,
        autoRefreshConsumed: false,
      },
      orderBy: { id: "desc" },
      select: { id: true },
    });

    if (pending) {
      await tx.tritonNotification.updateMany({
        where: {
          winnerSelected: true,
          winnerAccount: name,
          autoRefreshConsumed: false,
        },
        data: { autoRefreshConsumed: true },
      });
    }

    return {
      flag,
      auto_refresh_start: Boolean(pending),
      ...(flag && notificationId != null ? { notification_id: notificationId } : {}),
    };
  });

  return { body: result };
}

function accountName(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 200) return "";
  return trimmed;
}

function notificationId(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    const parsed = Number(value.trim());
    if (Number.isSafeInteger(parsed) && parsed > 0) return parsed;
  }
  return null;
}

async function recordSpecialCall(
  tx: Tx,
  name: string,
  body: GetBody,
) {
  const id = notificationId(body.notification_id);
  const startTime = parseJstTime(body.start_time);
  const endTime = parseJstTime(body.end_time);
  if (id == null || !startTime || !endTime) return;

  const target = await tx.tritonNotification.findUnique({
    where: { id },
    select: { id: true, createdAt: true, winnerSelected: true },
  });
  if (!target || target.winnerSelected) return;
  if (Date.now() > target.createdAt.getTime() + WINDOW_MS) return;

  await tx.tritonSpecialCall.create({
    data: {
      notificationId: target.id,
      accountName: name,
      startTime,
      endTime,
    },
  });
}

async function selectDueWinners(tx: Tx) {
  const due = await tx.tritonNotification.findMany({
    where: {
      winnerSelected: false,
      createdAt: { lte: new Date(Date.now() - WINDOW_MS) },
    },
    orderBy: { id: "asc" },
    select: { id: true, createdAt: true },
  });

  for (const notification of due) {
    const calls = await tx.tritonSpecialCall.findMany({
      where: { notificationId: notification.id },
      select: { accountName: true, startTime: true, receivedAt: true },
    });
    const winnerAccount = pickNextAccount(
      calls,
      notification.createdAt.getTime() + WINDOW_MS,
    );
    await tx.tritonNotification.update({
      where: { id: notification.id },
      data: { winnerSelected: true, winnerAccount },
    });
  }
}

type Tx = Prisma.TransactionClient;

async function lock(tx: Tx) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${BigInt(LOCK_KEY)})`;
}

function nextClockTime(match: RegExpExecArray, now: Date) {
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = Number(match[3] ?? "0");
  if (hour > 23 || minute > 59 || second > 59) return null;

  const jst = new Date(now.getTime() + JST_OFFSET_MS);
  const instant =
    Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate(), hour, minute, second) -
    JST_OFFSET_MS;
  return new Date(instant < now.getTime() ? instant + 24 * 60 * 60 * 1000 : instant);
}
