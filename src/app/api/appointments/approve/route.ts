import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";
import { isOwner } from "@/lib/auth/roles";
import { sendAppointmentEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!(await isOwner(user, supabase))) return NextResponse.json({ error: "Solo el owner puede aprobar" }, { status: 403 });

    const { appointment_id } = await request.json();
    if (!appointment_id) return NextResponse.json({ error: "Falta appointment_id" }, { status: 400 });

    const svc = createServiceClient();
    const { data: appt } = await svc.from("appointments").select("*, services!service_id(name)").eq("id", appointment_id).single();
    if (!appt) return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    if (appt.approval_status !== "pending_approval") return NextResponse.json({ error: "El turno no está pendiente de aprobación" }, { status: 400 });

    const cutoffAt = new Date(new Date(appt.start_time).getTime() - 60 * 60 * 1000).toISOString();
    const { error } = await svc.from("appointments").update({
      approval_status: "approved",
      status: "approved",
      cutoff_at: cutoffAt,
      updated_at: new Date().toISOString(),
    }).eq("id", appointment_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const startDate = new Date(appt.start_time);
    const dateStr = startDate.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
    const timeStr = startDate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

    const { data: profile } = await svc.from("profiles").select("email, full_name").eq("id", appt.client_id).single();
    const payerEmail = profile?.email || "";
    const payerName = profile?.full_name || payerEmail;

    const balance = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format((appt.balance_cents || 0) / 100);
    const payUrl = `https://anamurat.online/consultantes/mis-citas?pay=${appointment_id}`;

    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM || "Ana Reiki <reservas@anamurat.online>",
      to: payerEmail,
      subject: "Reserva aprobada — pagá el resto",
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#fdfaf8;padding:32px;border-radius:16px;">
          <h1 style="color:#c36b53;font-size:24px;margin:0 0 16px;">✅ Tu reserva fue aprobada</h1>
          <p style="color:#4a3b3e;margin:0 0 8px;">Hola ${payerName},</p>
          <p style="color:#4a3b3e;margin:0 0 20px;">Ana aprobó tu reserva. Tenés que pagar el saldo restante de <strong>${balance}</strong> antes de <strong>${timeStr} hs del ${dateStr}</strong> (1 hora antes del turno).</p>
          <div style="background:white;padding:20px;border-radius:12px;border:1px solid #f3e8e5;margin-bottom:24px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:8px 0;color:#8b7a7d;font-size:14px;">Servicio</td><td style="padding:8px 0;font-weight:600;color:#4a3b3e;">${appt.services?.name || "Servicio"}</td></tr>
              <tr><td style="padding:8px 0;color:#8b7a7d;font-size:14px;">Fecha</td><td style="padding:8px 0;font-weight:600;color:#4a3b3e;">${dateStr}</td></tr>
              <tr><td style="padding:8px 0;color:#8b7a7d;font-size:14px;">Horario</td><td style="padding:8px 0;font-weight:600;color:#4a3b3e;">${timeStr} hs</td></tr>
              <tr><td style="padding:8px 0;color:#8b7a7d;font-size:14px;">Saldo pendiente</td><td style="padding:8px 0;font-weight:700;color:#c36b53;">${balance}</td></tr>
            </table>
          </div>
          <a href="${payUrl}" style="display:inline-block;background:#c36b53;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">Pagar saldo</a>
          <p style="color:#8b7a7d;font-size:12px;margin-top:16px;">Si no pagás antes de 1 hora del turno, la reserva se cancelará automáticamente.</p>
          <hr style="border:none;border-top:1px solid #f3e8e5;margin:24px 0;"/>
          <p style="font-size:12px;color:#8b7a7d;text-align:center;">Ana Reiki — Terapias Holísticas<br/>anamurat.online</p>
        </div>`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error interno" }, { status: 500 });
  }
}
