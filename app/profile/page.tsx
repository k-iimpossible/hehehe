import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ProfileView } from "@/components/ProfileView";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return <ProfileView user={user} />;
}
