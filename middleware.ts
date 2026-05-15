import { createServerClient } from "@supabase/ssr";
import type { SetAllCookies } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Routes that require an authenticated session.
 * Any request whose pathname starts with one of these prefixes will be
 * redirected to /sign-in when there is no active user.
 */
const PROTECTED_PREFIXES = ["/dashboard", "/onboarding", "/auth/role-select"];

/**
 * Routes that should bounce an already-authenticated user back to the
 * landing page so they don't end up on a sign-in/sign-up screen again.
 */
const AUTH_ONLY_ROUTES = ["/sign-in", "/sign-up"];

export async function middleware(request: NextRequest) {
  /**
   * We must create a new response and thread cookie mutations through both
   * the request and the response so that the Supabase SSR client can read
   * and write auth cookies on every edge invocation.
   */
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase isn't configured yet, let the request through so the app
  // can at least render and show a helpful error state.
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
        // First apply cookies to the outgoing request object so that any
        // subsequent server-side code in this same request sees them.
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        // Re-create the response with the updated request headers.
        supabaseResponse = NextResponse.next({ request });
        // Then stamp the cookies onto the response that will be sent back
        // to the browser.
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Do NOT add any logic between createServerClient and
  // supabase.auth.getUser(). Even innocuous-looking code can cause subtle
  // bugs by preventing the session from being refreshed properly.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 1. Redirect unauthenticated users away from protected routes.
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/sign-in";
    // Preserve the original destination so we can send them there after login.
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Redirect already-authenticated users away from sign-in / sign-up.
  const isAuthOnly = AUTH_ONLY_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  if (isAuthOnly && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  // IMPORTANT: Always return supabaseResponse (not a plain NextResponse.next())
  // so that the refreshed session cookies are forwarded to the browser.
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (Next.js static assets)
     * - _next/image   (Next.js image optimisation)
     * - favicon.ico, site images, and common static file extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
