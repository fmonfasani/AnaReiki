import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/roles";
import AdminAprobacionesClient from "@/components/admin/AdminAprobacionesClient";

export default async function AdminAprobacionesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdmin(user, supabase))) redirect("/login");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 font-display">Aprobaciones Pendientes</h1>
        <p className="text-gray-500">Revisá los videos demo de consultantes y aprobá o rechazá.</p>
      </header>
      <AdminAprobacionesClient />
    </div>
  );
}
