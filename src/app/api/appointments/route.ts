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
    const { service_id, modality, slot_start, rule_id, notes, promotion_id } = body;

    if (!service_id || !modality || !slot_start) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: service_id, modality, slot_start" },
        { status: 400 },
      );
    }

    const svc = createServiceClient();

    const slotDate = new Date(slot_start).toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
    const { data: slotCheck, error: checkError } = await svc
      .rpc("get_available_slots_v2", {
        p_date: slotDate,
        p_modality: modality,
      });

    if (checkError) {
      console.error("get_available_slots_v2 check error", { slotDate, modality, error: checkError.message });
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    const slotTs = new Date(slot_start).getTime();
    const slot = (slotCheck || []).find(
      (s: { slot_start: string }) => new Date(s.slot_start).getTime() === slotTs,
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
      .select("name, duration_minutes, allowed_modalities, price_cents")
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

    // Si es una promo, calcular duracion total y precio del paquete
    let promoDuration = service.duration_minutes;
    let basePriceCents = service.price_cents || 0;
    let promoServiceIds: string[] | null = null;

    if (promotion_id) {
      const { data: promo } = await svc
        .from("promotions")
        .select("id, service_ids, duration_minutes, discount_factor, modality, deposit_type, deposit_value, bundle_price_cents")
        .eq("id", promotion_id)
        .single();

      if (promo) {
        const psIds: string[] = promo.service_ids || [];
        promoServiceIds = psIds;

        if (promo.duration_minutes) {
          promoDuration = promo.duration_minutes;
        } else if (psIds.length > 0) {
          const { data: promoSevices } = await svc
            .from("services")
            .select("duration_minutes")
            .in("id", psIds);
          promoDuration = (promoSevices || []).reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
        }

        const priceField = promo.modality === "online" ? "price_cents_online" : "price_cents_presencial";
        if (psIds.length > 0) {
          const { data: promoSevices } = await svc
            .from("services")
            .select(priceField)
            .in("id", psIds);
          const subtotal = (promoSevices || []).reduce((sum: number, s: any) => sum + (s[priceField] || 0), 0);
          basePriceCents = Math.round(subtotal * (promo.discount_factor ?? 1));
        }
      }
    }

    const startTime = slot_start;
    const startDate = new Date(startTime);
    const endDate = new Date(startDate.getTime() + promoDuration * 60000);

    const promoNotes = promoServiceIds && promoServiceIds.length > 0
      ? `${notes || ""}\n\n🧺 Promo: ${promotion_id || ""}\nServicios incluidos: ${promoServiceIds.join(", ")}`.trim()
      : notes;

    let finalPriceCents = basePriceCents;
    let discountCents = 0;
    let resolvedPromotionId: string | null = null;
    let usedPromoPurchaseId: string | null = null;

    // Check if user has an active promo purchase covering this service
    if (basePriceCents > 0) {
      const { data: activePurchases } = await svc
        .from("promo_purchases")
        .select("id, promotion_id, sessions_remaining")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .gt("sessions_remaining", 0);

      if (activePurchases?.length) {
        const purchaseIds = activePurchases.map(p => p.promotion_id);
        const { data: promoSessionLinks } = await svc
          .from("promotion_sessions")
          .select("promotion_id")
          .eq("service_id", service_id)
          .in("promotion_id", purchaseIds);

        const matchedPromoIds = new Set((promoSessionLinks || []).map(ps => ps.promotion_id));
        const matching = activePurchases.find(p => matchedPromoIds.has(p.promotion_id));

        if (matching) {
          finalPriceCents = 0;
          discountCents = basePriceCents;
          resolvedPromotionId = matching.promotion_id;
          usedPromoPurchaseId = matching.id;
        }
      }
    }

    // Para promos paquete (multi-servicio), el precio ya se calculó completo
    if (promoServiceIds && promoServiceIds.length > 0) {
      finalPriceCents = basePriceCents;
      resolvedPromotionId = promotion_id;
    } else if (!usedPromoPurchaseId && promotion_id && basePriceCents > 0) {
      const { data: promoData } = await supabase
        .rpc("get_available_promos", {
          p_service_id: service_id,
          p_tier: null,
        });

      const matched = (promoData || []).find((p: { id: string }) => p.id === promotion_id);
      if (matched) {
        finalPriceCents = matched.final_price_cents;
        discountCents = basePriceCents - finalPriceCents;
        resolvedPromotionId = promotion_id;
      }
    }

    const priceCents = finalPriceCents;
    const finalDiscount = discountCents;

    const appointmentServiceId = promoServiceIds ? (service_id || promoServiceIds[0]) : service_id;

    const { data: appointment, error: insertError } = await svc
      .from("appointments")
      .insert({
        service_id: appointmentServiceId,
        consultant_id,
        client_id: user.id,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        modality,
        notes: promoServiceIds ? promoNotes : (notes || null),
        status: priceCents > 0 ? "pending_payment" : "pending",
        price_cents: priceCents,
        payment_status: priceCents > 0 ? "pending_payment" : "pending",
        promotion_id: resolvedPromotionId || promotion_id,
        discount_cents: finalDiscount,
        original_price_cents: basePriceCents,
      })
      .select("id, status, start_time, end_time, modality, price_cents, payment_status, promotion_id, discount_cents, original_price_cents")
      .single();

    if (insertError) {
      console.error("Appointment insert error", { user: user.id, service_id, slot_start, error: insertError.message });
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    if (usedPromoPurchaseId) {
      await svc.rpc("decrement_promo_session", { p_purchase_id: usedPromoPurchaseId });
    }

    let mpInitPoint: string | null = null;

    if (priceCents > 0) {
      const { createPaymentPreference } = await import("@/lib/mercadopago");
      const result = await createPaymentPreference({
        items: [{
          title: service.name,
          quantity: 1,
          unit_price: priceCents / 100,
          currency_id: "ARS",
        }],
        payerEmail: user.email || "",
        backUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://anamurat.online"}/consultantes/reservar/confirmacion`,
        notificationUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://anamurat.online"}/api/mercadopago/webhook`,
        externalReference: JSON.stringify({ userId: user.id, appointmentId: appointment.id, type: "full" }),
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
