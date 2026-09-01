import { getCurrentUser, toPublicUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";

export async function GET() {
  const actor = await getCurrentUser();
  if (!actor) return jsonError("Please sign in first.", 401);
  if (actor.role !== "SUPER_ADMIN") {
    return jsonError("You do not have access to this page.", 403);
  }

  const users = await prisma.user.findMany({
    include: { flags: true },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({
    users: users.map((user) => ({
      ...toPublicUser(user),
      createdAt: user.createdAt.toISOString(),
    })),
  });
}
