import { Resend } from "resend";

let resendInstance: Resend | null = null;
function getResend(): Resend {
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY || "");
  }
  return resendInstance;
}
const RESEND_FROM = process.env.RESEND_FROM || "Ana Reiki <reservas@anamurat.online>";

const modalityLabel = (m: string) => m === "online" ? "Online (Zoom/Meet)" : "Presencial";

function emailLayout(subject: string, content: string) {
  return `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; background: #fdfaf8; padding: 32px; border-radius: 16px;">
      ${content}
      <hr style="border: none; border-top: 1px solid #f3e8e5; margin: 24px 0;" />
      <p style="font-size: 12px; color: #8b7a7d; text-align: center;">
        Ana Reiki — Terapias Holísticas<br/>anamurat.online
      </p>
    </div>`;
}

function appointmentTable(data: { serviceName: string; modality: string; date: string; time: string; duration: number }) {
  return `
    <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #f3e8e5; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #8b7a7d; font-size: 14px;">Servicio</td><td style="padding: 8px 0; font-weight: 600; color: #4a3b3e;">${data.serviceName}</td></tr>
        <tr><td style="padding: 8px 0; color: #8b7a7d; font-size: 14px;">Modalidad</td><td style="padding: 8px 0; font-weight: 600; color: #4a3b3e;">${modalityLabel(data.modality)}</td></tr>
        <tr><td style="padding: 8px 0; color: #8b7a7d; font-size: 14px;">Fecha</td><td style="padding: 8px 0; font-weight: 600; color: #4a3b3e;">${data.date}</td></tr>
        <tr><td style="padding: 8px 0; color: #8b7a7d; font-size: 14px;">Horario</td><td style="padding: 8px 0; font-weight: 600; color: #4a3b3e;">${data.time} hs</td></tr>
        <tr><td style="padding: 8px 0; color: #8b7a7d; font-size: 14px;">Duración</td><td style="padding: 8px 0; font-weight: 600; color: #4a3b3e;">${data.duration} min</td></tr>
      </table>
    </div>`;
}

type EmailResult = { success: boolean; error?: string };

async function sendEmail(to: string, subject: string, html: string): Promise<EmailResult> {
  try {
    const { error } = await getResend().emails.send({ from: RESEND_FROM, to, subject, html });
    if (error) {
      const msg = `Email error [${subject}] to=${to}: ${error.message}`;
      if (error.statusCode === 403 && error.message?.includes("1010")) {
        console.warn(msg + " — Resend requiere verificar el dominio anamurat.online");
      } else {
        console.error(msg, error);
      }
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = `Email send failed [${subject}] to=${to}: ${err instanceof Error ? err.message : String(err)}`;
    console.error(msg);
    return { success: false, error: msg };
  }
}

export async function sendAppointmentEmail(
  type: "confirmacion" | "cancelacion" | "reprogramacion",
  to: string,
  name: string,
  data: {
    serviceName: string;
    modality: string;
    date: string;
    time: string;
    duration: number;
    notes?: string | null;
    appointmentId?: string;
  },
): Promise<EmailResult> {
  const subjects: Record<string, string> = {
    confirmacion: "Reserva confirmada — Ana Reiki ✨",
    cancelacion: "Reserva cancelada — Ana Reiki",
    reprogramacion: "Reserva reprogramada — Ana Reiki",
  };

  const table = appointmentTable(data);

  const actionNote = type === "confirmacion"
    ? `<p style="color: #4a3b3e; font-size: 14px; line-height: 1.6;">Si necesitás cancelar o reprogramar, ingresá a tu panel de consultante con 24 hs de anticipación.</p>`
    : "";

  const html = emailLayout(subjects[type], `
    <h1 style="color: #c36b53; font-size: 24px; margin: 0 0 16px;">
      ${type === "confirmacion" ? "✅ Reserva confirmada" : type === "cancelacion" ? "❌ Reserva cancelada" : "🔄 Reserva reprogramada"}
    </h1>
    <p style="color: #4a3b3e; margin: 0 0 20px;">Hola ${name || "!"},</p>
    ${table}
    ${actionNote}
  `);

  const result = await sendEmail(to, subjects[type], html);
  if (!result.success) {
    console.error(`sendAppointmentEmail failed: type=${type} to=${to} service=${data.serviceName} date=${data.date} ${data.time}`);
  }
  return result;
}

export async function notifyAdminNewAppointment(data: {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  modality: string;
  date: string;
  time: string;
  duration: number;
}): Promise<EmailResult> {
  const subject = "Nueva reserva recibida — Ana Reiki ✨";

  const html = emailLayout(subject, `
    <h1 style="color: #c36b53; font-size: 24px; margin: 0 0 16px;">📅 Nueva reserva</h1>
    <p style="color: #4a3b3e; margin: 0 0 8px;"><strong>${data.clientName}</strong> agendó un turno:</p>
    <p style="color: #8b7a7d; font-size: 14px; margin: 0 0 20px;">${data.clientEmail}</p>
    ${appointmentTable({ serviceName: data.serviceName, modality: data.modality, date: data.date, time: data.time, duration: data.duration })}
    <a href="https://anamurat.online/admin/agenda"
       style="display: inline-block; background: #c36b53; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
      Ver en el panel
    </a>
  `);

  const supabaseModule = await import("@/lib/supabase/server");
  const supabase = await supabaseModule.createClient();
  const { data: admins } = await supabase
    .from("profiles")
    .select("email")
    .in("role", ["admin", "owner"])
    .not("email", "is", null);

  if (!admins || admins.length === 0) {
    console.warn("notifyAdminNewAppointment: no admin/owner emails found");
    return { success: false, error: "No admin emails found" };
  }

  const results = await Promise.allSettled(
    admins.filter(a => a.email).map(a => sendEmail(a.email!, subject, html)),
  );

  const failures = results.filter(r => r.status === "rejected");
  if (failures.length > 0) {
    console.error(`notifyAdminNewAppointment: ${failures.length}/${results.length} admin notifications failed`);
    return { success: false, error: `${failures.length} admin notifications failed` };
  }

  return { success: true };
}
