import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET: Course detail with user's progress
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const svc = createServiceClient();

  const { data: course, error } = await svc
    .from("courses")
    .select("*, course_modules(*, course_lessons(*))")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  const { data: progress } = await svc
    .from("course_progress")
    .select("*")
    .eq("user_id", user.id);

  const { data: submissions } = await svc
    .from("course_submissions")
    .select("*")
    .eq("user_id", user.id);

  return NextResponse.json({ course, progress: progress || [], submissions: submissions || [] });
}
