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
      .select("id, balance_cents, status, payment_status")
      .eq("id", appointment_id)
      .single();

    if (apptError || !appointment) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

    if (!appointment.balance_cents || appointment.balance_cents <= 0) {
      return NextResponse.json({ error: "Este turno no tiene saldo pendiente" }, { status: 400 });
    }

    await svc
      .from("appointments")
      .update({
        balance_cents: 0,
        status: "confirmed",
      })
      .eq("id", appointment.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("mark-balance-paid error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 },
    );
  }
}
