import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const svc = createServiceClient();
  const { data: purchases } = await svc
    .from("promo_purchases")
    .select("id, promotion_id, sessions_remaining, status, paid_at, promotion:promotions(id, name, description, bundle_price_cents, max_sessions)")
    .eq("user_id", user.id)
    .eq("status", "approved")
    .gt("sessions_remaining", 0)
    .order("paid_at", { ascending: false });

  return NextResponse.json({ data: purchases || [] });
}
