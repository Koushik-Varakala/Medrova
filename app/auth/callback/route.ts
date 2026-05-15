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
      // Check if user has a role
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Try getting role from db
        const { data: roleRow } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        const role = roleRow?.role || user.user_metadata?.role;

        if (role) {
          return NextResponse.redirect(`${origin}/dashboard/${role}`);
        } else {
          // New Google user — send them to pick their role
          return NextResponse.redirect(`${origin}/auth/role-select`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/sign-in?error=Could not verify OAuth code`);
}
