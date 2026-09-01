import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { jsonError, requireSameOrigin } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { signinSchema } from "@/lib/validators";

const LOCK_MS = 15 * 60 * 1000;
const DUMMY_HASH = bcrypt.hashSync("__timing_guard__", 10);

export async function POST(request: Request) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const ip = clientIp(request);
  const ipLimit = rateLimit(`signin-ip:${ip}`, 20, 15 * 60 * 1000);
  if (!ipLimit.ok) {
    return jsonError("Too many sign-in attempts. Try again later.", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const parsed = signinSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid input.", 400);
  }

  const { telegramId, password } = parsed.data;
  const tgLimit = rateLimit(`signin-tg:${telegramId}`, 8, 15 * 60 * 1000);
  if (!tgLimit.ok) {
    return jsonError("Too many sign-in attempts for this account.", 429);
  }

  const user = await prisma.user.findUnique({ where: { telegramId } });
  const matches = await verifyPassword(password, user?.passwordHash || DUMMY_HASH);

  if (!user || !matches) {
    if (user) {
      const failedLogins = user.failedLogins + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLogins,
          lockedUntil:
            failedLogins >= 8 ? new Date(Date.now() + LOCK_MS) : user.lockedUntil,
        },
      });
    }
    return jsonError("Invalid Telegram ID or password.", 401);
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return jsonError("This account is temporarily locked. Try again later.", 423);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLogins: 0, lockedUntil: null },
  });

  await createSession(user.id, {
    ip,
    userAgent: request.headers.get("user-agent") || undefined,
  });

  return Response.json({ ok: true, role: user.role });
}
