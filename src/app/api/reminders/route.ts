import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const now = new Date().toISOString();

    const { data: pending, error } = await supabase
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
          weekday: "long",
          day: "numeric",
          month: "long",
        });
        const timeStr = startTime.toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
        });

        await resend.emails.send({
          from: "Ana Reiki <onboarding@resend.dev>",
          to: clientEmail,
          subject: "Recordatorio: tenés una cita mañana ✨",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #db2777;">Recordatorio de Cita</h1>
              <p>Hola ${clientName || "!"},</p>
              <p>Te recordamos que tenés una cita agendada:</p>
              <div style="background: #fdf2f8; padding: 16px; border-radius: 12px; margin: 16px 0;">
                <p><strong>Fecha:</strong> ${dateStr}</p>
                <p><strong>Horario:</strong> ${timeStr} hs</p>
              </div>
              <p>Si necesitas reprogramar o cancelar, ingresá a tu panel de consultante.</p>
              <hr style="margin: 32px 0; border-color: #f3f4f6;" />
              <p style="font-size: 12px; color: #9ca3af;">Ana Reiki — Terapias Holísticas</p>
            </div>
          `,
        });

        await supabase
          .from("appointment_reminders")
          .update({ status: "sent", sent_at: now })
          .eq("id", reminder.id);

        sent++;
      } catch (err) {
        failed++;
        await supabase
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
