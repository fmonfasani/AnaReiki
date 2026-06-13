import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const [svcResult, promosResult, sessionsResult] = await Promise.all([
      supabase
        .from("services")
        .select("id, name, slug, description, duration_minutes, is_active, allowed_modalities, price_cents_online, price_cents_presencial")
        .eq("is_active", true)
        .eq("is_visible", true)
        .order("name"),
      supabase
        .from("promotions")
        .select("id, name, description, is_active, service_ids, bundle_price_cents, max_sessions, modality, discount_factor, deposit_type, deposit_value, duration_minutes")
        .eq("is_active", true)
        .eq("is_visible", true),
      supabase
        .from("promotion_sessions")
        .select("promotion_id, service_id"),
    ]);

    if (svcResult.error) {
      return NextResponse.json({ error: svcResult.error.message }, { status: 500 });
    }

    const sessionsByPromo: Record<string, string[]> = {};
    for (const s of sessionsResult.data || []) {
      if (!s.service_id) continue;
      if (!sessionsByPromo[s.promotion_id]) sessionsByPromo[s.promotion_id] = [];
      if (!sessionsByPromo[s.promotion_id].includes(s.service_id)) {
        sessionsByPromo[s.promotion_id].push(s.service_id);
      }
    }

    const promos = (promosResult.data || []).map(p => ({
      ...p,
      service_ids: (sessionsByPromo[p.id] && sessionsByPromo[p.id].length > 0)
        ? sessionsByPromo[p.id]
        : (p.service_ids || []),
    })).filter(p => p.service_ids.length > 0);

    return NextResponse.json({
      data: svcResult.data,
      promos,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 },
    );
  }
}
