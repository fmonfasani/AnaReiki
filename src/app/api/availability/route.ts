import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const modality = searchParams.get("modality");

    const supabase = await createClient();

    let query = supabase
      .from("availability_slots")
      .select("id, owner_id, service_id, modality, slot_date, start_time, end_time, capacity, booked_count, is_available, notes")
      .eq("is_available", true);

    if (date) {
      query = query.eq("slot_date", date);
    }
    if (modality) {
      query = query.eq("modality", modality);
    }

    query = query.order("slot_date").order("start_time");

    const { data: slots, error } = await query;

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
