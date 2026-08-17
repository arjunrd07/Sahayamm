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

  // If user is authenticated, enforce RBAC role route permissions
  if (user && !isPublicRoute) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, org_id")
        .eq("id", user.id)
        .maybeSingle();

      const userRole = profile?.role || "borrower";

      // 1. /superadmin/* routes are ONLY accessible by superadmin
      if (pathname.startsWith("/superadmin") && userRole !== "superadmin") {
        const redirectPath = userRole === "lender" ? "/lender/dashboard" : "/borrower/dashboard";
        return NextResponse.redirect(new URL(redirectPath, request.url));
      }

      // 2. /lender/* routes are ONLY accessible by lender, admin, or superadmin
      if (
        pathname.startsWith("/lender") &&
        userRole !== "lender" &&
        userRole !== "admin" &&
        userRole !== "superadmin"
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
