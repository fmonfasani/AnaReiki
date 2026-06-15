import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/roles";
import { sendAppointmentEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!(await isAdmin(user, supabase))) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const { appointment_id } = await request.json();
    if (!appointment_id) return NextResponse.json({ error: "Falta appointment_id" }, { status: 400 });

    const svc = createServiceClient();
    const { data: appt } = await svc.from("appointments").select("*, services!service_id(name)").eq("id", appointment_id).single();
    if (!appt) return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    if (appt.status !== "pending_confirmation") return NextResponse.json({ error: "El turno no está pendiente de confirmación" }, { status: 400 });

    const { error } = await svc.from("appointments").update({
      status: "confirmed",
      updated_at: new Date().toISOString(),
    }).eq("id", appointment_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await svc.from("appointment_audit_log").insert({
      appointment_id,
      actor_user_id: user.id,
      action: "confirmed",
      from_status: "pending_confirmation",
      to_status: "confirmed",
    });

    const startDate = new Date(appt.start_time);
    const dateStr = startDate.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
    const timeStr = startDate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

    const { data: profile } = await svc.from("profiles").select("email, full_name").eq("id", appt.client_id).single();
    const payerEmail = profile?.email || "";
    const payerName = profile?.full_name || payerEmail;

    sendAppointmentEmail("confirmacion", payerEmail, payerName, {
      serviceName: appt.services?.name || "Servicio",
      modality: appt.modality,
      date: dateStr,
      time: timeStr,
      duration: appt.end_time ? Math.round((new Date(appt.end_time).getTime() - new Date(appt.start_time).getTime()) / 60000) : 60,
      notes: appt.notes,
      appointmentId: appt.id,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error interno" }, { status: 500 });
  }
}
