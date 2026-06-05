import { createServiceClient } from "@/lib/supabase/service";
import { getPayment } from "@/lib/mercadopago";
import { sendAppointmentEmail, notifyAdminNewAppointment } from "@/lib/email";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { payment_id } = await request.json();
    if (!payment_id) {
      return NextResponse.json({ error: "payment_id requerido" }, { status: 400 });
    }

    const paymentResult = await getPayment(String(payment_id));
    if ("error" in paymentResult) {
      return NextResponse.json({ error: paymentResult.error }, { status: 500 });
    }

    const mpStatus = paymentResult.status;
    const externalRef = paymentResult.external_reference;
    const payerEmail = paymentResult.payer.email;

    let appointmentId: string | null = null;
    if (externalRef) {
      try {
        const parsed = JSON.parse(externalRef);
        appointmentId = parsed.appointmentId || null;
      } catch {
        appointmentId = externalRef;
      }
    }

    const svc = createServiceClient();

    let appointment;
    if (appointmentId) {
      const { data } = await svc
        .from("appointments")
        .select("id, service_id, start_time, end_time, modality, notes, price_cents, client_id")
        .eq("id", appointmentId)
        .single();
      appointment = data;
    }

    if (!appointment) {
      const { data } = await svc
        .from("appointments")
        .select("id, service_id, start_time, end_time, modality, notes, price_cents, client_id")
        .eq("payment_status", "pending_payment")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      appointment = data;
    }

    if (!appointment) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

    if (mpStatus === "approved") {
      await svc
        .from("appointments")
        .update({
          status: "pending",
          payment_status: "paid",
          mp_payment_id: String(payment_id),
        })
        .eq("id", appointment.id);

      const startDate = new Date(appointment.start_time);
      const dateStr = startDate.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
      const timeStr = startDate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

      const { data: service } = await svc
        .from("services")
        .select("name, duration_minutes")
        .eq("id", appointment.service_id)
        .single();

      const payerName = payerEmail;

      sendAppointmentEmail("confirmacion", payerEmail, payerName, {
        serviceName: service?.name || "Servicio",
        modality: appointment.modality,
        date: dateStr,
        time: timeStr,
        duration: service?.duration_minutes || 60,
        notes: appointment.notes,
        appointmentId: appointment.id,
      });

      notifyAdminNewAppointment({
        clientName: payerEmail,
        clientEmail: payerEmail,
        serviceName: service?.name || "Servicio",
        modality: appointment.modality,
        date: dateStr,
        time: timeStr,
        duration: service?.duration_minutes || 60,
      });

      return NextResponse.json({ success: true });
    }

    if (mpStatus === "rejected" || mpStatus === "cancelled") {
      await svc
        .from("appointments")
        .update({ payment_status: "failed" })
        .eq("id", appointment.id);

      return NextResponse.json({ success: true, status: "rejected" });
    }

    return NextResponse.json({ success: true, status: mpStatus });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 },
    );
  }
}
