import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateInsights } from "@/lib/openai";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const [moodsRes, notesRes, appointmentsRes] = await Promise.all([
      supabase
        .from("daily_reflections")
        .select("mood_score, intention, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("session_notes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("client_id", user.id),
    ]);

    const moods = (moodsRes.data || []).map((m) => ({
      score: m.mood_score,
      intention: m.intention,
      date: new Date(m.created_at).toLocaleDateString("es-AR"),
    }));

    if (moods.length < 3) {
      return NextResponse.json({
        summary: "Registrá al menos 3 días de ánimo para recibir insights personalizados.",
        trend: "insufficient_data",
        suggestion: "Usá el registro diario de ánimo para comenzar a ver patrones.",
      });
    }

    const insights = await generateInsights({
      moods,
      notesCount: notesRes.count || 0,
      appointmentsCount: appointmentsRes.count || 0,
    });

    return NextResponse.json(insights);
  } catch (err) {
    console.error("AI Insights error:", err);
    return NextResponse.json(
      { error: "Error al generar insights" },
      { status: 500 }
    );
  }
}
