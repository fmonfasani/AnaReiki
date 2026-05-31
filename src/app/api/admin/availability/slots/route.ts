import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function checkOwner(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  return profile?.role === "owner";
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const modality = searchParams.get("modality");

    let query = supabase
      .from("availability_slots")
      .select("*, services(id, name, slug)")
      .order("slot_date")
      .order("start_time");

    if (date) {
      query = query.eq("slot_date", date);
    }
    if (from) {
      query = query.gte("slot_date", from);
    }
    if (to) {
      query = query.lte("slot_date", to);
    }
    if (modality) {
      query = query.eq("modality", modality);
    }

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

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!(await checkOwner(supabase, user.id))) {
      return NextResponse.json({ error: "Solo el owner puede gestionar disponibilidad" }, { status: 403 });
    }

    const body = await request.json();
    const { date, start, end, modality, service_id, capacity, notes } = body;

    if (!date || !start || !end || !modality) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: date, start, end, modality" },
        { status: 400 },
      );
    }

    if (!["online", "presencial"].includes(modality)) {
      return NextResponse.json(
        { error: "Modalidad inválida. Debe ser 'online' o 'presencial'" },
        { status: 400 },
      );
    }

    const { data: slot, error } = await supabase
      .from("availability_slots")
      .insert({
        owner_id: user.id,
        service_id: service_id || null,
        modality,
        slot_date: date,
        start_time: start,
        end_time: end,
        capacity: capacity || 1,
        notes: notes || null,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: slot }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 },
    );
  }
}
