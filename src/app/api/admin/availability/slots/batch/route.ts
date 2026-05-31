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
    const { week_start, modality, service_id, capacity, schedule } = body;

    if (!week_start || !modality || !schedule) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: week_start, modality, schedule" },
        { status: 400 },
      );
    }

    if (!["online", "presencial"].includes(modality)) {
      return NextResponse.json({ error: "Modalidad inválida" }, { status: 400 });
    }

    const dayNames = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const startDate = new Date(week_start);
    const slots: Array<{
      owner_id: string;
      service_id: string | null;
      modality: string;
      slot_date: string;
      start_time: string;
      end_time: string;
      capacity: number;
    }> = [];

    for (const dayName of dayNames) {
      const daySlots = schedule[dayName];
      if (!daySlots || !Array.isArray(daySlots) || daySlots.length === 0) continue;

      const dayIndex = dayNames.indexOf(dayName);
      const slotDate = new Date(startDate);
      slotDate.setDate(slotDate.getDate() + dayIndex);
      const dateStr = slotDate.toISOString().split("T")[0];

      for (const slot of daySlots) {
        if (!slot.start || !slot.end) continue;
        slots.push({
          owner_id: user.id,
          service_id: service_id || null,
          modality,
          slot_date: dateStr,
          start_time: slot.start,
          end_time: slot.end,
          capacity: capacity || 1,
        });
      }
    }

    if (slots.length === 0) {
      return NextResponse.json({ error: "No hay slots para generar" }, { status: 400 });
    }

    const { data: created, error } = await supabase
      .from("availability_slots")
      .insert(slots)
      .select("*");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: created, count: created?.length || 0 }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 },
    );
  }
}
