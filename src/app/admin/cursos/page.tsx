import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/roles";
import AdminCursosClient from "@/components/admin/AdminCursosClient";

export default async function AdminCursosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdmin(user, supabase))) redirect("/login");

  const svc = createServiceClient();
  const { data: courses } = await svc
    .from("courses")
    .select("*, course_modules(*, course_lessons(*))")
    .order("sort_order");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 font-display">Cursos</h1>
        <p className="text-gray-500">Creá módulos, clases y aprobá demos de consultantes.</p>
      </header>
      <AdminCursosClient initialCourses={courses || []} />
    </div>
  );
}
