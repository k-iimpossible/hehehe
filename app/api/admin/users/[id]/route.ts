import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError, requireSameOrigin } from "@/lib/http";
import { SERVICE_IDS } from "@/lib/services";
import { flagsUpdateSchema } from "@/lib/validators";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const actor = await getCurrentUser();
  if (!actor) return jsonError("Please sign in first.", 401);
  if (actor.role !== "SUPER_ADMIN") {
    return jsonError("You do not have access to this page.", 403);
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const parsed = flagsUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid flags.", 400);
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: { flags: true },
  });
  if (!user) return jsonError("User not found.", 404);

  const data = Object.fromEntries(
    SERVICE_IDS.filter((key) => typeof parsed.data.flags[key] === "boolean").map(
      (key) => [key, parsed.data.flags[key] as boolean],
    ),
  );

  if (user.flags) {
    await prisma.serviceFlags.update({
      where: { userId: id },
      data,
    });
  } else {
    await prisma.serviceFlags.create({
      data: { userId: id, ...data },
    });
  }

  return Response.json({ ok: true });
}
