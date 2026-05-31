import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { segment, subject, content } = await request.json();

    if (!subject || !content) {
      return NextResponse.json(
        { error: "Asunto y contenido requeridos" },
        { status: 400 },
      );
    }

    let query = supabase.from("profiles").select("email, full_name");

    if (segment === "premium") {
      query = query.eq("is_premium", true);
    } else if (segment === "free") {
      query = query.eq("is_premium", false);
    }

    const { data: profiles, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json(
        { error: "No hay destinatarios para este segmento" },
        { status: 400 },
      );
    }

    const emailPromises = profiles.map((profile) =>
      resend.emails.send({
        from: "Ana Reiki <onboarding@resend.dev>",
        to: profile.email,
        subject,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #db2777;">${subject}</h1>
            <p>Hola ${profile.full_name || "!"},</p>
            <div style="color: #374151; line-height: 1.6;">
              ${content.replace(/\n/g, "<br/>")}
            </div>
            <hr style="margin: 32px 0; border-color: #f3f4f6;" />
            <p style="font-size: 12px; color: #9ca3af;">
              Si no deseas recibir más correos, puedes darte de baja respondiendo a este email.
            </p>
          </div>
        `,
      }),
    );

    const results = await Promise.allSettled(emailPromises);
    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: profiles.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 },
    );
  }
}
