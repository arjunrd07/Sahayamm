import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;



  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public & auth routes that do not require RBAC enforcement
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/api");

  // If user is unauthenticated and attempting to access protected area
  if (!user && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is already authenticated and visiting /login, redirect to their role dashboard
  if (user && pathname.startsWith("/login")) {
    const userRole = user.user_metadata?.role || "borrower";
    const dest =
      userRole === "admin"
        ? "/admin/dashboard"
        : userRole === "lender"
        ? "/lender/dashboard"
        : "/borrower/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // If user is authenticated, enforce RBAC role route permissions
  if (user && !isPublicRoute) {
    try {
      let userRole = user.user_metadata?.role;

      if (!userRole || userRole !== "admin") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, org_id, pan_number, phone, address")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.role) {
          userRole = profile.role;
        }

        // If profile details (PAN, phone, address) are missing, require Step 3 completion
        if (!profile || !profile.pan_number || !profile.phone || !profile.address) {
          return NextResponse.redirect(new URL("/signup?step=3", request.url));
        }
      }

      if (!userRole) {
        userRole = "borrower";
      }

      // 1. /admin/* routes are ONLY accessible by admin role
      if (pathname.startsWith("/admin") && userRole !== "admin") {
        const redirectPath = userRole === "lender" ? "/lender/dashboard" : "/borrower/dashboard";
        return NextResponse.redirect(new URL(redirectPath, request.url));
      }

      // 2. /lender/* routes are accessible by lender or admin
      if (
        pathname.startsWith("/lender") &&
        userRole !== "lender" &&
        userRole !== "admin"
      ) {
        return NextResponse.redirect(new URL("/borrower/dashboard", request.url));
      }
    } catch (err) {
      console.warn("Middleware RBAC check notice:", err);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
