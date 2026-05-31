import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/roles";
import ClientProfile from "@/components/admin/ClientProfile";
import Link from "next/link";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdmin(user, supabase))) {
    redirect("/login");
  }

  const [profileResult, appointmentsResult, notesResult, reflectionsResult] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).single(),
      supabase
        .from("appointments")
        .select("*, services(name)")
        .eq("client_id", id)
        .order("start_time", { ascending: false }),
      supabase
        .from("session_notes")
        .select("*")
        .eq("user_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("daily_reflections")
        .select("*")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

  if (profileResult.error) {
    redirect("/admin/consultantes");
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link
        href="/admin/consultantes"
        className="text-sm font-bold text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1 group"
      >
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">
          arrow_back
        </span>
        Volver al Directorio
      </Link>

      <ClientProfile
        profile={profileResult.data}
        appointments={appointmentsResult.data || []}
        notes={notesResult.data || []}
        reflections={reflectionsResult.data || []}
      />
    </div>
  );
}
