import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/roles";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !(await isAdmin(user, supabase))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { appointment_id } = body;
    if (!appointment_id) {
      return NextResponse.json({ error: "Falta appointment_id" }, { status: 400 });
    }

    const svc = createServiceClient();

    const { data: appointment, error: apptError } = await svc
      .from("appointments")
      .select("id, balance_cents, status, payment_status, client_id, service_id, promotion_id, services(name), promotions(name)")
      .eq("id", appointment_id)
      .single();

    if (apptError || !appointment) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

    if (!appointment.balance_cents || appointment.balance_cents <= 0) {
      return NextResponse.json({ error: "Este turno no tiene saldo pendiente" }, { status: 400 });
    }

    const paidAmount = appointment.balance_cents;

    await svc
      .from("appointments")
      .update({
        balance_cents: 0,
        status: "confirmed",
      })
      .eq("id", appointment.id);

    // Log the offline payment
    const serviceName = (appointment as any).services?.name || null;
    const promoName = (appointment as any).promotions?.name || null;
    const concept = promoName
      ? `Saldo promo: ${promoName} (${serviceName || "servicio"})`
      : serviceName
        ? `Saldo servicio: ${serviceName}`
        : "Saldo pagado offline";

    await svc.from("mp_payment_logs").insert({
      mp_payment_id: null,
      appointment_id: appointment.id,
      user_id: appointment.client_id,
      payment_type: "offline_balance",
      status: "approved",
      transaction_amount: paidAmount / 100,
      currency_id: "ARS",
      net_received_amount: paidAmount / 100,
      total_paid_amount: paidAmount / 100,
      fee_details: [],
      payer_email: null,
      payment_method_id: "offline",
      concept,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("mark-balance-paid error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 },
    );
  }
}
