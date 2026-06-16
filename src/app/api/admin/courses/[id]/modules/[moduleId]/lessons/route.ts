import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAdmin } from "@/lib/auth/roles";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  const { moduleId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdmin(user, supabase))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const svc = createServiceClient();
  const body = await req.json();

  const { data, error } = await svc
    .from("course_lessons")
    .insert({
      module_id: moduleId,
      title: body.title,
      description: body.description,
      lesson_type: body.lesson_type || "theory",
      video_url: body.video_url,
      video_duration: body.video_duration,
      content: body.content,
      quiz_data: body.quiz_data,
      max_demo_duration: body.max_demo_duration || 900,
      sort_order: body.sort_order || 0,
      is_required: body.is_required ?? true,
      is_active: body.is_active ?? true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  const { moduleId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdmin(user, supabase))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const svc = createServiceClient();
  const body = await req.json();
  const lessonId = body.lessonId;
  if (!lessonId) {
    return NextResponse.json({ error: "lessonId requerido" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  for (const key of ["title", "description", "lesson_type", "video_url", "video_duration", "content", "quiz_data", "max_demo_duration", "sort_order", "is_required", "is_active"]) {
    if (body[key] !== undefined) updateData[key] = body[key];
  }

  const { data, error } = await svc
    .from("course_lessons")
    .update(updateData)
    .eq("id", lessonId)
    .eq("module_id", moduleId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  const { moduleId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdmin(user, supabase))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const lessonId = searchParams.get("lessonId");
  if (!lessonId) {
    return NextResponse.json({ error: "lessonId requerido" }, { status: 400 });
  }

  const svc = createServiceClient();
  const { error } = await svc
    .from("course_lessons")
    .delete()
    .eq("id", lessonId)
    .eq("module_id", moduleId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
