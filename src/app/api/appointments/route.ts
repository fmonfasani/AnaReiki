import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendAppointmentEmail, notifyAdminNewAppointment } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { service_id, slot_id, modality, date: slotDate, time: slotTime, notes } = body;

    if (!service_id || !slot_id || !modality || !slotDate || !slotTime) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: service_id, slot_id, modality, date, time" },
        { status: 400 },
      );
    }

    const { data: slot, error: slotError } = await supabase
      .from("availability_slots")
      .select("id, booked_count, capacity, modality, service_id, owner_id")
      .eq("id", slot_id)
      .eq("is_available", true)
      .single();

    if (slotError || !slot) {
      return NextResponse.json({ error: "Slot no disponible" }, { status: 404 });
    }

    if (slot.booked_count >= slot.capacity) {
      return NextResponse.json({ error: "El slot ya no tiene cupo disponible" }, { status: 409 });
    }

    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("name, duration_minutes, allowed_modalities")
      .eq("id", service_id)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
    }

    if (!service.allowed_modalities?.includes(modality)) {
      return NextResponse.json(
        { error: "Modalidad no permitida para este servicio" },
        { status: 400 },
      );
    }

    const startTime = `${slotDate}T${slotTime}:00`;
    const startDate = new Date(startTime);
    const endDate = new Date(startDate.getTime() + service.duration_minutes * 60000);

    const { data: appointment, error: insertError } = await supabase
      .from("appointments")
      .insert({
        service_id,
        consultant_id: slot.owner_id,
        client_id: user.id,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        modality,
        slot_id,
        notes: notes || null,
        status: "pending",
      })
      .select("id, status, start_time, end_time, modality")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const { error: updateError } = await supabase
      .from("availability_slots")
      .update({ booked_count: slot.booked_count + 1 })
      .eq("id", slot_id);

    if (updateError) {
      console.error("Failed to update slot count:", updateError.message);
    }

    const dateStr = startDate.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
    const timeStr = startDate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

    sendAppointmentEmail("confirmacion", user.email!, user.user_metadata?.full_name || "", {
      serviceName: service.name,
      modality,
      date: dateStr,
      time: timeStr,
      duration: service.duration_minutes,
      notes: notes || null,
      appointmentId: appointment.id,
    });

    notifyAdminNewAppointment({
      clientName: user.user_metadata?.full_name || user.email || "Consultante",
      clientEmail: user.email!,
      serviceName: service.name,
      modality,
      date: dateStr,
      time: timeStr,
      duration: service.duration_minutes,
    });

    return NextResponse.json({ data: appointment }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 },
    );
  }
}
