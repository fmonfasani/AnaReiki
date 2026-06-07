import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";
import { isOwner } from "@/lib/auth/roles";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!(await isOwner(user, supabase))) return NextResponse.json({ error: "Solo el owner puede rechazar" }, { status: 403 });

    const { appointment_id, action } = await request.json();
    if (!appointment_id) return NextResponse.json({ error: "Falta appointment_id" }, { status: 400 });
    if (!action || !["reschedule", "refund"].includes(action)) return NextResponse.json({ error: "Acción inválida: reschedule o refund" }, { status: 400 });

    const svc = createServiceClient();
    const { data: appt } = await svc.from("appointments").select("*, services!service_id(name)").eq("id", appointment_id).single();
    if (!appt) return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    if (appt.approval_status !== "pending_approval") return NextResponse.json({ error: "El turno no está pendiente de aprobación" }, { status: 400 });

    const { error } = await svc.from("appointments").update({
      approval_status: "rejected",
      status: "cancelled",
      rejection_action: action,
      refund_processed: false,
      updated_at: new Date().toISOString(),
    }).eq("id", appointment_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: profile } = await svc.from("profiles").select("email, full_name").eq("id", appt.client_id).single();
    const payerEmail = profile?.email || "";
    const payerName = profile?.full_name || payerEmail;

    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    if (action === "reschedule") {
      const rescheduleUrl = `https://anamurat.online/consultantes/mis-citas?reschedule=${appointment_id}`;
      await resend.emails.send({
        from: process.env.RESEND_FROM || "Ana Reiki <reservas@anamurat.online>",
        to: payerEmail,
        subject: "Tu reserva necesita reprogramación",
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#fdfaf8;padding:32px;border-radius:16px;">
            <h1 style="color:#c36b53;font-size:24px;margin:0 0 16px;">🔄 Necesitamos reprogramar</h1>
            <p style="color:#4a3b3e;margin:0 0 8px;">Hola ${payerName},</p>
            <p style="color:#4a3b3e;margin:0 0 20px;">Por el momento no podemos confirmar el turno. Por favor elegí una nueva fecha para reprogramar. No hay cambios económicos.</p>
            <a href="${rescheduleUrl}" style="display:inline-block;background:#c36b53;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">Reprogramar turno</a>
            <hr style="border:none;border-top:1px solid #f3e8e5;margin:24px 0;"/>
            <p style="font-size:12px;color:#8b7a7d;text-align:center;">Ana Reiki — Terapias Holísticas<br/>anamurat.online</p>
          </div>`,
      });
    } else {
      await resend.emails.send({
        from: process.env.RESEND_FROM || "Ana Reiki <reservas@anamurat.online>",
        to: payerEmail,
        subject: "Reserva cancelada — devolución del depósito",
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#fdfaf8;padding:32px;border-radius:16px;">
            <h1 style="color:#c36b53;font-size:24px;margin:0 0 16px;">❌ Reserva cancelada</h1>
            <p style="color:#4a3b3e;margin:0 0 8px;">Hola ${payerName},</p>
            <p style="color:#4a3b3e;margin:0 0 20px;">Lamentablemente no podemos tomar tu reserva. Te devolveremos el depósito a la brevedad. Cualquier cosa contactanos.</p>
            <hr style="border:none;border-top:1px solid #f3e8e5;margin:24px 0;"/>
            <p style="font-size:12px;color:#8b7a7d;text-align:center;">Ana Reiki — Terapias Holísticas<br/>anamurat.online</p>
          </div>`,
      });
    }

    return NextResponse.json({ success: true, action });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error interno" }, { status: 500 });
  }
}
