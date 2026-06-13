import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const modality = searchParams.get("modality");
    const serviceId = searchParams.get("service_id");

    const supabase = await createClient();

    if (from && to) {
      const { data: dates, error } = await supabase
        .rpc("get_available_dates_v2", {
          p_from: from,
          p_to: to,
          p_modality: modality || null,
          p_service_id: serviceId || null,
        });

      if (error) {
        console.error("get_available_dates_v2 error", { from, to, modality, serviceId, error: error.message });
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      let result = dates.map((d: { slot_date: string }) => ({ slot_date: d.slot_date }));
      return NextResponse.json({ data: result });
    }

    const targetDate = date || new Date().toISOString().split("T")[0];

    const { data: slots, error } = await supabase
      .rpc("get_available_slots_v2", {
        p_date: targetDate,
        p_modality: modality || null,
      });

    if (error) {
      console.error("get_available_slots_v2 error", { date: targetDate, modality, error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let result = slots;
    if (serviceId && Array.isArray(slots)) {
      result = slots.filter((s: { service_id: string | null }) => !s.service_id || s.service_id === serviceId);
    }
    if (Array.isArray(result)) {
      const seen = new Set<string>();
      result = result.filter((s: { slot_start: string; service_id: string | null }) => {
        const key = `${s.slot_start}-${s.service_id || "null"}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("Availability API error", err instanceof Error ? { message: err.message, stack: err.stack } : err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 },
    );
  }
}
