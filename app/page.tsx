import { getCurrentUser } from "@/lib/auth";
import { AuthPanel } from "@/components/AuthPanel";
import { HomeDashboard } from "@/components/HomeDashboard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) return <AuthPanel />;
  return <HomeDashboard user={user} />;
}
