import { createClient } from "@/lib/supabase/server";
import { getMpAuthUrl } from "@/lib/mercadopago-oauth";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const url = getMpAuthUrl();
  if (url === "#") {
    return NextResponse.json({ error: "MP OAuth no configurado" }, { status: 500 });
  }

  return NextResponse.redirect(url);
}
