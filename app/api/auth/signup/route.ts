import { prisma } from "@/lib/db";
import { createSession, createUser } from "@/lib/auth";
import { jsonError, requireSameOrigin } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { signupSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const ip = clientIp(request);
  const limited = rateLimit(`signup:${ip}`, 5, 60 * 60 * 1000);
  if (!limited.ok) {
    return jsonError("Too many sign-up attempts. Try again later.", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid input.", 400);
  }

  const { password, telegramId } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { telegramId } });
  if (existing) {
    return jsonError("An account with this Telegram ID already exists. Sign in instead.", 409);
  }

  const user = await createUser({ password, telegramId });
  await createSession(user.id, {
    ip,
    userAgent: request.headers.get("user-agent") || undefined,
  });

  return Response.json({ ok: true });
}
