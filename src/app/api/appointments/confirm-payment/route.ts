import { createServiceClient } from "@/lib/supabase/service";
import { getPayment } from "@/lib/mercadopago";
import { sendAppointmentEmail, notifyAdminNewAppointment } from "@/lib/email";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { payment_id, appointment_id, external_reference } = body;

    let appointmentId = appointment_id || null;

    if (!appointmentId && external_reference) {
      try {
        const parsed = JSON.parse(external_reference);
        appointmentId = parsed.appointmentId || null;
      } catch {
        appointmentId = external_reference;
      }
    }

    if (!appointmentId && payment_id) {
      const paymentResult = await getPayment(String(payment_id));
      if (!("error" in paymentResult)) {
        const extRef = paymentResult.external_reference;
        if (extRef) {
          try {
            const parsed = JSON.parse(extRef);
            appointmentId = parsed.appointmentId || null;
          } catch {
            appointmentId = extRef;
          }
        }
      }
    }

    const svc = createServiceClient();

    let appointment;
    if (appointmentId) {
      const { data } = await svc
        .from("appointments")
        .select("id, service_id, start_time, end_time, modality, notes, price_cents, client_id, payment_status, status, mp_payment_id, approval_status")
        .eq("id", appointmentId)
        .single();
      appointment = data;
    }

    if (!appointment && payment_id) {
      const { data } = await svc
        .from("appointments")
        .select("id, service_id, start_time, end_time, modality, notes, price_cents, client_id, payment_status, status, mp_payment_id, approval_status")
        .eq("mp_payment_id", String(payment_id))
        .maybeSingle();
      appointment = data;
    }

    if (!appointment) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

    if (appointment.payment_status === "paid") {
      return NextResponse.json({ success: true, status: "already_paid" });
    }

    const needsApproval = appointment.approval_status === "pending_approval";
    const newStatus = needsApproval ? "pending_approval" : "pending";

    await svc
      .from("appointments")
      .update({
        status: newStatus,
        payment_status: "paid",
        mp_payment_id: payment_id ? String(payment_id) : appointment.mp_payment_id,
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

    const { data: profile } = await svc
      .from("profiles")
      .select("email, full_name")
      .eq("id", appointment.client_id)
      .single();

    const payerEmail = profile?.email || "";
    const payerName = profile?.full_name || payerEmail;

    if (!needsApproval) {
      sendAppointmentEmail("confirmacion", payerEmail, payerName, {
        serviceName: service?.name || "Servicio",
        modality: appointment.modality,
        date: dateStr,
        time: timeStr,
        duration: service?.duration_minutes || 60,
        notes: appointment.notes,
        appointmentId: appointment.id,
      });
    }

    notifyAdminNewAppointment({
      clientName: payerName,
      clientEmail: payerEmail,
      serviceName: service?.name || "Servicio",
      modality: appointment.modality,
      date: dateStr,
      time: timeStr,
      duration: service?.duration_minutes || 60,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 },
    );
  }
}
