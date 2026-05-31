import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateChatResponse } from "@/lib/openai";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Mensajes inválidos" }, { status: 400 });
    }

    const [moodsRes, notesRes] = await Promise.all([
      supabase
        .from("daily_reflections")
        .select("mood_score, intention, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("session_notes")
        .select("content")
        .eq("user_id", user.id)
        .eq("is_private", false)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const userContext = {
      recentMoods: (moodsRes.data || []).map((m) => ({
        score: m.mood_score,
        intention: m.intention,
        date: new Date(m.created_at).toLocaleDateString("es-AR"),
      })),
      notes: (notesRes.data || []).map((n) => n.content),
    };

    const reply = await generateChatResponse(messages.slice(-6), userContext);

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("AI Chat error:", err);
    return NextResponse.json(
      { error: "Error al generar respuesta" },
      { status: 500 }
    );
  }
}
