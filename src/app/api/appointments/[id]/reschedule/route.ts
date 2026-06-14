import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
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
      console.warn("Reschedule - no autorizado (no user)");
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { new_slot_id, new_slot_start, new_rule_id } = body;

    if (!new_slot_id && !(new_slot_start && new_rule_id)) {
      return NextResponse.json(
        { error: "Requerido: new_slot_id (v1) o new_slot_start + new_rule_id (v2)" },
        { status: 400 },
      );
    }

    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("id, client_id, slot_id, status, service_id, consultant_id")
      .eq("id", id)
      .single();

    if (fetchError || !appointment) {
      console.warn("Reschedule - turno no encontrado", { id, error: fetchError?.message });
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

    if (appointment.client_id !== user.id) {
      console.warn("Reschedule - cliente no autorizado", { appointmentClientId: appointment.client_id, userId: user.id });
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    if (appointment.status === "cancelled") {
      console.warn("Reschedule - turno cancelado", { id });
      return NextResponse.json({ error: "No se puede reprogramar un turno cancelado" }, { status: 409 });
    }

    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("name, duration_minutes")
      .eq("id", appointment.service_id)
      .single();

    if (serviceError || !service) {
      console.error("Reschedule - servicio no encontrado", { serviceId: appointment.service_id, error: serviceError?.message });
      return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
    }

    const serviceSb = createServiceClient();
    let newStartTime: Date;
    let newEndTime: Date;
    let modality = "";

    if (new_slot_id) {
      const { data: newSlot, error: slotError } = await supabase
        .from("availability_slots")
        .select("id, slot_date, start_time, end_time, modality, capacity, booked_count, is_available")
        .eq("id", new_slot_id)
        .single();

      if (slotError || !newSlot) {
        console.error("Reschedule - v1 slot no encontrado", { new_slot_id, error: slotError?.message });
        return NextResponse.json({ error: "Nuevo slot no encontrado" }, { status: 404 });
      }
      if (!newSlot.is_available || newSlot.booked_count >= newSlot.capacity) {
        console.warn("Reschedule - v1 slot no disponible", { new_slot_id, is_available: newSlot.is_available, booked_count: newSlot.booked_count, capacity: newSlot.capacity });
        return NextResponse.json({ error: "El nuevo slot no está disponible" }, { status: 409 });
      }

      newStartTime = new Date(`${newSlot.slot_date}T${newSlot.start_time}`);
      newEndTime = new Date(newStartTime.getTime() + service.duration_minutes * 60000);
      modality = newSlot.modality;

      if (appointment.slot_id) {
        const { data: oldSlot } = await supabase
          .from("availability_slots")
          .select("booked_count")
          .eq("id", appointment.slot_id)
          .single();
        await supabase
          .from("availability_slots")
          .update({ booked_count: Math.max(0, (oldSlot as unknown as { booked_count: number }).booked_count - 1) })
          .eq("id", appointment.slot_id);
      }

      await supabase
        .from("availability_slots")
        .update({ booked_count: newSlot.booked_count + 1 })
        .eq("id", new_slot_id);

      await supabase
        .from("appointments")
        .update({
          slot_id: new_slot_id,
          start_time: newStartTime.toISOString(),
          end_time: newEndTime.toISOString(),
        })
        .eq("id", id);
    } else {
      const slotDate = new Date(new_slot_start).toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
      const { data: slots, error: slotsError } = await serviceSb.rpc("get_available_slots_v2", {
        p_date: slotDate,
        p_modality: null,
      });

      if (slotsError || !Array.isArray(slots)) {
        console.error("Reschedule - get_available_slots_v2 error", { new_slot_start, new_rule_id, error: slotsError?.message });
        return NextResponse.json({ error: "Error al validar disponibilidad" }, { status: 500 });
      }

      const targetTs = new Date(new_slot_start).getTime();
      const target = slots.find(
        (s: { slot_start: string }) => new Date(s.slot_start).getTime() === targetTs,
      );

      if (!target) {
        console.warn("Reschedule - slot no disponible en v2", { new_slot_start });
        return NextResponse.json({ error: "El horario seleccionado ya no está disponible" }, { status: 409 });
      }

      newStartTime = new Date(new_slot_start);
      newEndTime = new Date(newStartTime.getTime() + service.duration_minutes * 60000);
      modality = (target as { modality: string }).modality;

      if (appointment.slot_id) {
        await supabase
          .from("availability_slots")
          .update({ booked_count: 0 })
          .eq("id", appointment.slot_id);
      }

      await supabase
        .from("appointments")
        .update({
          slot_id: null,
          start_time: newStartTime.toISOString(),
          end_time: newEndTime.toISOString(),
        })
        .eq("id", id);
    }

    const dateStr = newStartTime.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
    const timeStr = newStartTime.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

    sendAppointmentEmail("reprogramacion", user.email!, user.user_metadata?.full_name || "", {
      serviceName: service.name,
      modality,
      date: dateStr,
      time: timeStr,
      duration: service.duration_minutes,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reschedule error", err instanceof Error ? { message: err.message, stack: err.stack } : err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 },
    );
  }
}
