import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(`
        id, start_time, end_time, modality, status, notes, created_at,
        slot_id, consultant_id,
        services (id, name, slug, duration_minutes),
        availability_slots (id, slot_date, start_time, end_time, modality)
      `)
      .eq("client_id", user.id)
      .order("start_time", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: appointments });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 },
    );
  }
}
