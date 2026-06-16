import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/roles";
import AdminSubscriptionsClient from "@/components/admin/AdminSubscriptionsClient";

export default async function AdminSuscripcionesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdmin(user, supabase))) redirect("/login");

  const svc = createServiceClient();
  const [{ data: plans }, { data: services }] = await Promise.all([
    svc.from("pricing_plans").select("*, subscription_promotions(*)").order("sort_order", { ascending: true }),
    svc.from("services").select("id, name, slug").eq("is_active", true).order("name"),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 font-display">Gestión de Suscripciones</h1>
        <p className="text-gray-500">Configurá planes, precios anuales, features y promociones.</p>
      </header>
      <AdminSubscriptionsClient initialPlans={plans || []} services={services || []} />
    </div>
  );
}
