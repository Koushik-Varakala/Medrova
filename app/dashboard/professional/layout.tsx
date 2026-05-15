import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function ProfessionalDashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();
  if (!supabase) return <>{children}</>;

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/sign-in");
  }

  const { data: profile, error: profileError } = await supabase
    .from("healthcare_professionals")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    // If we have their role in user_roles we can redirect nicely, else sign-up
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const metadataRole =
      typeof user.user_metadata?.role === "string" ? user.user_metadata.role : null;
    const role = roleRow?.role ?? metadataRole;

    if (role === "doctor" || role === "nurse" || role === "technician") {
      redirect(`/onboarding/professional?role=${role}`);
    } else {
      redirect("/sign-up");
    }
  }

  return <>{children}</>;
}
