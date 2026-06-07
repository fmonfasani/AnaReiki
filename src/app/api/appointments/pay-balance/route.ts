import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { appointment_id } = await request.json();
    if (!appointment_id) return NextResponse.json({ error: "Falta appointment_id" }, { status: 400 });

    const svc = createServiceClient();
    const { data: appt } = await svc.from("appointments").select("*, services!service_id(name)").eq("id", appointment_id).single();
    if (!appt) return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    if (appt.client_id !== user.id) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    if (appt.approval_status !== "approved") return NextResponse.json({ error: "El turno no está aprobado" }, { status: 400 });
    if (appt.payment_status === "paid") return NextResponse.json({ error: "El turno ya está pago" }, { status: 400 });

    if (new Date(appt.cutoff_at) <= new Date()) {
      return NextResponse.json({ error: "El tiempo para pagar el saldo venció" }, { status: 400 });
    }

    const { createPaymentPreference } = await import("@/lib/mercadopago");
    const result = await createPaymentPreference({
      items: [{
        title: `Saldo restante - ${appt.services?.name || "Servicio"}`,
        quantity: 1,
        unit_price: (appt.balance_cents || 0) / 100,
        currency_id: "ARS",
      }],
      payerEmail: user.email || "",
      backUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://anamurat.online"}/consultantes/mis-citas`,
      notificationUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://anamurat.online"}/api/mercadopago/webhook`,
      externalReference: JSON.stringify({ userId: user.id, appointmentId: appointment_id, type: "balance" }),
      autoReturn: "approved",
    });

    if ("error" in result) {
      return NextResponse.json({ error: "Error al crear el pago" }, { status: 500 });
    }

    await svc.from("appointments").update({ mp_preference_id: result.id }).eq("id", appointment_id);

    return NextResponse.json({
      mp_init_point: result.init_point || result.sandbox_init_point,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error interno" }, { status: 500 });
  }
}
