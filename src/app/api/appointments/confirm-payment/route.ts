import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getPayment } from "@/lib/mercadopago";
import { sendAppointmentEmail, notifyAdminNewAppointment } from "@/lib/email";
import { saveMpPaymentLog } from "@/lib/mp-payment-log";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/roles";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { payment_id, appointment_id, external_reference } = body;

    let appointmentId = appointment_id || null;
    let paymentType: string | null = null;

    if (!appointmentId && external_reference) {
      try {
        const parsed = JSON.parse(external_reference);
        appointmentId = parsed.appointmentId || null;
        paymentType = parsed.type || null;
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
        .select("id, service_id, start_time, end_time, modality, notes, price_cents, deposit_cents, balance_cents, client_id, payment_status, status, mp_payment_id, promotion_id")
        .eq("id", appointmentId)
        .single();
      appointment = data;
    }

    if (!appointment && payment_id) {
      const { data } = await svc
        .from("appointments")
        .select("id, service_id, start_time, end_time, modality, notes, price_cents, deposit_cents, balance_cents, client_id, payment_status, status, mp_payment_id, promotion_id")
        .eq("mp_payment_id", String(payment_id))
        .maybeSingle();
      appointment = data;
    }

    if (!appointment) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

    const isOwnerOrAdmin = await isAdmin(user, supabase);
    if (appointment.client_id !== user.id && !isOwnerOrAdmin) {
      return NextResponse.json({ error: "No autorizado para confirmar este pago" }, { status: 403 });
    }

    if (appointment.payment_status === "paid" && appointment.status !== "pending_payment") {
      return NextResponse.json({ success: true, status: "already_paid" });
    }

    let verifiedPayment: Awaited<ReturnType<typeof getPayment>> | null = null;

    if (payment_id) {
      const paymentResult = await getPayment(String(payment_id));
      if ("error" in paymentResult) {
        return NextResponse.json({ error: "Error al verificar el pago en Mercado Pago" }, { status: 502 });
      }
      if (paymentResult.status !== "approved") {
        return NextResponse.json({ error: "El pago no ha sido aprobado por Mercado Pago" }, { status: 402 });
      }
      const expectedAmount = (appointment.deposit_cents && appointment.deposit_cents > 0)
        ? appointment.deposit_cents
        : appointment.price_cents;
      if (Math.round(paymentResult.transaction_amount * 100) !== expectedAmount) {
        return NextResponse.json({ error: "El monto del pago no coincide con el servicio" }, { status: 402 });
      }
      verifiedPayment = paymentResult;
    }

    const isBalancePayment = paymentType === "balance";
    let newStatus = appointment.status;
    let newPaymentStatus = "paid";

    if (appointment.status === "pending_payment") {
      newStatus = "pending_confirmation";
    }

    await svc
      .from("appointments")
      .update({
        status: newStatus,
        payment_status: newPaymentStatus,
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

    sendAppointmentEmail("confirmacion", payerEmail, payerName, {
      serviceName: service?.name || "Servicio",
      modality: appointment.modality,
      date: dateStr,
      time: timeStr,
      duration: service?.duration_minutes || 60,
      appointmentId: appointment.id,
    });

    notifyAdminNewAppointment({
      clientName: payerName,
      clientEmail: payerEmail,
      serviceName: service?.name || "Servicio",
      modality: appointment.modality,
      date: dateStr,
      time: timeStr,
      duration: service?.duration_minutes || 60,
    });

    if (verifiedPayment && !("error" in verifiedPayment)) {
      let externalData: Record<string, unknown> | null = null;
      if (verifiedPayment.external_reference) {
        try { externalData = JSON.parse(verifiedPayment.external_reference); } catch { /* */ }
      }
      await saveMpPaymentLog(verifiedPayment, {
        mpPaymentId: verifiedPayment.id,
        appointmentId: appointment.id,
        userId: appointment.client_id,
        paymentType: appointment.promotion_id ? "promo_bundle" : "session",
        externalRef: externalData,
      });
    }

    return NextResponse.json({ success: true, newStatus });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 },
    );
  }
}
