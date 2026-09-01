import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import type { ServiceFlags, User } from "@prisma/client";
import { prisma } from "./db";
import { generateAccountId, randomToken, sha256 } from "./crypto";
import { DEFAULT_FLAGS, normalizeFlags, type ServiceId } from "./services";
import type { PublicUser } from "./types";

export type { PublicUser };

const COOKIE_NAME = "hehehe_session";
const SESSION_DAYS = 7;
const BCRYPT_ROUNDS = 12;

function cookieSecure(): boolean {
  return process.env.NODE_ENV === "production";
}

export function toPublicUser(
  user: User & { flags: ServiceFlags | null },
): PublicUser {
  return {
    id: user.id,
    accountId: user.accountId,
    telegramId: user.telegramId,
    role: user.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "USER",
    flags: normalizeFlags(user.flags ?? undefined),
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export async function createUser(input: {
  password: string;
  telegramId: string;
  role?: "USER" | "SUPER_ADMIN";
  flags?: Partial<Record<ServiceId, boolean>>;
}) {
  const flags = { ...DEFAULT_FLAGS, ...(input.flags ?? {}) };
  return prisma.user.create({
    data: {
      passwordHash: await hashPassword(input.password),
      telegramId: input.telegramId,
      accountId: generateAccountId(),
      role: input.role ?? "USER",
      flags: { create: flags },
    },
    include: { flags: true },
  });
}

export async function createSession(
  userId: string,
  meta?: { ip?: string; userAgent?: string },
) {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      tokenHash: sha256(token),
      userId,
      expiresAt,
      ip: meta?.ip,
      userAgent: meta?.userAgent?.slice(0, 300),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: sha256(token) } });
  }
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    expires: new Date(0),
  });
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: { include: { flags: true } } },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    }
    return null;
  }

  return toPublicUser(session.user);
}

export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }
  return user;
}

export function userHasService(user: PublicUser, id: ServiceId): boolean {
  return user.flags[id] === true;
}
