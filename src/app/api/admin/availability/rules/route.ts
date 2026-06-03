import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/roles";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dayOfWeek = searchParams.get("day_of_week");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const modality = searchParams.get("modality");
    const active = searchParams.get("is_active");

    let query = supabase
      .from("availability_rules_v2")
      .select("*, services(id, name, slug)")
      .order("day_of_week")
      .order("start_time");

    if (dayOfWeek !== null) {
      query = query.eq("day_of_week", parseInt(dayOfWeek));
    }
    if (from) {
      query = query.gte("specific_date", from);
    }
    if (to) {
      query = query.lte("specific_date", to);
    }
    if (modality) {
      query = query.eq("modality", modality);
    }
    if (active !== null) {
      query = query.eq("is_active", active === "true");
    }

    const { data: rules, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: rules });
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
    if (!(await isAdmin(user, supabase))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const {
      day_of_week,
      specific_date,
      start_time,
      end_time,
      duration_minutes,
      modality,
      session_type,
      max_participants,
      max_online,
      max_presencial,
      service_id,
      is_active,
    } = body;

    if (!start_time || !end_time || !duration_minutes) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: start_time, end_time, duration_minutes" },
        { status: 400 },
      );
    }
    if (day_of_week == null && !specific_date) {
      return NextResponse.json(
        { error: "Se requiere day_of_week o specific_date" },
        { status: 400 },
      );
    }

    const { data: rule, error } = await supabase
      .from("availability_rules_v2")
      .insert({
        day_of_week: day_of_week ?? null,
        specific_date: specific_date || null,
        start_time,
        end_time,
        duration_minutes,
        modality: modality || "both",
        session_type: session_type || "individual",
        max_participants: max_participants ?? 1,
        max_online: max_online ?? null,
        max_presencial: max_presencial ?? null,
        service_id: service_id || null,
        is_active: is_active ?? true,
        created_by: user.id,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: rule }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 },
    );
  }
}
