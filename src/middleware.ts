import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  // Proteger rutas de miembros
  if (request.nextUrl.pathname.startsWith("/miembros")) {
    return await updateSession(request);
  }

  // Redirect authenticated users away from login/registro pages
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
      // Check for admin role if accessing /admin
      if (request.nextUrl.pathname.startsWith("/admin")) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role !== "admin") {
          return NextResponse.redirect(new URL("/", request.url));
        }
      }

      return NextResponse.redirect(new URL("/miembros", request.url));
    }
  }

  // Protect /admin routes for non-authenticated users
  if (request.nextUrl.pathname.startsWith("/admin")) {
    return await updateSession(request);
  }

  return NextResponse.next();
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
