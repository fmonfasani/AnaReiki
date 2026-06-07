import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";
import { sendAppointmentEmail, notifyAdminNewAppointment } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn("POST /api/appointments – no autorizado (no user)");
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { service_id, modality, slot_start, rule_id, notes } = body;

    if (!service_id || !modality || !slot_start) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: service_id, modality, slot_start" },
        { status: 400 },
      );
    }

    const svc = createServiceClient();

    const slotDate = slot_start.slice(0, 10);
    const { data: slotCheck, error: checkError } = await svc
      .rpc("get_available_slots_v2", {
        p_date: slotDate,
        p_modality: modality,
      });

    if (checkError) {
      console.error("get_available_slots_v2 check error", { slotDate, modality, error: checkError.message });
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    const slot = (slotCheck || []).find(
      (s: { slot_start: string }) => s.slot_start === slot_start,
    );

    if (!slot) {
      console.warn("Slot not found in availability", { slotDate, slot_start, modality });
      return NextResponse.json({ error: "El horario seleccionado ya no está disponible" }, { status: 409 });
    }

    if ((slot.booked || 0) >= (slot.max_participants || 1)) {
      console.warn("Slot fully booked", { slotDate, slot_start, booked: slot.booked, max: slot.max_participants });
      return NextResponse.json({ error: "Ya no hay cupo disponible para este horario" }, { status: 409 });
    }

    const { data: service, error: serviceError } = await svc
      .from("services")
      .select("name, duration_minutes, allowed_modalities, price_cents_online, price_cents_presencial, deposit_percentage")
      .eq("id", service_id)
      .single();

    if (serviceError || !service) {
      console.error("Service not found", { service_id, error: serviceError?.message });
      return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
    }

    if (!service.allowed_modalities?.includes(modality)) {
      return NextResponse.json({ error: "Modalidad no permitida para este servicio" }, { status: 400 });
    }

    let consultant_id: string | null = null;
    if (rule_id) {
      const { data: rule } = await svc
        .from("availability_rules_v2")
        .select("created_by")
        .eq("id", rule_id)
        .single();
      if (rule) consultant_id = rule.created_by;
    }

    if (!consultant_id) {
      const { data: owner } = await svc
        .from("profiles")
        .select("id")
        .eq("role", "owner")
        .limit(1)
        .maybeSingle();
      if (owner) consultant_id = owner.id;
    }

    const startTime = slot_start;
    const startDate = new Date(startTime);
    const endDate = new Date(startDate.getTime() + service.duration_minutes * 60000);
    const priceCents = modality === "online"
      ? (service.price_cents_online || 0)
      : (service.price_cents_presencial || 0);
    const depositPct = service.deposit_percentage || 0;
    const depositCents = depositPct > 0 ? Math.round(priceCents * depositPct / 100) : 0;
    const balanceCents = priceCents - depositCents;
    const needsApproval = depositPct > 0 && balanceCents > 0;

    const { data: appointment, error: insertError } = await svc
      .from("appointments")
      .insert({
        service_id,
        consultant_id,
        client_id: user.id,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        modality,
        notes: notes || null,
        status: needsApproval ? "pending_approval" : (priceCents > 0 ? "pending_payment" : "pending"),
        approval_status: needsApproval ? "pending_approval" : "n/a",
        price_cents: priceCents,
        deposit_cents: depositCents,
        balance_cents: balanceCents,
        payment_status: priceCents > 0 ? "pending_payment" : "pending",
      })
      .select("id, status, start_time, end_time, modality, price_cents, payment_status, deposit_cents, balance_cents, approval_status")
      .single();

    if (insertError) {
      console.error("Appointment insert error", { user: user.id, service_id, slot_start, error: insertError.message });
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    let mpInitPoint: string | null = null;

    if (priceCents > 0) {
      const mpAmount = needsApproval ? depositCents : priceCents;
      const { createPaymentPreference } = await import("@/lib/mercadopago");
      const result = await createPaymentPreference({
        items: [{
          title: needsApproval ? `${service.name} (seña ${depositPct}%)` : service.name,
          quantity: 1,
          unit_price: mpAmount / 100,
          currency_id: "ARS",
        }],
        payerEmail: user.email || "",
        backUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://anamurat.online"}/consultantes/reservar/confirmacion`,
        notificationUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://anamurat.online"}/api/mercadopago/webhook`,
        externalReference: JSON.stringify({ userId: user.id, appointmentId: appointment.id, type: needsApproval ? "deposit" : "full" }),
        autoReturn: "approved",
      });

      if ("error" in result) {
        console.error("MP preference error", result.error);
        return NextResponse.json({ error: "Error al crear el pago" }, { status: 500 });
      }

      mpInitPoint = result.init_point || result.sandbox_init_point || null;
      await svc.from("appointments").update({ mp_preference_id: result.id }).eq("id", appointment.id);
    }

    if (priceCents === 0) {
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
    }

    return NextResponse.json({
      data: appointment,
      mp_init_point: mpInitPoint,
      requires_payment: priceCents > 0,
    }, { status: 201 });
  } catch (err) {
    console.error("POST /api/appointments error", err instanceof Error ? { message: err.message, stack: err.stack } : err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 },
    );
  }
}
