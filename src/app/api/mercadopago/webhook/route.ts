import { createServiceClient } from "@/lib/supabase/service";
import { getPayment } from "@/lib/mercadopago";
import { sendAppointmentEmail, notifyAdminNewAppointment } from "@/lib/email";
import { NextResponse } from "next/server";
import crypto from "crypto";

function verifyMpSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;

  const parts = signatureHeader.split(",");
  let ts = "";
  let receivedSignature = "";

  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx);
    const value = part.slice(idx + 1);
    if (key === "ts") ts = value;
    if (key === "v1") receivedSignature = value;
  }

  if (!ts || !receivedSignature) return false;

  let dataId = "";
  try {
    const parsed = JSON.parse(rawBody);
    dataId = parsed.data?.id || parsed.id || "";
  } catch {
    return false;
  }

  if (!dataId) return false;

  const clientSecret = process.env.MP_CLIENT_SECRET;
  if (!clientSecret) return false;

  const template = `id:${dataId};ts:${ts};`;
  const dataToSign = template + rawBody;

  const hmac = crypto.createHmac("sha256", clientSecret);
  hmac.update(dataToSign);
  const computed = hmac.digest("hex");

  if (computed.length !== receivedSignature.length) return false;
  let match = 0;
  for (let i = 0; i < computed.length; i++) {
    match |= computed.charCodeAt(i) ^ receivedSignature.charCodeAt(i);
  }
  return match === 0;
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get("x-signature");

    if (signatureHeader) {
      const valid = verifyMpSignature(rawBody, signatureHeader);
      if (!valid) {
        console.warn("Webhook: invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody);
    const topic = body.topic || body.type;
    const id = body.data?.id || body.id;

    if (!id || topic !== "payment") {
      return NextResponse.json({ received: true });
    }

    const paymentResult = await getPayment(String(id));
    if ("error" in paymentResult) {
      console.error("Webhook: error fetching payment", paymentResult.error);
      return NextResponse.json({ received: true });
    }

    const mpStatus = paymentResult.status;
    const externalRef = paymentResult.external_reference;
    const payerEmail = paymentResult.payer.email;
    const mpPaymentId = String(id);

    const svc = createServiceClient();

    let externalData: Record<string, unknown> | null = null;
    if (externalRef) {
      try {
        externalData = JSON.parse(externalRef);
      } catch {
        externalData = { appointmentId: externalRef };
      }
    }

    // --- Handle promo bundle purchase ---
    if (externalData?.type === "promo_bundle") {
      const promoId = externalData.promoId as string;
      const userId = externalData.userId as string;

      if (mpStatus === "approved") {
        const { data: purchase } = await svc
          .from("promo_purchases")
          .select("id")
          .eq("user_id", userId)
          .eq("promotion_id", promoId)
          .eq("status", "pending")
          .maybeSingle();

        if (purchase) {
          await svc
            .from("promo_purchases")
            .update({
              status: "approved",
              mp_payment_id: mpPaymentId,
              paid_at: new Date().toISOString(),
            })
            .eq("id", purchase.id);
        }
      } else if (mpStatus === "rejected" || mpStatus === "cancelled") {
        const userId = externalData.userId as string;
        const promoId = externalData.promoId as string;
        await svc
          .from("promo_purchases")
          .update({ status: "rejected" })
          .eq("user_id", userId)
          .eq("promotion_id", promoId)
          .eq("status", "pending");
      }

      return NextResponse.json({ received: true });
    }

    // --- Handle appointment payment ---
    let appointmentId: string | null = null;
    if (externalData) {
      appointmentId = (externalData.appointmentId as string) || null;
    }

    let appointment;
    if (appointmentId) {
      const { data } = await svc
        .from("appointments")
        .select("id, service_id, start_time, end_time, modality, notes, price_cents, payment_status")
        .eq("id", appointmentId)
        .single();
      appointment = data;
    }

    if (!appointment) {
      const { data } = await svc
        .from("appointments")
        .select("id, service_id, start_time, end_time, modality, notes, price_cents, payment_status")
        .eq("mp_payment_id", mpPaymentId)
        .maybeSingle();
      appointment = data;
    }

    if (!appointment) {
      console.warn("Webhook: no appointment found for payment", id);
      return NextResponse.json({ received: true });
    }

    if (mpStatus === "approved" && appointment.payment_status !== "paid") {
      await svc
        .from("appointments")
        .update({
          status: "pending",
          payment_status: "paid",
          mp_payment_id: mpPaymentId,
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

      sendAppointmentEmail("confirmacion", payerEmail, payerEmail, {
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
    }

    if (mpStatus === "rejected" || mpStatus === "cancelled") {
      await svc
        .from("appointments")
        .update({ payment_status: "failed" })
        .eq("id", appointment.id);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error", err);
    return NextResponse.json({ received: true });
  }
}
