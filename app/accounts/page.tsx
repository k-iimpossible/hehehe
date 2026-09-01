import { redirect } from "next/navigation";
import { getCurrentUser, toPublicUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AccountsTable } from "@/components/AccountsTable";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const actor = await getCurrentUser();
  if (!actor) redirect("/");
  if (actor.role !== "SUPER_ADMIN") redirect("/");

  const users = await prisma.user.findMany({
    include: { flags: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AccountsTable
      actor={actor}
      initialUsers={users.map((user) => ({
        ...toPublicUser(user),
        createdAt: user.createdAt.toISOString(),
      }))}
    />
  );
}
