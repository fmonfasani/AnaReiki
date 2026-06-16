import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

// POST: Submit a demo video for a lesson
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: courseId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const svc = createServiceClient();
  const { lesson_id, video_url, video_duration, title, notes } = await req.json();

  if (!lesson_id || !video_url) {
    return NextResponse.json({ error: "lesson_id y video_url requeridos" }, { status: 400 });
  }

  const { data: lesson } = await svc
    .from("course_lessons")
    .select("max_demo_duration")
    .eq("id", lesson_id)
    .single();

  if (lesson && video_duration && video_duration > lesson.max_demo_duration) {
    return NextResponse.json(
      { error: `El video supera el límite de ${Math.floor(lesson.max_demo_duration / 60)} minutos` },
      { status: 400 }
    );
  }

  const { data, error } = await svc
    .from("course_submissions")
    .insert({
      user_id: user.id,
      lesson_id,
      video_url,
      video_duration,
      title,
      notes,
      status: "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await svc
    .from("course_progress")
    .upsert(
      { user_id: user.id, lesson_id, status: "submitted", updated_at: new Date().toISOString() },
      { onConflict: "user_id,lesson_id" }
    );

  return NextResponse.json(data, { status: 201 });
}
