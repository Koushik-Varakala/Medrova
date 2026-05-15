import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.redirect(`${origin}/sign-in?error=Configuration missing`);
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roleRow } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        const role = roleRow?.role || user.user_metadata?.role;

        if (role) {
          // Existing user with known role — send to their dashboard
          if (role === "clinic") return NextResponse.redirect(`${origin}/dashboard/clinic`);
          if (role === "admin") return NextResponse.redirect(`${origin}/dashboard/admin`);
          if (role === "doctor") {
            const { data: professionalProfile } = await supabase
              .from("healthcare_professionals")
              .select("id")
              .eq("user_id", user.id)
              .maybeSingle();
            return NextResponse.redirect(
              `${origin}${professionalProfile ? "/dashboard/professional" : "/onboarding/professional?role=doctor"}`
            );
          }
          // nurse / technician — they always use the unified professional dashboard
          return NextResponse.redirect(`${origin}/dashboard/professional`);
        } else {
          // New user via Google OAuth — they haven't picked a role yet
          // Send them to role-select so they can choose before onboarding
          return NextResponse.redirect(`${origin}/auth/role-select`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/sign-in?error=Could not verify OAuth code`);
}
