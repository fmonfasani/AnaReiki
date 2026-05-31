import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateRecommendations } from "@/lib/openai";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const [moodsRes, contentRes] = await Promise.all([
      supabase
        .from("daily_reflections")
        .select("mood_score, intention")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("content")
        .select("id, title, description, type, content_categories!left(name)")
        .eq("published_at", "published")
        .limit(20),
    ]);

    const moods = (moodsRes.data || []).map((m) => ({
      score: m.mood_score,
      intention: m.intention,
    }));

    const availableContent = (contentRes.data || []).map((c: any) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      type: c.type,
      category: c.content_categories?.name,
    }));

    if (moods.length < 3 || availableContent.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    const recs = await generateRecommendations({ moods, availableContent });

    const enriched = recs
      .map((r) => {
        const item = availableContent.find((c) => c.id === r.id);
        return item ? { ...item, reason: r.reason } : null;
      })
      .filter(Boolean);

    return NextResponse.json({ recommendations: enriched });
  } catch (err) {
    console.error("AI Recommendations error:", err);
    return NextResponse.json({ error: "Error al generar recomendaciones" }, { status: 500 });
  }
}
