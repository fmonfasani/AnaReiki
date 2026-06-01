import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForToken } from "@/lib/mercadopago-oauth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL("/admin/pagos?oauth=error&reason=" + error, request.url),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/admin/pagos?oauth=error&reason=no_code", request.url),
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(
      new URL("/login?redirect=/admin/pagos", request.url),
    );
  }

  const result = await exchangeCodeForToken(code, user.id);

  if (!result.success) {
    return NextResponse.redirect(
      new URL(`/admin/pagos?oauth=error&reason=${encodeURIComponent(result.error || "unknown")}`, request.url),
    );
  }

  return NextResponse.redirect(new URL("/admin/pagos?oauth=success", request.url));
}
