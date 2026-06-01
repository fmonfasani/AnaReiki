import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ connected: false });

  const { data: token } = await supabase
    .from("mp_credentials")
    .select("mp_user_id, token_expires_at, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!token) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({
    connected: true,
    mp_user_id: token.mp_user_id,
    token_expires_at: token.token_expires_at,
    is_expired: new Date(token.token_expires_at) <= new Date(),
  });
}
