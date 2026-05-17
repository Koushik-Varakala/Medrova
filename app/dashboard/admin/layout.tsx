import { redirect } from "next/navigation";
import { getAuthenticatedUser, isAdminUser } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();

  if (!isAdminUser(user?.id)) {
    redirect("/sign-in");
  }

  return children;
}
