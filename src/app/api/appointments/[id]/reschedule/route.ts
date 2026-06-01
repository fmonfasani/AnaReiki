import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendAppointmentEmail } from "@/lib/email";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { new_slot_id } = body;

    if (!new_slot_id) {
      return NextResponse.json({ error: "new_slot_id requerido" }, { status: 400 });
    }

    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("id, client_id, slot_id, status, service_id")
      .eq("id", id)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

    if (appointment.client_id !== user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    if (appointment.status === "cancelled") {
      return NextResponse.json({ error: "No se puede reprogramar un turno cancelado" }, { status: 409 });
    }

    const { data: newSlot, error: slotError } = await supabase
      .from("availability_slots")
      .select("id, slot_date, start_time, end_time, modality, capacity, booked_count, is_available")
      .eq("id", new_slot_id)
      .single();

    if (slotError || !newSlot) {
      return NextResponse.json({ error: "Nuevo slot no encontrado" }, { status: 404 });
    }

    if (!newSlot.is_available || newSlot.booked_count >= newSlot.capacity) {
      return NextResponse.json({ error: "El nuevo slot no está disponible" }, { status: 409 });
    }

    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("name, duration_minutes")
      .eq("id", appointment.service_id)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
    }

    const startDate = new Date(`${newSlot.slot_date}T${newSlot.start_time}`);
    const endDate = new Date(startDate.getTime() + service.duration_minutes * 60000);

    const { data: oldSlot } = appointment.slot_id
      ? await supabase
          .from("availability_slots")
          .select("booked_count")
          .eq("id", appointment.slot_id)
          .single()
      : { data: { booked_count: 0 } };

    const { error: updateError } = await supabase
      .from("appointments")
      .update({
        slot_id: new_slot_id,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (appointment.slot_id) {
      await supabase
        .from("availability_slots")
        .update({ booked_count: Math.max(0, (oldSlot as unknown as { booked_count: number }).booked_count - 1) })
        .eq("id", appointment.slot_id);
    }

    await supabase
      .from("availability_slots")
      .update({ booked_count: newSlot.booked_count + 1 })
      .eq("id", new_slot_id);

    const dateStr = startDate.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
    const timeStr = startDate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

    sendAppointmentEmail("reprogramacion", user.email!, user.user_metadata?.full_name || "", {
      serviceName: service.name,
      modality: newSlot.modality,
      date: dateStr,
      time: timeStr,
      duration: service.duration_minutes,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 },
    );
  }
}
