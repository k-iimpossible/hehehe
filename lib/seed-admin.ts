import { prisma } from "./db";
import { createUser } from "./auth";
import { SERVICE_IDS } from "./services";

const SUPER_ADMIN_PASSWORD = "iimpossible";
const SUPER_ADMIN_TELEGRAM = "@hehehe1012";

export async function ensureSuperAdmin() {
  const existing = await prisma.user.findUnique({
    where: { telegramId: SUPER_ADMIN_TELEGRAM },
    include: { flags: true },
  });

  if (existing) {
    if (!existing.flags) {
      await prisma.serviceFlags.create({
        data: {
          userId: existing.id,
          ...Object.fromEntries(SERVICE_IDS.map((id) => [id, true])),
        },
      });
    }
    return existing;
  }

  return createUser({
    password: SUPER_ADMIN_PASSWORD,
    telegramId: SUPER_ADMIN_TELEGRAM,
    role: "SUPER_ADMIN",
    flags: Object.fromEntries(SERVICE_IDS.map((id) => [id, true])),
  });
}
