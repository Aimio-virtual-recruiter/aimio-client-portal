import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware: runs on every request to:
 *  1. Refresh the Supabase auth session cookie
 *  2. Protect /admin/* (admin role only) and /recruiter/* (recruiter+admin)
 *  3. Redirect unauthenticated users to /login
 *
 * The /api/* routes handle their own auth checks.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets, public pages, and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/" ||
    pathname === "/landing" ||
    pathname === "/login" ||
    pathname.startsWith("/recruiter/welcome") ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname === "/llms.txt" ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Create Supabase client tied to this request/response
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Require auth for protected routes
  const isProtectedRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/recruiter") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/mandats") ||
    pathname.startsWith("/candidats") ||
    pathname.startsWith("/messages") ||
    pathname.startsWith("/rapports") ||
    pathname.startsWith("/historique") ||
    pathname.startsWith("/analytics");

  if (isProtectedRoute && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access control
  if (user && isProtectedRoute) {
    let role: string | null = null;
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("[middleware] profile fetch error:", error.message);
      } else {
        role = profile?.role || null;
      }
    } catch (e) {
      console.error("[middleware] profile fetch threw:", e);
    }

    // If we can't determine role (DB issue), let user through — don't lock them out
    if (!role) return response;

    // Admin-only routes — admin can access everything
    if (pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/recruiter", request.url));
    }

    // Recruiter routes: recruiter OR admin allowed
    if (pathname.startsWith("/recruiter") && role !== "recruiter" && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Don't force-redirect from /dashboard — admins/recruiters can browse client view too
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
