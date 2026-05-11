import { redirect } from "next/navigation";
import { getAuthenticatedUser, isAdminUser } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const hasAdminConfig = Boolean(
    process.env.ADMIN_USER_ID &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  if (hasAdminConfig) {
    const user = await getAuthenticatedUser();

    if (!isAdminUser(user?.id)) {
      redirect("/sign-in");
    }
  }

  return children;
}
