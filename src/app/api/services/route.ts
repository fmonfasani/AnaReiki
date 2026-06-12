import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const [svcResult, promosResult] = await Promise.all([
      supabase
        .from("services")
        .select("id, name, slug, description, duration_minutes, is_active, allowed_modalities, price_cents_online, price_cents_presencial")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("promotions")
        .select("id, name, description, is_active, service_ids, bundle_price_cents, max_sessions")
        .eq("is_active", true)
        .not("service_ids", "eq", "{}"),
    ]);

    if (svcResult.error) {
      return NextResponse.json({ error: svcResult.error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: svcResult.data,
      promos: promosResult.data || [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 },
    );
  }
}
