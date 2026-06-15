import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { attendance_result } = body;

    if (!attendance_result || !["attended", "no_show", "rescheduled"].includes(attendance_result)) {
      return NextResponse.json({ error: "attendance_result inválido: attended, no_show, o rescheduled" }, { status: 400 });
    }

    const svc = createServiceClient();

    const { data: appointment, error: fetchError } = await svc
      .from("appointments")
      .select("id, status, client_id, service_id, consultant_id, modality, notes, price_cents, deposit_cents, balance_cents, payment_status, promotion_id, start_time, end_time, services(name, duration_minutes)")
      .eq("id", id)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

    if (appointment.status !== "confirmed") {
      return NextResponse.json({ error: "Solo se puede completar un turno confirmado" }, { status: 400 });
    }

    const { error: completeError } = await svc.rpc("complete_appointment", {
      p_appointment_id: id,
      p_attendance_result: attendance_result,
      p_completed_by: user.id,
    });

    if (completeError) {
      return NextResponse.json({ error: completeError.message }, { status: 500 });
    }

    if (attendance_result === "rescheduled") {
      const { new_start, new_end } = body;
      if (!new_start || !new_end) {
        return NextResponse.json({ error: "Falta new_start y new_end para rescheduled" }, { status: 400 });
      }

      const { data: rescheduleResult, error: rescheduleError } = await svc.rpc("reschedule_from_attendance", {
        p_appointment_id: id,
        p_new_start_time: new_start,
        p_new_end_time: new_end,
        p_rescheduled_by: user.id,
      });

      if (rescheduleError) {
        return NextResponse.json({ error: rescheduleError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        rescheduled: true,
        new_appointment_id: rescheduleResult?.id,
      });
    }

    return NextResponse.json({ success: true, rescheduled: false });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 },
    );
  }
}
