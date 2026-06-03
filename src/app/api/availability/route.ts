import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const modality = searchParams.get("modality");

    const supabase = await createClient();

    if (from && to) {
      const { data: dates, error } = await supabase
        .rpc("get_available_dates_v2", {
          p_from: from,
          p_to: to,
          p_modality: modality || null,
        });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data: dates.map((d: { slot_date: string }) => ({ slot_date: d.slot_date })) });
    }

    const targetDate = date || new Date().toISOString().split("T")[0];

    const { data: slots, error } = await supabase
      .rpc("get_available_slots_v2", {
        p_date: targetDate,
        p_modality: modality || null,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: slots });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 },
    );
  }
}
