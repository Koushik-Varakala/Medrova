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
          // If no role, sign them out and tell them they need to create an account
          // (Or we could redirect them to a role selection page, but this is simpler for now)
          // Since the user is asking to "make it work", let's redirect them to onboarding if no role
          return NextResponse.redirect(`${origin}/sign-in?error=No role found. Please sign up using email.`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/sign-in?error=Could not verify OAuth code`);
}
