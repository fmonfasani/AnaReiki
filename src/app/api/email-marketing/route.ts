import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAdmin } from "@/lib/auth/roles";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !(await isAdmin(user, supabase))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { segment, subject, content, tags } = await request.json();

    if (!subject || !content) {
      return NextResponse.json(
        { error: "Asunto y contenido requeridos" },
        { status: 400 },
      );
    }

    const svc = createServiceClient();
    let query = svc.from("profiles").select("email, full_name");

    if (segment === "premium") {
      query = query.eq("is_premium", true);
    } else if (segment === "free") {
      query = query.eq("is_premium", false);
    }

    if (tags && Array.isArray(tags) && tags.length > 0) {
      query = query.overlaps("tags", tags);
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

    const fromAddr = process.env.RESEND_FROM || "Ana Reiki <reservas@anamurat.online>";

    const emailPromises = profiles.map((profile) =>
      resend.emails.send({
        from: fromAddr,
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
    const failedResults = results.filter((r) => r.status === "rejected");
    const firstError = failedResults[0]?.reason;

    const { error: saveError } = await supabase.from("email_campaigns").insert({
      created_by: user.id,
      subject,
      segment,
      tags: tags || null,
      recipient_count: profiles.length,
      sent_count: sent,
      failed_count: failedResults.length,
    });

    if (saveError) {
      console.error("Failed to save campaign record:", saveError.message);
    }

    if (firstError) {
      const msg = firstError?.message || String(firstError);
      if (msg.includes("1010")) {
        return NextResponse.json({
          success: true, sent, failed: failedResults.length, total: profiles.length,
          warning: "Resend requiere verificar el dominio. Los emails no se entregarán hasta que configures los registros DNS.",
        });
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      failed: failedResults.length,
      total: profiles.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !(await isAdmin(user, supabase))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const svc = createServiceClient();
    const { data: campaigns, error } = await svc
      .from("email_campaigns")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: campaigns });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 },
    );
  }
}
