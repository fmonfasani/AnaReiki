import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAdmin } from "@/lib/auth/roles";

export const runtime = "nodejs";

// GET: List pending submissions
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdmin(user, supabase))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const svc = createServiceClient();
  const status = req.nextUrl.searchParams.get("status") || "pending";

  const { data, error } = await svc
    .from("course_submissions")
    .select("*, course_lessons(title, lesson_type), profiles:user_id(full_name, email)")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PUT: Approve or reject a submission
export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdmin(user, supabase))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const svc = createServiceClient();
  const { submission_id, action, feedback } = await req.json();

  if (!submission_id || !["approved", "rejected"].includes(action)) {
    return NextResponse.json({ error: "submission_id y action (approved/rejected) requeridos" }, { status: 400 });
  }

  const { data: submission, error: fetchErr } = await svc
    .from("course_submissions")
    .select("*")
    .eq("id", submission_id)
    .single();

  if (fetchErr || !submission) {
    return NextResponse.json({ error: "Submission no encontrada" }, { status: 404 });
  }

  await svc
    .from("course_submissions")
    .update({
      status: action,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      feedback,
    })
    .eq("id", submission_id);

  if (action === "approved") {
    await svc.rpc("approve_lesson", {
      p_user_id: submission.user_id,
      p_lesson_id: submission.lesson_id,
      p_approved_by: user.id,
      p_feedback: feedback,
    });
  } else {
    await svc
      .from("course_progress")
      .upsert(
        {
          user_id: submission.user_id,
          lesson_id: submission.lesson_id,
          status: "rejected",
          feedback,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_id" }
      );
  }

  return NextResponse.json({ ok: true, action });
}
