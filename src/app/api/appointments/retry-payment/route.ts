import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { appointmentId } = body;
    if (!appointmentId) {
      return NextResponse.json({ error: "Falta appointmentId" }, { status: 400 });
    }

    const svc = createServiceClient();

    const { data: appointment, error: apptError } = await svc
      .from("appointments")
      .select("id, status, payment_status, price_cents, mp_preference_id, service_id")
      .eq("id", appointmentId)
      .eq("client_id", user.id)
      .single();

    if (apptError || !appointment) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

    if (appointment.status !== "pending_payment") {
      return NextResponse.json({ error: "Este turno no requiere pago" }, { status: 400 });
    }

    const { data: service } = await svc
      .from("services")
      .select("name")
      .eq("id", appointment.service_id)
      .single();

    const { createPaymentPreference } = await import("@/lib/mercadopago");
    const result = await createPaymentPreference({
      items: [{
        title: service?.name || "Sesión",
        quantity: 1,
        unit_price: (appointment.price_cents || 0) / 100,
        currency_id: "ARS",
      }],
      payerEmail: user.email || "",
      backUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://anamurat.online"}/consultantes/reservar/confirmacion`,
      notificationUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://anamurat.online"}/api/mercadopago/webhook`,
      externalReference: JSON.stringify({ userId: user.id, appointmentId: appointment.id }),
      autoReturn: "approved",
    });

    if ("error" in result) {
      console.error("Retry payment MP error:", result.error);
      return NextResponse.json({ error: "Error al crear el pago" }, { status: 500 });
    }

    await svc.from("appointments").update({ mp_preference_id: result.id }).eq("id", appointment.id);

    return NextResponse.json({
      mp_init_point: result.init_point || result.sandbox_init_point,
    });
  } catch (err) {
    console.error("retry-payment error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 },
    );
  }
}
