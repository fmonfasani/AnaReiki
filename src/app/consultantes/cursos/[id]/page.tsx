import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect, notFound } from "next/navigation";
import CursoDetailClient from "@/components/consultantes/CursoDetailClient";

export default async function CursoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const svc = createServiceClient();

  const { data: course, error } = await svc
    .from("courses")
    .select("*, course_modules(*, course_lessons(*))")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (error || !course) notFound();

  const { data: progress } = await svc
    .from("course_progress")
    .select("*")
    .eq("user_id", user.id);

  const { data: submissions } = await svc
    .from("course_submissions")
    .select("*")
    .eq("user_id", user.id);

  // Initialize progress if first time
  if (!progress || progress.length === 0) {
    await svc.rpc("initialize_course_progress", {
      p_user_id: user.id,
      p_course_id: id,
    });

    const { data: freshProgress } = await svc
      .from("course_progress")
      .select("*")
      .eq("user_id", user.id);

    return (
      <CursoDetailClient
        data={{
          course,
          progress: freshProgress || [],
          submissions: submissions || [],
        }}
      />
    );
  }

  return (
    <CursoDetailClient
      data={{
        course,
        progress: progress || [],
        submissions: submissions || [],
      }}
    />
  );
}
