import { prisma } from "../lib/db";
import { ensureSuperAdmin } from "../lib/seed-admin";

async function main() {
  await ensureSuperAdmin();
  const count = await prisma.user.count();
  console.log(`Seed complete. Users in database: ${count}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
