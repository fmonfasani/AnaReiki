import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendAppointmentEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { createServiceClient } = await import("@/lib/supabase/service");
    const svc = createServiceClient();
    const supabase = await createClient();

    const now = new Date().toISOString();

    await svc.rpc("expire_old_approvals").maybeSingle();

    // Liberar appointments en pending_payment con más de 30 min de antigüedad
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: expiredPayments, error: expireError } = await svc
      .from("appointments")
      .update({
        status: "cancelled",
        payment_status: "failed",
        cancelled_reason: "Pago no completado en el tiempo límite",
        cancelled_at: now,
        updated_at: now,
      })
      .eq("status", "pending_payment")
      .lt("created_at", thirtyMinAgo)
      .select("id");

    if (expireError) {
      console.error("Error liberando pending_payment expirados:", expireError.message);
    } else if (expiredPayments && expiredPayments.length > 0) {
      console.log(`Liberados ${expiredPayments.length} appointments pending_payment expirados`);
    }

    // Cancelar confirmed con cutoff vencido (saldo no pagado a tiempo)
    const { data: cutoffAppts } = await svc
      .from("appointments")
      .update({
        status: "cancelled",
        cancelled_reason: "No pagó el saldo antes del cutoff",
        cancelled_at: now,
        updated_at: now,
      })
      .eq("status", "confirmed")
      .not("balance_cents", "is", null)
      .gt("balance_cents", 0)
      .lte("cutoff_at", now)
      .select("id, client_id, deposit_cents");

    if (cutoffAppts && cutoffAppts.length > 0) {
      console.log(`Cancelados ${cutoffAppts.length} appointments por cutoff de saldo no pagado`);
    }

    const { data: pending, error } = await svc
      .from("appointment_reminders")
      .select("*, appointments!inner(*, profiles!client_id(email, full_name))")
      .eq("status", "pending")
      .lte("scheduled_for", now);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!pending || pending.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    let sent = 0;
    let failed = 0;

    for (const reminder of pending) {
      const appointment = reminder.appointments;
      const clientEmail = appointment.profiles?.email;
      const clientName = appointment.profiles?.full_name || "";

      if (!clientEmail) {
        failed++;
        continue;
      }

      try {
        const startTime = new Date(appointment.start_time);
        const dateStr = startTime.toLocaleDateString("es-AR", {
          weekday: "long", day: "numeric", month: "long",
        });
        const timeStr = startTime.toLocaleTimeString("es-AR", {
          hour: "2-digit", minute: "2-digit",
        });

        await sendAppointmentEmail("confirmacion", clientEmail, clientName, {
          serviceName: "Sesión",
          modality: appointment.modality || "presencial",
          date: dateStr,
          time: timeStr,
          duration: 60,
        });

        await svc
          .from("appointment_reminders")
          .update({ status: "sent", sent_at: now })
          .eq("id", reminder.id);

        sent++;
      } catch (err) {
        failed++;
        await svc
          .from("appointment_reminders")
          .update({
            status: "failed",
            error_message: err instanceof Error ? err.message : "Error",
          })
          .eq("id", reminder.id);
      }
    }

    return NextResponse.json({ sent, failed, total: pending.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 },
    );
  }
}
