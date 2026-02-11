import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  // 1. Session Refresh (Always run first!)
  // This updates the session cookie and handles redirects if unauthenticated
  let response = await updateSession(request);

  // If updateSession already redirected (e.g. to /login), we stop here
  if (
    response.headers.get("x-middleware-rewrite") ||
    response.status === 307 ||
    response.status === 308
  ) {
    return response;
  }

  // 2. Redirect authenticated users away from login/registro pages
  if (
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/registro")
  ) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      return NextResponse.redirect(new URL("/miembros", request.url));
    }
  }

  // 3. Admin routes are protected by layout/page components
  // We just ensure session exists here (handled by updateSession above)

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
