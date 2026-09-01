import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError, requireSameOrigin } from "@/lib/http";
import { passwordChangeSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const user = await getCurrentUser();
  if (!user) return jsonError("Please sign in first.", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const parsed = passwordChangeSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid input.", 400);
  }

  const record = await prisma.user.findUnique({ where: { id: user.id } });
  if (!record) return jsonError("Account not found.", 404);

  const matches = await verifyPassword(
    parsed.data.currentPassword,
    record.passwordHash,
  );
  if (!matches) {
    return jsonError("Current password is incorrect.", 401);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });

  return Response.json({ ok: true });
}
